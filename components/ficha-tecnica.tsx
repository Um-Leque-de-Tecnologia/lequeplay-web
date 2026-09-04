import type { ReactNode } from "react";
import { apresentacaoDe, direcaoDe, elencoDe } from "@/lib/creditos";
import type { Classificacao, Midia } from "@/lib/tipos";

/**
 * `107` vira `1h47`, não `107` nem `1h 47min`.
 *
 * O número cru é resposta para "quantos minutos?", que ninguém pergunta na
 * ficha de um filme; quem lê quer saber se cabe antes do jantar. Os minutos
 * vão com dois dígitos porque `1h47` e `1h7` lidos rápido parecem a mesma
 * grandeza — o zero à esquerda mantém o formato de relógio, que é como a
 * pessoa já lê duração.
 *
 * Redondo não ganha `00`: `120` é `2h`, e não `2h00`. E abaixo de uma hora
 * não existe `0h`: `47` é `47min`, com a unidade escrita, senão o número
 * sozinho não diz de que unidade se trata.
 */
function formatarDuracao(min: number): string {
  const horas = Math.floor(min / 60);
  const minutos = min % 60;

  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;

  return `${horas}h${String(minutos).padStart(2, "0")}`;
}

/**
 * O que a faixa etária vira na tela.
 *
 * `"L"` é o único valor que não é idade, e é por causa dele que isto é um
 * mapa e não um `${classificacao} anos`: "L anos" não quer dizer nada.
 *
 * Forma curta ("14 anos"), e não a frase inteira da classificação
 * indicativa: ao lado do rótulo "Classificação" ela já se entende, e a frase
 * longa quebra em quatro linhas num celular — a ficha inteira empurrada para
 * baixo por um campo de duas palavras.
 */
const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  L: "Livre",
  "10": "10 anos",
  "12": "12 anos",
  "14": "14 anos",
  "16": "16 anos",
  "18": "18 anos",
};

/** Quantos nomes do elenco cabem na ficha antes de virar lista. */
const NOMES_NO_ELENCO_PRINCIPAL = 3;

/**
 * Uma linha da ficha — ou nenhuma.
 *
 * Campo ausente some **junto com o rótulo**: `dt` e `dd` saem os dois, e não
 * sobra "Direção —" nem uma definição vazia. Numa `<dl>`, termo sem definição
 * é anunciado pelo leitor de tela como campo em branco, o que é pior do que
 * não anunciar o campo: o primeiro diz "existe e está vazio", o segundo diz
 * "não sabemos", e é o segundo que é verdade.
 *
 * A decisão mora aqui, num lugar só, porque ela vale para todo campo
 * opcional da ficha — e a versão anterior repetia o `&&` em cada bloco, o que
 * fazia da regra uma convenção, não uma garantia.
 */
function Campo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  const ausente =
    valor === undefined ||
    valor === null ||
    // `""` da API é dado sujo, não "sem valor" — mas na tela dá no mesmo:
    // rótulo com definição em branco. Some igual.
    (typeof valor === "string" && valor.trim() === "");

  if (ausente) return null;

  return (
    <>
      <dt className="text-zinc-500">{rotulo}</dt>
      {/* `min-w-0` + `break-words`: nome comprido quebra dentro da coluna em
          vez de esticar a grade e empurrar a ficha para fora da tela. */}
      <dd className="min-w-0 break-words">{valor}</dd>
    </>
  );
}

/**
 * A ficha muda conforme o título — mas por dois motivos diferentes, e vale
 * separar: o que muda por **tipo** (temporadas só em série) sai do narrowing
 * do `tipo`; o que muda por **presença** (duração, classificação, direção,
 * elenco) sai do `Campo`, que some com a linha inteira quando o dado falta.
 * Usar o tipo para decidir o que existe esconderia dado que existe — série
 * também tem direção creditada.
 */
export function FichaTecnica({ midia }: { midia: Midia }) {
  // Direção, apresentação e elenco saem todos de `creditos`, que só vem no
  // detalhe. No catálogo eles não existem, e por isso as listas podem voltar
  // vazias mesmo num filme — o `Campo` cuida de sumir com a linha.
  const direcao = direcaoDe(midia.creditos);
  const apresentacao = apresentacaoDe(midia.creditos);
  const elenco = elencoDe(midia.creditos);

  const principais = elenco.slice(0, NOMES_NO_ELENCO_PRINCIPAL);
  const restante = elenco.length - principais.length;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <Campo rotulo="Ano" valor={midia.ano} />

      <Campo
        // O rótulo acompanha a cardinalidade: um gênero, "Gênero".
        rotulo={midia.generos.length > 1 ? "Gêneros" : "Gênero"}
        /*
          `generos` é lista, então precisa virar texto. Separador escolhido:
          vírgula e espaço — e não " · ", que o resto da página usa. O ponto
          do meio é invisível para leitor de tela (ele lê "Drama Suspense",
          como se fosse um gênero só de nome comprido); a vírgula é lida como
          pausa e mantém a enumeração audível. Em ficha técnica, a lista
          precisa soar como lista.
        */
        valor={midia.generos.join(", ")}
      />

      {/*
        A duração pode faltar: a API omite `duracaoMin` quando não tem o
        número — na produção, toda série sem runtime na TMDB vem sem ele.
        Formatar antes de passar, e não dentro do `Campo`, é o que mantém
        `formatarDuracao` recebendo `number` de verdade: sem isto ela pegaria
        `undefined` e escreveria "NaNmin" na ficha.
      */}
      <Campo
        rotulo="Duração"
        valor={
          midia.duracaoMin === undefined
            ? undefined
            : formatarDuracao(midia.duracaoMin)
        }
      />

      {/* Título ainda não classificado vem sem a chave — e some da ficha. */}
      <Campo
        rotulo="Classificação"
        valor={
          midia.classificacao === undefined
            ? undefined
            : ROTULO_CLASSIFICACAO[midia.classificacao]
        }
      />

      {/*
        Direção e apresentação não são checadas por `tipo`, e sim por
        presença: quem responde "tem direção?" é o crédito, não o
        discriminador. Documentário de série também tem direção creditada, e
        um `midia.tipo === "filme"` a esconderia sem motivo.
      */}
      {/* "Direção" não flexiona como "Gênero/Gêneros": o rótulo já é o nome
          da função, e serve para um diretor ou para dois. */}
      <Campo rotulo="Direção" valor={direcao.join(", ")} />
      <Campo rotulo="Apresentação" valor={apresentacao.join(", ")} />

      {/*
        O elenco inteiro mora na aba "Elenco", com os personagens; aqui vêm só
        os primeiros nomes. É a mesma duplicação de apresentação da sinopse:
        um dado, duas leituras — a de quem passa o olho na ficha e a de quem
        foi atrás da lista completa. O "e mais N" existe para a primeira não
        parecer a lista toda.
      */}
      <Campo
        rotulo="Elenco principal"
        valor={
          principais.length === 0
            ? undefined
            : principais.map((c) => c.pessoa.nome).join(", ") +
              (restante > 0 ? ` e mais ${restante}` : "")
        }
      />

      {/* O narrowing por `tipo` continua onde o campo é mesmo do tipo. */}
      {midia.tipo === "serie" && (
        <Campo rotulo="Temporadas" valor={midia.temporadas.length} />
      )}
      {midia.tipo === "podcast" && (
        <Campo rotulo="Episódios" valor={midia.totalEpisodios} />
      )}
    </dl>
  );
}
