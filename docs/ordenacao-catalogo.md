# Ordenação do catálogo: o que a tela promete enquanto a API não ordena

Decisão do LP-605. Vale até a API aceitar `?ordem=` em `GET /v1/midias`. O
pedido está no fim deste documento.

---

## O problema

O "Ordenar por" de `/midias` ordena **no navegador** os itens que chegaram. A
API, porém, manda uma **página**: 20 itens por padrão, em ordem de
popularidade. Ordenar uma página não é ordenar o catálogo. "A-Z" na página 1
põe em ordem alfabética os 20 mais populares, e não os 20 primeiros do
alfabeto.

A API não tinha como ajudar: `GET /v1/midias` ordena só por popularidade
decrescente, e `?ordem=az` é **ignorado em silêncio** (conferido em
23/09/2026). E "Relevância", o padrão do menu, era na verdade popularidade:
ninguém calcula relevância nenhuma.

### Reproduzido

O mock tem 9 títulos. Simulando `porPagina=4`, com os comparadores copiados
de `components/catalogo-grade.tsx`, **as três ordens feitas no navegador
erram**, e não só o A-Z:

| `?ordem=` | a página 1 mostrava | deveria mostrar | ficaram de fora |
| --- | --- | --- | --- |
| `az` | A Última Linha, Protocolo Aberto, Quintal de Inverno, Sinais de Carbono | A Última Linha, Cozinha de Madrugada, Mapa das Marés, Onde o Rio Vira | 3 de 4 |
| `nota` | Protocolo Aberto (9.1), … | **Revisão de Código (9.3)**, Protocolo Aberto, … | o título de nota mais alta |
| `recentes` | Quintal de Inverno (2025), … | **Mapa das Marés (2026)**, … | o único título de 2026 |

"Melhor avaliados" sem o melhor avaliado, e "Mais recentes" sem o mais
recente. Nada na tela denuncia o erro: a lista está ordenada, só que é a
lista errada.

**Isso não espera o LP-604.** A página do catálogo não manda `porPagina`, então
a API real já devolve 20 itens. Com mais de 20 títulos no catálogo, o erro já
estava no ar.

---

## A decisão: limitar

**Critério:** a tela só oferece uma ordem que ela consegue **garantir para o
resultado inteiro**. Ordenar no navegador é exato quando o navegador tem o
resultado inteiro, e só nesse caso:

```ts
resultadoCompleto = pagina === 1 && itens.length >= total
```

- **Resultado inteiro** (um filtro que cabe numa página): o menu aparece com
  as quatro ordens, e elas são exatas.
- **Resultado paginado:** o menu some. No lugar dele, a tela diz a ordem que
  está valendo, "Mais populares primeiro", porque é a única que a API
  garante.
- **Busca** (desde o LP-607, que trocou o `?q=` da listagem por
  `GET /v1/busca`): o menu some também. A busca devolve os primeiros de um
  ranking, sem `total` e sem página seguinte — é o caso da página de novo:
  "A-Z" em cima dela põe em ordem alfabética os mais relevantes. A frase diz
  "Mais relevantes primeiro", porque ali a ordem da API é a relevância, e não
  a popularidade.
- **Link com `?ordem=az` num resultado paginado:** a tela não finge atender.
  Mostra a ordem da API e diz por que o A-Z não está disponível ali, e como
  chegar nele (filtrar). Na busca, diz que a ordem não se aplica.

"Relevância" passou a se chamar **"Mais populares"**, com o valor interno
`populares`. Como o padrão nunca vai para a URL (sem `?ordem=`, a URL fica
limpa), nenhum link compartilhado quebra. E um `?ordem=relevancia` escrito à
mão cai no padrão, como qualquer valor desconhecido.

### As alternativas descartadas

- **Manter e avisar** ("a ordem vale só para esta página"). Continua mostrando
  uma ordem errada, só que com um aviso ao lado. O aceite do card é
  justamente que a tela não mostre ordem que não garante. Além disso, um
  aviso ao lado de uma lista bem arrumada ninguém lê.
- **Esconder sempre.** Tiraria uma função que funciona: com filtro ou busca,
  o resultado costuma caber numa página, e aí ordenar no navegador é exato.
- **Buscar o catálogo inteiro e ordenar no front.** O máximo é
  `porPagina=100`, e seria preciso encadear páginas. Isso vira N chamadas por
  visita para contornar o que é trabalho do banco, e desmonta a paginação que
  o LP-604 está construindo.

### Onde isto mora no código

- [`app/midias/(catalogo)/page.tsx`](../app/midias/(catalogo)/page.tsx)
  calcula `resultadoCompleto` a partir do envelope `Pagina<Midia>`. O `total` é
  o que diz se a página tem tudo. Na busca ele é sempre `false`, e a página
  avisa a grade que a ordem da API é a relevância (`ordemDaApi`).
- [`components/catalogo-grade.tsx`](../components/catalogo-grade.tsx) decide
  entre o menu e a frase, e ignora `?ordem=` quando não pode cumprir.
- [`components/catalogo-ordenacao.tsx`](../components/catalogo-ordenacao.tsx)
  guarda o menu, agora com "Mais populares".

### Quando a API entregar o pedido abaixo

1. `listarMidias` passa `ordem` adiante (ela já monta a query a partir dos
   filtros).
2. O `useMemo` de ordenação da grade sai. A ordem vem pronta do servidor, e a
   troca de ordem vira navegação (`router.push`), e não `pushState`, porque
   trocar a ordem passa a exigir itens novos.
3. `resultadoCompleto` deixa de ser necessário, e o menu volta a aparecer sempre.

---

## Pedido à API: `?ordem=` em `GET /v1/midias` 🕓

| | |
| --- | --- |
| **Parâmetro** | `ordem` |
| **Valores aceitos** | `populares`, `recentes`, `nota`, `az` |
| **Padrão (ausente)** | `populares`, que é exatamente a ordem de hoje. Quem não manda o parâmetro não percebe mudança nenhuma |
| **Valor desconhecido** | `400`, no formato RFC 7807 que a API já usa, com `detail` listando os valores aceitos |
| **Combina com** | `tipo`, `genero`, `ano`, `q` e a paginação. Ordena o resultado **filtrado**, antes de cortar a página |

### O que cada valor significa

| `ordem` | critério | desempate |
| --- | --- | --- |
| `populares` | `popularidade` decrescente | `titulo`, depois `id` |
| `recentes` | `ano` decrescente; **sem ano vai para o fim** | `popularidade` decrescente, depois `id` |
| `nota` | quem tem avaliação antes de quem não tem; depois `notaMedia` decrescente | `totalAvaliacoes` decrescente, depois `id` |
| `az` | `titulo` crescente, comparado sem diferenciar maiúscula e acento ("Última" ao lado de "Ultima", e não depois do "Z") | `id` |

**Por que o último desempate é sempre `id`:** com paginação, a ordem precisa
ser **total**. Se dois títulos empatam em tudo, o banco pode devolvê-los em
ordem diferente a cada consulta. Aí um título aparece na página 1 *e* na 2,
e outro não aparece em nenhuma.

**Por que "sem avaliação" separado de "nota 0":** título sem avaliação vem
com `notaMedia: 0`, que empataria com uma nota zero de verdade. Quem separa
os dois casos é `totalAvaliacoes > 0`, e o front já faz assim hoje.

**Por que `400`, e não ignorar o valor desconhecido:** ignorar em silêncio é o
comportamento de hoje, e foi ele que fez `?ordem=az` *parecer* aceito. A
resposta vinha 200, em outra ordem, e nada avisava. Com `400`, o erro aparece
no primeiro teste. O front não é afetado: ele só manda valores da sua própria
lista (`lerOrdem` descarta o resto antes).

---

## Fora deste card

O contador da grade (`{itens.length} título(s)`) conta a **página**, e não o
resultado. Com paginação, o catálogo inteiro aparece como "20 título(s)". O
número certo é o `total` do envelope. Fica registrado aqui para o LP-604, que
é quem mexe na paginação.
