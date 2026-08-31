# Como a gente trabalha

Este documento é o combinado do time. Ele existe para que a revisão do seu
Pull Request seja sobre **as suas decisões**, e não sobre nome de branch,
vírgula ou build quebrado — coisas que dá para resolver sozinha antes.

Leia uma vez inteiro. Depois use a [colinha do fim](#colinha) no dia a dia.

---

## 1. Antes de escrever a primeira linha

**Leia o card até o fim, inclusive os critérios de aceite.** Eles não são
enfeite: são exatamente o que vai ser conferido na revisão.

**Leia a parte do [`docs/api-contrato.md`](docs/api-contrato.md) que cobre o
seu ticket.** Metade dos bugs deste projeto nasce de supor o formato de um
dado em vez de conferir.

**Puxe a `main` antes de criar a branch.** Começar de uma `main` velha é o
jeito mais fácil de criar um conflito que ninguém precisava ter.

```bash
git switch main
git pull
```

---

## 2. A branch

Um ticket, uma branch, um Pull Request. Nunca duas coisas na mesma branch —
mesmo que sejam pequenas, mesmo que estejam no mesmo arquivo.

```
tipo/lp-NNN-descricao-curta
```

O código do card no meio não é burocracia: é o que liga a branch ao ticket
sem ninguém precisar procurar.

```bash
git switch -c fix/lp-101-contador-e-filtro
git switch -c feat/lp-205-ficha-do-filme
git switch -c chore/lp-212-auditoria-de-tipos
```

Os tipos são os mesmos dos commits, logo abaixo. Cada card do Trello já traz
o nome da branch pronto no rodapé — copie de lá.

Tudo em minúsculas, separado por hífen. Sem acento, sem espaço, sem cedilha.

---

## 3. Os commits

A gente usa [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
O formato:

```
tipo(lp-NNN): descrição no imperativo, minúscula, sem ponto final
```

O escopo entre parênteses é o código do ticket. Assim qualquer commit responde
sozinho de onde veio, seis meses depois.

### Os tipos

| Tipo | Quando usar |
| --- | --- |
| `feat` | funcionalidade nova para quem usa o produto |
| `fix` | correção de bug |
| `refactor` | muda o código sem mudar o comportamento |
| `perf` | melhora desempenho |
| `test` | adiciona ou corrige teste |
| `docs` | só documentação |
| `style` | só formatação, sem efeito nenhum no comportamento |
| `build` | dependências, configuração de build |
| `ci` | esteira do GitHub Actions |
| `chore` | manutenção que não encaixa em nada acima |

### Exemplos

```
fix(lp-101): contador do acervo passa a vir da API
feat(lp-205): ficha do filme mostra diretor, duração e elenco
refactor(lp-215): unifica o cartão de mídia usado em cinco telas
test(lp-816): cobre o fluxo de entrar, avaliar e ver no perfil
```

E o que **não** serve:

```
ajustes                    ← ajustes do quê?
wip                        ← não deixe trabalho pela metade na branch final
correções finais           ← "final" não existe
fix: consertei o bug       ← qual bug?
Fix(LP-101): Contador.     ← maiúscula, ponto final, escopo em caixa alta
```

### O corpo do commit

O assunto cabe em 72 caracteres e diz **o que** mudou. Quando o *porquê* não
for óbvio, pule uma linha e escreva:

```
fix(lp-213): trata título sem avaliação em vez de dividir por zero

A média era soma/quantidade, e título recém-cadastrado tem quantidade zero —
daí o NaN na grade e na ficha.

Escolhi "ainda não avaliado" em vez de 0,0 porque zero é uma nota, e uma nota
péssima. Ausência de informação não pode virar informação ruim.
```

Esse texto é o rascunho da descrição do seu PR. Escrevendo bem aqui, o PR sai
quase pronto.

### Quantos commits

Quantos fizerem sentido para quem revisa. Um commit gigante "resolve o ticket"
é difícil de revisar; quarenta commits de uma linha também. Se você fez bagunça
no caminho — e todo mundo faz —, arrume antes de empurrar.

---

## 4. Antes de abrir o Pull Request

Esta é a parte que mais importa deste documento. **Rode tudo isto na sua
máquina, nesta ordem.** É exatamente o que a esteira vai rodar — só que aqui a
resposta chega em segundos, e lá em minutos.

```bash
npm ci             # se você mexeu em dependência; senão, npm install
npm run lint       # ESLint
npm run typecheck  # next typegen && tsc --noEmit
npm run build      # build de produção
npm test           # quando existir teste no projeto
```

> **Por que `typecheck` e não só `tsc`?** `PageProps` e `LayoutProps` são
> tipos que o Next gera a partir das suas rotas. Rodar `tsc` sozinho acusa
> erro em arquivo que está correto. O script já faz os dois na ordem certa.

Passou tudo? Falta o que nenhum comando pega:

- [ ] **Abri o produto e usei a minha mudança.** Não é retórico: o build passa
      em tela que não funciona.
- [ ] **Testei o caso de borda**, não só o caminho feliz. Título sem capa, sem
      nota, lista vazia, API fora do ar.
- [ ] **Naveguei pelo teclado.** Tab chega no que eu criei, o foco é visível,
      Esc fecha o que abre.
- [ ] **Li o meu próprio diff**, com `git diff main...HEAD`. Sobrou
      `console.log`, código comentado, arquivo que não era para estar aí?
- [ ] **Não tem `any` nem `!`** para calar o compilador.
- [ ] **Se usei Copilot, revisei linha a linha** e sei explicar o que ficou.

Ler o próprio diff antes de pedir revisão é o hábito que mais separa quem está
começando de quem já trabalhou em time. Você vai achar coisa.

---

## 5. O Pull Request

**Título:** a mesma regra do commit — `fix(lp-101): contador do acervo passa a
vir da API`.

**Descrição:** o template abre com as perguntas certas. A seção que mais pesa é
**"a decisão que eu tomei"** — por que este componente é server e não client,
por que este dado é cacheado e aquele não, por que a validação ficou aqui e não
ali.

Todo ticket deste projeto tem pelo menos uma escolha dessas. Se você não
consegue encontrar a sua, provavelmente copiou uma resposta sem entender — e é
melhor descobrir isso agora do que na revisão.

**PR pequeno é revisado melhor.** Um PR de 80 linhas recebe comentário útil; um
de 800 recebe "lgtm". Se o seu ficou grande, ou o ticket era grande mesmo (tudo
bem — diga isso na descrição), ou entrou coisa que não era do ticket.

**Ainda não terminou?** Abra como **draft**. Sinaliza que você quer olhos no
caminho, não aprovação.

**Não misture formatação com lógica.** Reindentar um arquivo inteiro junto com
a correção esconde a correção. Se precisar formatar, faça em outro commit — e
avise no PR.

---

## 6. A esteira

Todo PR roda quatro checagens no GitHub Actions, e **as quatro precisam passar**
para o merge ser possível.

| Job | O que faz | Rode antes com |
| --- | --- | --- |
| `Lint` | ESLint | `npm run lint` |
| `Tipos` | gera os tipos de rota e checa TypeScript | `npm run typecheck` |
| `Build` | build de produção | `npm run build` |
| `Testes` | roda os testes, se existirem | `npm test` |

A esteira constrói com `USAR_MOCK=true`: ela não depende da API estar de pé.

**Ficou vermelho?** Abra o job e leia o log de baixo para cima — a primeira
mensagem de erro real costuma estar acima de bastante ruído. Reproduza na sua
máquina com o comando da tabela, corrija, commite e empurre. A esteira roda de
novo sozinha.

**O que não fazer:** empurrar de novo sem mudar nada, esperando que passe. Se
passou na segunda tentativa sem você mexer em nada, existe um teste instável —
e isso é coisa para contar, não para ignorar.

---

## 7. Revisar o PR de outra pessoa

Revisar é metade do trabalho de quem desenvolve, e quase ninguém treina. Neste
projeto você vai revisar.

**O que vale comentar:** algo que quebra, algo que você não entendeu, algo que
vai doer daqui a dois meses, algo que você aprendeu lendo.

**Faça pergunta em vez de sentença.** "Por que este componente é client?" abre
conversa. "Isso está errado" fecha.

**Elogie específico.** "Ficou bom" não ensina nada. "Gostei de você ter tratado
a capa ausente no tipo em vez de no componente — assim o compilador cobra em
todo lugar" ensina duas pessoas.

**Separe o que trava do que é gosto.** Se é preferência sua, diga que é:
"opinião, pode ignorar". Quem recebe precisa saber o que barra o merge e o que
não barra.

O **Copilot Code Review** comenta antes de qualquer humano. Ele é um leitor
rápido que erra: responda cada apontamento — aceito, ou recusado com o motivo.
Quem decide é você.

---

## 8. Depois do merge

A `main` é protegida: exige Pull Request, exige as quatro checagens verdes e
**só uma pessoa mergeia**. Ninguém empurra direto nela, nem por engano, nem com
pressa.

Depois que o seu PR entrar:

```bash
git switch main
git pull
git branch -d fix/lp-101-contador-e-filtro
```

E mova o card no Trello. Board desatualizado faz o time trabalhar duas vezes no
mesmo ticket.

---

## 9. O que nunca vai para o repositório

- **`.env.local`**, ou qualquer arquivo com segredo. O `.gitignore` cobre, mas
  confira o diff.
- **Chave de API dentro do código**, inclusive "só para testar". Chave que foi
  commitada uma vez está comprometida para sempre — apagar depois não desfaz.
  Avise na hora para ser trocada.
- **`node_modules/`** e `.next/`.
- **Código comentado** "para o caso de precisar depois". O git já guarda.
- **`console.log`** de depuração.

---

## Colinha

```bash
# começar
git switch main && git pull
git switch -c fix/lp-NNN-descricao-curta

# antes de abrir o PR
npm run lint
npm run typecheck
npm run build
npm test
git diff main...HEAD           # leia o próprio diff

# commitar e empurrar
git commit -m "fix(lp-NNN): descrição no imperativo"
git push -u origin fix/lp-NNN-descricao-curta
```

Dúvida sobre convenção que este documento não cobre: pergunte no PR. A resposta
vira uma linha aqui.
