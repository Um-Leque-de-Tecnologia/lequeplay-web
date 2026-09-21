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
  tipos.ts              o domínio: Midia, Resenha, Lista, Diario…
  api.ts                ⭐ TODO acesso à API passa por aqui
docs/
  api-contrato.md       ⭐ o contrato com o backend — leia antes de codar
  server-actions-seguranca.md  o que o Next garante e o que é seu
data/midias.json        catálogo de mentira, usado quando USAR_MOCK=true
public/capas/           imagens
```

### A regra mais importante

**Componente não chama `fetch` direto.** Tudo passa por `lib/api.ts`.

Não é preciosismo: é o que mantém a URL da API, o tratamento de erro e as
tags de cache num lugar só. No dia em que a API mudar um endpoint, a gente
edita um arquivo — não caça `fetch` espalhado por vinte telas.

---

## A API

O contrato está em [`docs/api-contrato.md`](docs/api-contrato.md): endpoints,
formato de erro, paginação e os casos de borda que ela produz de propósito —
título sem nota, título sem capa, busca sem resultado. **É a primeira leitura
de quem chega.**

### Quanto tempo uma mudança no catálogo leva para aparecer

**No pior caso, uma hora.** É o `revalidate` de 3600 segundos que o
`lib/api.ts` usa no catálogo, na ficha e nos gêneros.

Mas esse é o **teto**, não o normal. O caminho normal é a invalidação sob
demanda: a API incrementa `GET /v1/catalogo/versao` a cada ingestão, e o vigia
(`POST /api/vigia-do-catalogo`) compara com a última versão que viu e solta a
etiqueta `midias` quando ela muda. Com o vigia rodando de cinco em cinco
minutos, a mudança aparece em cinco minutos; a hora só entra em cena se ele
estiver parado.

Uma leitura que confunde muita gente: `revalidate: 3600` promete *"não busco
de novo antes de uma hora"*, e **não** *"o que você vê tem no máximo uma
hora"*. Se ninguém visitar a página por um dia, o que está guardado tem um
dia.

O esquema das etiquetas está em [`docs/cache-tags.md`](docs/cache-tags.md).
Resposta de uma pessoa nunca entra em cache compartilhado — quem trabalha com
sessão deve ler também o documento da próxima seção.
Dado de uma pessoa — o histórico — não é cacheado (`revalidate: 0`), e a
versão do catálogo nunca é (`cache: "no-store"`), porque um vigia que lê valor
guardado não vigia nada.

---

## Conta e sessão

O login troca usuário e senha por dois tokens, que moram em cookies
`httpOnly` — o JavaScript da página não os enxerga. Quem confere se a sessão
vale é o servidor, perguntando à API a cada renderização (`lib/dal.ts`), e não
o cookie em si: cookie qualquer pessoa escreve no console.

**Antes de escrever uma Server Action, leia
[`docs/server-actions-seguranca.md`](docs/server-actions-seguranca.md).** Action
parece função e é endereço público: qualquer um manda o mesmo POST, com o corpo
que quiser, sem passar pela sua tela. O documento separa, com os números
medidos no projeto, o que o framework já garante do que continua sendo
trabalho seu.

---

## Como a gente trabalha

Você pega um card do backlog, resolve numa branch e abre um Pull Request.

```bash
git switch -c fix/lp-101-contador-e-filtro   # tipo/lp-NNN-descricao-curta
# … código …
npm run lint && npm run typecheck && npm run build   # antes de todo push
git push -u origin fix/lp-101-contador-e-filtro
```

Abra o PR. O template já traz as perguntas que a revisão vai fazer.

O combinado completo — nome de branch, formato de commit, a lista do que
rodar antes de abrir o PR e como revisar o PR de outra pessoa — está em
[`CONTRIBUTING.md`](CONTRIBUTING.md). **Leia uma vez antes do primeiro
ticket.**

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
| `npm run typecheck` | gera os tipos de rota e checa TypeScript |

`lint`, `typecheck` e `build` são o que a esteira roda em todo Pull Request.
Rodar aqui antes economiza uma viagem ao GitHub Actions.

---

## O que ainda não existe

Não são bugs escondidos — é o backlog. Cada item vira ticket de alguém.

O LequePlay hoje é só o catálogo: você navega e olha. Falta tudo o que faz
uma pessoa voltar — registrar, escrever, organizar, acompanhar quem tem
gosto parecido.

**Navegar mais fundo**

- **Temporada e episódio** não têm página. A série lista as temporadas e para.
- **Pessoas** (direção, elenco, apresentação) não têm página.
- Não dá para navegar por **gênero, década ou ranking**.
- O catálogo **não tem paginação**.

**Ter uma conta**

- Não há **login** nem perfil, então nada abaixo daqui é possível ainda.

**Registrar e escrever**

- **Diário**: marcar que assistiu, com data, e ver o histórico.
- **Resenhas**: escrever, editar, curtir a dos outros. Cada resenha tem
  página própria e link para compartilhar.
- **Listas**: montar coleções ordenadas, públicas ou privadas.

**Acompanhar gente**

- **Perfil público**, seguir pessoas, **feed** do que elas andaram fazendo.
- **Estatísticas** do ano: quanto assistiu, de que gênero, em que meses.

**O resto**

- A **busca** só encontra título exato. Quem procura "algo leve para assistir
  cansada" não acha nada.
- Não há **testes**.

O contrato em [`docs/api-contrato.md`](docs/api-contrato.md) descreve todos
esses endpoints, mesmo os que a API ainda não implementou. Leia a parte que
cobre o seu ticket antes de começar.
