# LequePlay — web

Bem-vinda ao time. 👋

Este é o front-end do **LequePlay**, um catálogo de filmes, séries e
podcasts. Ele **não é dono dos dados**: quem guarda o catálogo, as contas e
as avaliações é a nossa API. Aqui a gente cuida do que a pessoa vê.

Se você acabou de chegar, comece por este arquivo até o fim. Deve levar uns
dez minutos.

---

## Subindo o projeto

Você precisa do **Node 20.9+**.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra <http://localhost:3000>.

### Sobre o `.env.local`

```bash
API_URL=http://localhost:8080
USAR_MOCK=true
```

Com `USAR_MOCK=true`, o front serve os dados de `data/midias.json` e roda
**sem depender da API**. É assim que dá para trabalhar numa tela mesmo com o
backend fora do ar.

Quando for consumir a API de verdade, mude para `USAR_MOCK=false` e aponte a
`API_URL`. **Nenhuma tela muda** — quem troca a fonte é o `lib/api.ts`.

---

## Onde as coisas ficam

```
app/                    rotas (App Router — pasta vira endereço)
  layout.tsx            moldura do site: cabeçalho, rodapé, "pular conteúdo"
  page.tsx              a home
  midias/
    page.tsx            o catálogo
    [slug]/page.tsx     a página de um título
components/             componentes reutilizáveis
lib/
  tipos.ts              o domínio: Midia, Filme, Serie, Podcast
  api.ts                ⭐ TODO acesso à API passa por aqui
docs/
  api-contrato.md       ⭐ o contrato com o backend — leia antes de codar
data/midias.json        catálogo de mentira, usado quando USAR_MOCK=true
public/capas/           imagens
```

### A regra mais importante

**Componente não chama `fetch` direto.** Tudo passa por `lib/api.ts`.

Não é preciosismo: é o que mantém a URL da API, o tratamento de erro e as
tags de cache num lugar só. No dia em que a API mudar um endpoint, a gente
edita um arquivo — não caça `fetch` espalhado por vinte telas.

---

---

## A API

O contrato está em [`docs/api-contrato.md`](docs/api-contrato.md): endpoints,
formato de erro, paginação e os casos de borda que ela produz de propósito —
título sem nota, título sem capa, busca sem resultado. **É a primeira leitura
de quem chega.**

---

## Como a gente trabalha

Você pega um card do backlog, resolve numa branch e abre um Pull Request.

```bash
git switch -c feat/nome-curto     # ou fix/nome-curto
# … código …
npm run build                     # tem que passar antes do push
git push -u origin feat/nome-curto
```

Abra o PR. O template já traz as perguntas que a revisão vai fazer.

**A descrição do PR importa tanto quanto o código.** A parte que a gente lê
primeiro é *"a decisão que eu tomei"* — por que este componente é server e
não client, por que este dado é cacheado e aquele não. Código sem
justificativa passa; justificativa é o que faz a pessoa crescer.

O **Copilot Code Review** roda automaticamente e comenta antes de qualquer
humano olhar. Trate como o que é: um primeiro leitor rápido, que erra. Você
decide o que aceitar.

---

## Sobre usar IA neste projeto

É **liberado e esperado**. As convenções que o Copilot segue aqui estão em
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) — leia,
porque elas moldam o que ele vai te sugerir.

Duas regras:

**Você é responsável pelo que entrega.** Código que você não sabe explicar
não vai para o PR. Não é uma regra moral — é que na revisão, e na entrevista,
quem responde é você.

**Desconfie do que ele diz sobre Next.** O Next 16 mudou bastante em relação
ao que os modelos viram no treino. O arquivo `AGENTS.md` na raiz existe
justamente para avisar isso, e a documentação da versão instalada está em
`node_modules/next/dist/docs/`. Quando a sugestão divergir da doc local, a
doc local ganha.

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | sobe em modo desenvolvimento |
| `npm run build` | build de produção — **rode antes de todo push** |
| `npm start` | serve o build |
| `npm run lint` | ESLint |

---

## Coisas que a gente já sabe que estão faltando

Não são bugs escondidos — é o backlog. Alguns viram seus tickets.

- A navegação de **temporada e episódio** não existe. A série mostra a lista
  de temporadas e para por aí.
- A **busca** só encontra título exato. Quem procura "algo leve para assistir
  cansada" não acha nada.
- Não há **login** nem perfil, então não dá para avaliar, marcar como
  assistido ou montar uma lista.
- O catálogo **não tem paginação**.
- Não há **testes**.
