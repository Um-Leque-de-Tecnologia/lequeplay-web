# API do LequePlay — contrato

Este documento é o combinado entre o back e o front. Ele descreve **o que a
API precisa entregar** para que o `lequeplay-web` funcione por inteiro.

Se você está construindo o backend, é a sua especificação. Se você está no
time de front, é a documentação que você consulta.

---

## Estado da implementação — leia antes de tudo

Este documento descreve **duas coisas diferentes**, e por muito tempo não
dizia qual era qual — foi daí que veio o desencontro de nomes que o front
teve que consertar depois. Agora cada seção vem marcada:

| Marca | Significa |
| --- | --- |
| ✅ **Existe** | verificado no código da API; o front pode chamar |
| 🕓 **Backlog** | é **especificação**, ainda não existe. Não chame |
| ❓ **A confirmar** | está especificado aqui e ninguém checou se foi feito |

> **Este documento foi conferido linha a linha contra o código da API em
> setembro de 2026.** Onde os dois discordavam, a correção seguiu a regra de
> sempre: **o contrato espelha a API**. Mudaram de lado aqui o formato de
> erro, o envelope de paginação, `/generos`, `/catalogo/versao`, a forma do
> crédito e a autenticação inteira. Onde faltava campo que a tela precisa —
> `totalAvaliacoes` e `status` —, quem mudou foi a API
> ([lequeplay-api#2](https://github.com/Um-Leque-de-Tecnologia/lequeplay-api/pull/2)).
> Cada trecho reescrito traz uma nota dizendo o que ele prometia antes.

✅ **Existe hoje:**

- `GET /v1/midias` e `GET /v1/midias/{slug}` — o catálogo, com `creditos` no
  detalhe; o parâmetro da rota de detalhe aceita **o slug ou o id**
- `GET /v1/generos` — a lista de nomes para montar o filtro
- `GET /v1/catalogo/versao` — o contador que diz se o catálogo mudou
- `GET /v1/busca` — busca textual, vetorial e híbrida
- Autenticação, via Keycloak: `POST /v1/auth/login`, `POST /v1/auth/refresh`,
  `POST /v1/auth/logout` e `GET /v1/auth/me`

🕓 **Backlog — ainda não existe na API:** **pessoas** (`/pessoas/*`),
**resenhas**, **listas** e **diário**, mais o que se apoia neles (perfil
social, feed, ranking). Tudo o que está nessas seções é combinado, não
realidade. Elas **continuam aqui de propósito** — são a especificação de quem
vai construir. Só não confunda uma coisa com a outra.

❓ O que não recebeu marca nenhuma ainda não foi conferido dos dois lados.
Antes de consumir, olhe a API — foi confiar na leitura de memória que
produziu o desencontro anterior.

> **Regra de nome, para não repetir a confusão.** Campo que já existe na API
> com outro nome: quem muda é o **front**. Campo que não existe em lugar
> nenhum: a **API ganha o campo**. Nome de endpoint **não se mexe** — nem o
> `/v1`, nem `/auth/eu`, nem `/midias/{slug}`. URL publicada é contrato com
> quem já a guardou.

---

## O que o backend precisa fazer

Guardar e servir três coisas:

1. **O catálogo** — filmes, séries, podcasts e quem trabalhou neles
2. **As contas** — login, token, perfil
3. **A camada social** — o que cada pessoa assistiu, escreveu, organizou em
   listas e curtiu, e quem segue quem

A terceira é a maior, e é a que sustenta a maior parte das telas.

E mais uma, que mudou de lado depois que este documento foi escrito:

4. **A busca** — textual, vetorial e híbrida, em `GET /v1/busca`. O índice e
   os *embeddings* vivem no banco da API, não no front.

## O que o backend **não** precisa fazer

Vale dizer o que está fora do escopo, porque muda bastante o tamanho do
trabalho:

- **Qualquer chamada a LLM.** As features de IA — resumo de opiniões,
  recomendação em texto — moram no front.
- **Renderizar HTML, cuidar de sessão em cookie ou de CORS de navegador.**
  Quem fala com a API é o *servidor* do Next, não o navegador. O front guarda
  o token num cookie `httpOnly` e repassa como `Authorization: Bearer` nas
  chamadas de servidor.

---

## Convenções

| | |
| --- | --- |
| Formato | JSON, `UTF-8` |
| Prefixo | **`/v1`** — as rotas abaixo aparecem sem ele; `/midias` é `/v1/midias` |
| Datas | ISO 8601 (`2026-08-22T19:00:00Z`) |
| Autenticação | `Authorization: Bearer <token>` |
| Idioma dos campos | português, `camelCase` |
| Campo vazio | **omitido**, não `null` — veja abaixo |

### Omitido, não `null`

Campo marcado **(opcional)** nas tabelas abaixo, quando não tem valor, **não
aparece no JSON**. A API não manda `"posterUrl": null`; ela simplesmente não
manda `posterUrl`.

```json
{ "slug": "primeira-cadeira", "titulo": "Primeira Cadeira" }
```

No TypeScript isso é `posterUrl?: string`, e o valor que chega é `undefined`.
Para quem consome muda pouco — `??` cobre `null` e `undefined` — mas muda
para quem escreve teste e para quem lê o JSON cru: **ausente e `null` não são
a mesma coisa**.

Campo declarado como `X | null` é outra história: esse **vem sempre**, com
`null` quando vazio (`fotoUrl`, `personagem`, `avatarUrl`). E campo sem
marca nenhuma vem sempre, com valor: `notaMedia` é número em todo título,
inclusive nos que ninguém avaliou.

### Erros

Toda resposta de erro tem o mesmo formato — isso importa, porque o front tem
uma camada só que trata todos. A API usa **`application/problem+json`**, o
formato da RFC 7807:

```json
{
  "type": "about:blank",
  "title": "Mídia não encontrada",
  "status": 404,
  "detail": "nenhuma mídia com o slug informado",
  "instance": "/v1/midias/nao-existe"
}
```

`detail` e `instance` são opcionais e podem não vir.

> **Este bloco já descreveu outra coisa.** Até a conferência de setembro de
> 2026, o documento prometia `{ "erro": { "codigo", "mensagem", "detalhes" } }`,
> com códigos como `MIDIA_NAO_ENCONTRADA`. A API nunca devolveu isso: ela
> responde RFC 7807 desde sempre, em `internal/platform/apperr`. Quem escrever
> tratamento de erro no front olha para `status`, que é o que existe dos dois
> lados — e não para um `codigo` que só existia aqui.

| Status | Quando |
| --- | --- |
| `200` | sucesso |
| `201` | criou |
| `204` | sucesso sem corpo (remoções) |
| `400` | validação falhou |
| `401` | sem token, ou token expirado |
| `403` | autenticado, mas sem permissão |
| `404` | recurso não existe |
| `429` | limite de requisições |
| `500` | erro do servidor |

### Paginação

Query: `?pagina=1&porPagina=20`. Padrão: `pagina=1`, `porPagina=20`, máximo
`100`.

```json
{ "itens": [], "pagina": 1, "porPagina": 20, "total": 137 }
```

**Seja consistente.** Toda listagem devolve este envelope, mesmo quando há um
item só ou nenhum. Listagem que às vezes devolve array puro e às vezes
envelope é a causa nº 1 de front quebrado.

> **`limite` e `offset` também são aceitos na query**, porque foram publicados
> antes e pode haver quem os use. Quando os dois pares chegam juntos,
> `pagina`/`porPagina` vence. Na **resposta** existe um envelope só, o de
> cima: quem consome não precisa saber que o SQL lá dentro pensa em offset.

---

## Modelo de dados

Vem do LequePlay: `Midia` é a base, e `Filme`, `Serie` e `Podcast`
especializam. O campo **`tipo` é o discriminador** — o front usa ele para
saber quais campos existem.

### Midia (campos comuns)

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | `string` | identificador estável |
| `slug` | `string` | único, usado na URL: `matrix-1999` |
| `tipo` | `"filme" \| "serie" \| "podcast"` | discriminador |
| `titulo` | `string` | |
| `ano` | `number` | |
| `generos` | `string[]` | **lista** — um título pode ser drama *e* suspense. Ordenada por relevância: `generos[0]` é o principal. Nunca vazia |
| `sinopse` | `string` | prosa — é o texto que a busca vetorial indexa |
| `posterUrl` | `string` (opcional) | **omitido** quando não há capa. Nunca `null`. Vem absoluto, apontando para o CDN da TMDB (`https://image.tmdb.org/t/p/w342/...`) — por isso o `next.config.ts` precisa liberar esse host |
| `notaMedia` | `number` | **sempre presente, sempre número.** Nunca `null` |
| `totalAvaliacoes` | `number` | `0` quando ninguém avaliou — **é este campo que responde "tem nota?"** |
| `status` | `string` (opcional) | situação de produção, **em inglês, como vem da TMDB**: `Returning Series`, `Ended`, `Canceled`, `Released`. Traduzir é decisão de tela. **Omitido** quando a origem não informa |
| `tituloOriginal` | `string` (opcional) | o título no idioma original |
| `popularidade` | `number` | o índice da TMDB, usado pela API para ordenar a listagem. O front não precisa dele, mas ele vem |
| `duracaoMin` | `number` (opcional) | somado pelo backend — o front não tem os episódios. **Omitido** quando o backend não tem o número: hoje, na produção, toda série sem runtime na TMDB (17 de 60 títulos) vem sem a chave. O front trata a ausência escondendo a linha da ficha |
| ~~`atualizadoEm`~~ | — | 🕓 **não existe na resposta.** A tabela tem `updated_at`, mas a API não publica o campo. Quem precisa saber se o catálogo mudou usa `GET /catalogo/versao` |

> **Por que `notaMedia` deixou de ser anulável.** Antes ela carregava duas
> informações: a nota e o fato de existir nota, e por isso precisava de
> `null`. Com `totalAvaliacoes` ao lado, a segunda pergunta tem dono
> próprio — `totalAvaliacoes === 0` — e a nota volta a ser só um número. A
> API para de ter que mentir com `null` e o front não perde a distinção:
> "ninguém avaliou" e "todo mundo deu zero" continuam sendo casos diferentes,
> só que agora o campo que os separa é o certo.

### Por tipo

**`filme`** não acrescenta campo nenhum. A direção **sai de `creditos`** —
veja o quadro logo abaixo.

**`serie`** acrescenta `temporadas: ResumoTemporada[]`, onde cada item é
`{ numero, nome, ano, totalEpisodios }` — `nome` e `ano` são opcionais.
**Sem os episódios** — eles vêm do endpoint da temporada. As temporadas só
aparecem no **detalhe** (`GET /midias/{slug}`), nunca na listagem.

> **Quantos episódios a série tem** é a soma de `totalEpisodios` das
> temporadas: a API não publica um total separado, e somar o `episodios.length`
> não serve, porque a lista de episódios não vem aqui. Temporada de especiais
> (`numero: 0`) é ignorada pela ingestão, então ela não entra nessa conta.

O **`status`** da série (se está no ar, encerrada ou cancelada) mora nos
campos comuns, na tabela acima: ele vale para qualquer tipo, e é a série que
tem uso para ele hoje.

**`podcast`** acrescenta `totalEpisodios: number` ✅, `frequencia: string` 🕓
(opcional — ex: "Semanal", "Quinzenal") e `episodios: EpisodioPodcast[]` 🕓
(opcional, no detalhe). A apresentação também sai de `creditos`.

> Os dois campos novos são **especificação**: existem no mock e na ficha do
> podcast, e ainda não na API. Quem for consumi-los antes disso trata a
> ausência, como a própria ficha faz.

### Direção e apresentação: derivados, não campos

O front mostra "Direção" na ficha do filme e "Apresentação" na do podcast.
Isso **não** quer dizer que a API tenha `diretor` e `apresentador`. Ela tem
`creditos`, e o front deriva:

| O que a tela mostra | De onde sai |
| --- | --- |
| Direção (filme) | o crédito com `papel: "direcao"` |
| Apresentação (podcast) | o crédito com `papel: "apresentacao"` |
| Elenco | os créditos com `papel: "elenco"` |

**Não crie `diretor: string` na API.** Seriam duas fontes da verdade para o
mesmo dado, e um dia elas discordam: alguém corrige o crédito e esquece o
campo solto, ou o filme ganha um segundo diretor e o campo escalar não cabe.
Derivar custa três linhas no front; ressincronizar dois campos custa um bug
por trimestre, para sempre.

`creditos` **só vem no detalhe** (`GET /midias/{slug}`), nunca na listagem, e
traz no máximo 12 itens ordenados por relevância.

### Temporada completa

```json
{
  "numero": 1,
  "ano": 2024,
  "episodios": [
    { "numero": 1, "titulo": "Um commit qualquer", "duracaoMin": 48, "sinopse": "…" }
  ]
}
```

### EpisodioPodcast 🕓

```json
{
  "numero": 1,
  "titulo": "O switch com 40 casos",
  "duracaoMin": 30,
  "publicadoEm": "2025-02-05"
}
```

`publicadoEm` é **data** ISO 8601 (`YYYY-MM-DD`).

### Usuario

`{ "id": "…", "nome": "…", "email": "…" }`

---

## Endpoints públicos

### `GET /midias` ✅

Lista o catálogo.

| Query | Tipo | |
| --- | --- | --- |
| `tipo` | `filme\|serie\|podcast` | opcional |
| `genero` | `string` | opcional — **singular**, veja abaixo |
| `ano` | `number` | opcional |
| `q` | `string` | filtro textual simples: casa com título **ou** sinopse. Para a busca que entende intenção, use `/busca` |
| `pagina`, `porPagina` | `number` | paginação |
| `limite`, `offset` | `number` | aceitos por compatibilidade; `pagina`/`porPagina` vencem quando os dois vêm |

Devolve `Pagina<Midia>`. Sem resultado, `itens: []` e `total: 0` — **não é
404**.

A ordenação é por popularidade decrescente, com o título como desempate. Não
há parâmetro de ordenação: quem quiser outra ordem ordena no front, como o
catálogo faz hoje.

> **O filtro é `?genero=`, no singular — e continua.** O *campo* da resposta
> virou `generos`, lista; o *parâmetro* não mudou junto, de propósito.
> Filtra-se por um gênero de cada vez, e o nome do parâmetro faz parte da
> URL: mexer nele quebraria todo link já compartilhado e todo favorito já
> salvo. Campo e parâmetro não precisam ter o mesmo nome — o casamento
> `?genero=Drama` → `"Drama" ∈ generos` é a leitura correta.

### `GET /midias/{slug}` ✅

Devolve uma `Midia`, com `creditos`. `404` com
`codigo: "MIDIA_NAO_ENCONTRADA"` se não existir.

### `GET /midias/{slug}/temporadas/{numero}` ❓

Só para série. Devolve a temporada completa, com os episódios. `404` se a
série ou a temporada não existir.

### `GET /busca` ✅

Caminho completo, com o prefixo: **`GET /v1/busca`**.

A busca de verdade — a que entende "algo leve para assistir hoje", e não só
título exato. Mora na API porque é lá que estão o índice textual e os
*embeddings*.

| Query | Tipo | |
| --- | --- | --- |
| `q` | `string` | **obrigatório** — o texto procurado |
| `modo` | `auto\|hybrid\|vector\|fts` | opcional, padrão `auto` |
| `tipo`, `genero`, `ano` | | os mesmos filtros de `GET /midias` |
| `pagina`, `porPagina` | `number` | paginação |

Os modos:

| `modo` | O que faz | Quando serve |
| --- | --- | --- |
| `fts` | busca textual (*full-text search*) sobre título e sinopse | a pessoa sabe o nome e digitou quase certo |
| `vector` | similaridade de *embedding* sobre a sinopse | a pessoa descreve o que quer, sem saber o nome |
| `hybrid` | roda as duas e funde os resultados numa lista só | o caso do meio, que é a maioria |
| `auto` | a API escolhe pela cara da consulta — texto curto tende a `fts`, frase tende a `hybrid` | **o padrão**; use este se não tiver motivo para não usar |

**A resposta da busca não é o envelope de paginação.** Ela é própria:

```json
{
  "query": "algo leve para hoje",
  "modo": "hybrid",
  "usouFallback": false,
  "itens": [ /* Midia + score + rank */ ]
}
```

| Campo | Tipo | Observação |
| --- | --- | --- |
| `query` | `string` | o texto procurado, de volta |
| `modo` | `auto\|hybrid\|vector\|fts` | o modo **efetivamente usado**, que pode não ser o pedido |
| `usouFallback` | `boolean` | `true` quando o embedding não estava disponível e a busca caiu para a perna léxica. É honestidade do serviço: o resultado veio, mas veio pior |
| `itens` | `Midia[]` | com dois campos a mais em cada item, abaixo |

| Campo do item | Tipo | Observação |
| --- | --- | --- |
| `score` | `number` | relevância. **Só comparável dentro da mesma resposta** — a escala muda entre os modos, então não guarde nem compare entre buscas |
| `rank` | `number` | posição na resposta, começando em `1` |

> **Sem `total`, sem `pagina`.** A busca devolve uma lista, e não uma página:
> `limite` recorta quantos vêm, e não existe "próxima página" de resultado
> ranqueado. Quem precisar paginar busca precisa combinar isso com quem
> mantém a API — hoje não está lá.

> **Por que `rank` existe, se dá para contar o índice do array.** Porque o
> índice reinicia a cada página e o `rank` não. Ele é o número que a tela
> mostra ("3º resultado") e o que o log de busca guarda para medir se a busca
> está boa.

Sem resultado: `200` com `itens: []`. Consulta vazia: `400` com
`codigo: "VALIDACAO"` apontando `q`.

### `GET /generos` ✅

`{ "itens": ["Ação", "Comédia", "Documentário", …] }`

O front usa para montar o filtro — não deixe essa lista chumbada no
front-end. Os itens são **nomes**, e não objetos: é exatamente o valor que
volta na query, em `?genero=Drama`.

> **Este endpoint mudou de formato em setembro de 2026.** Até então a API
> devolvia um array puro de `{ id, nome }` — sem envelope e com um id que
> nenhuma tela usava. Quem tiver código lendo `resposta[0].nome` precisa
> passar a ler `resposta.itens[0]`. A mudança está no
> [lequeplay-api#2](https://github.com/Um-Leque-de-Tecnologia/lequeplay-api/pull/2).

### `GET /catalogo/versao` ✅

```json
{ "versao": 42 }
```

Muda sempre que qualquer título é criado, editado ou removido. O front usa
para decidir se revalida o cache, em vez de revalidar às cegas.

> **É um contador, não uma data, e não traz o total.** Este bloco prometia
> `{ "versao": "2026-08-22T19:04:11Z", "totalMidias": 137 }`; a API devolve um
> inteiro que sobe a cada ingestão. Para o uso que o campo tem — "mudou desde a
> última vez que olhei?" — um contador responde melhor que um timestamp: ele
> não depende de relógio, nem de fuso, nem de duas escritas no mesmo segundo.
> Quem precisar do total de títulos pega em `GET /midias`, no `total` do
> envelope.

---

## Autenticação ✅

A API **não guarda senha**: ela é um proxy do Keycloak. Quem valida a
credencial e emite o token é o Keycloak; a API repassa.

### Onde cada credencial viaja (LP-412)

Conferido no contrato publicado (`securitySchemes`) e no código da API
(`internal/auth/auth.go`) em 24/09/2026:

| Cabeçalho | Leva o quê | Quem manda | Quem lê |
| --- | --- | --- | --- |
| `Authorization: Bearer <token>` | o token **da pessoa**, emitido pelo Keycloak | só o `buscarComToken` do `lib/api.ts`, a partir do cookie `lp_acesso` | a API, nas rotas com `bearerAuth` (`/auth/me` hoje; o `/perfil/*` quando existir) |
| `X-Debug-Subject`, `X-Debug-Roles`… | uma pessoa de mentira | ninguém no front | a API, **só no modo dev dela** — nunca em produção |
| _(chave de API)_ | **não existe** | — | — |

- **Não há chave de API.** O contrato só declara `bearerAuth`, e as rotas do
  catálogo são abertas (`security: []`). O LP-210, que punha uma chave no
  `Authorization` e no `x-api-key`, foi fechado sem merge (#26).
- **O `Authorization` tem um dono só: o token da pessoa.** Se um dia a API
  passar a exigir uma chave do servidor, ela vai num cabeçalho próprio — o
  `x-api-key` — e **nunca** no `Authorization`: um cabeçalho para duas
  credenciais é "a última escrita ganha", e o erro aparece como um `401` sem
  explicação.
- **Os dois `401` são separados no código.** O do token vem do
  `buscarComToken` e é sessão vencida: vai ao login, sem alarme. Um `401` no
  `buscar`, que não manda credencial, quer dizer que uma rota pública passou
  a pedir login — esse é alarme, no log de quem opera.

### `POST /auth/login`

```json
{ "usuario": "joao", "senha": "…" }
```

**`usuario`, e não `email`.** É o campo que o Keycloak espera no *password
grant*, e trocar o nome aqui só criaria uma tradução a mais no caminho.

Resposta `200`:

```json
{
  "accessToken": "eyJhbGciOi…",
  "expiresIn": 300,
  "refreshToken": "eyJhbGciOi…",
  "refreshExpiresIn": 1800,
  "tokenType": "Bearer",
  "scope": "profile email"
}
```

`expiresIn` é em **segundos a partir de agora**, e não uma data. O front
guarda o `accessToken` num cookie `httpOnly` e usa o `refreshToken` para
renovar antes de expirar.

### `POST /auth/refresh` · `POST /auth/logout`

Os dois recebem `{ "refreshToken": "…" }`. O `refresh` devolve um token novo,
no mesmo formato do login; o `logout` revoga a sessão e responde **`204`**,
sem corpo.

### `GET /auth/me`

Exige `Authorization: Bearer <accessToken>`. Devolve as **claims** do token:

```json
{ "sub": "…", "email": "joao@exemplo.com", "username": "joao", "roles": ["user"] }
```

Todos respondem `401` (em `problem+json`) com token ausente, inválido ou
expirado.

> **Esta seção inteira foi reescrita em setembro de 2026.** Ela prometia
> `POST /auth/login` com `email`, devolvendo `{ token, expiraEm, usuario }`, e
> um `GET /auth/eu` que não existe — o caminho é `/v1/auth/me`. A API também
> não devolve um `Usuario` com `{ id, nome, email }`: devolve as claims do
> Keycloak, que é outra coisa. Quem escreveu tela contra o texto antigo vai
> precisar ajustar os nomes.

---

## Perfil — exige autenticação 🕓

> **Ainda não existe na API.** Esta seção é especificação.

Tudo aqui é **do usuário do token**. Não aceite id de usuário por parâmetro:
seria possível ler a lista dos outros.

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/perfil/quero-ver` | `Pagina<Midia>` — o que eu quero ver |
| `PUT` | `/perfil/quero-ver/{midiaId}` | adiciona · `204` · idempotente |
| `DELETE` | `/perfil/quero-ver/{midiaId}` | remove · `204` |
| `GET` | `/perfil/assistidas` | `Pagina<Midia>` |
| `PUT` | `/perfil/assistidas/{midiaId}` | marca como assistida · `204` |
| `DELETE` | `/perfil/assistidas/{midiaId}` | desmarca · `204` |
| `GET` | `/perfil/avaliacoes` | `{ itens: [{ midiaId, nota, avaliadoEm }] }` |
| `PUT` | `/midias/{midiaId}/avaliacao` | `{ "nota": 8.5 }` · devolve a `Midia` com `notaMedia` **e** `totalAvaliacoes` recalculados |
| `DELETE` | `/midias/{midiaId}/avaliacao` | remove a avaliação · `204` |
| `GET` | `/perfil/historico` | `{ itens: ItemHistorico[] }` — onde a pessoa parou em cada título · veja abaixo |
| `PUT` | `/perfil/historico/{midiaSlug}` | grava a posição do player · `204` · veja abaixo |

> **`quero-ver` e não `lista`.** *Lista* virou nome de entidade na camada
> social — coleções que a pessoa monta e publica. Duas coisas diferentes não
> podem dividir o mesmo nome no meio de vinte pessoas codando.

**`PUT` e não `POST`** nas três primeiras porque são idempotentes: adicionar
duas vezes tem o mesmo efeito de adicionar uma. Isso deixa a UI
otimista do front muito mais simples — ela pode reenviar sem medo.

**A avaliação devolve a mídia atualizada.** Sem isso o front teria que fazer
uma segunda chamada só para saber a nova média.

Regras: `nota` de `0` a `10`, com uma casa decimal. Uma avaliação por pessoa
por mídia — reenviar substitui.

### `GET /perfil/historico` — o pedido do LP-414

O front já consome este endpoint — a faixa "Continuar assistindo" da home e o
filtro "Só o que eu ainda não vi" —, e hoje ele responde **404**
(conferido em 24/09/2026). Enquanto não existir, quem entrou vê um aviso
honesto no lugar da faixa, e não o histórico de mentira do mock.

```json
{
  "itens": [
    {
      "midiaSlug": "protocolo-aberto",
      "temporadaNumero": 2,
      "episodioNumero": 2,
      "segundosAssistidos": 1260,
      "atualizadoEm": "2026-09-20T21:14:00Z"
    },
    { "midiaSlug": "sinais-de-carbono", "segundosAssistidos": 3120, "atualizadoEm": "2026-09-18T23:02:00Z" }
  ]
}
```

- **Só do usuário do token**, como o resto desta seção. Sem token, `401`.
- **Sem histórico é `{ "itens": [] }`, e não `404`.** O front separa os dois:
  `404` quer dizer "a API ainda não guarda progresso", e a tela diz outra coisa.
- `midiaSlug`, e não `midiaId`: é o que o front usa para cruzar com o
  catálogo e para montar o link de "Retomar".
- `temporadaNumero` e `episodioNumero` **omitidos** quando o player não soube
  dizer o episódio — linha de filme, ou do player antigo. Os dois vêm juntos
  ou nenhum vem.
- `segundosAssistidos` é a posição, e não quanto falta: a duração mora na
  mídia e no episódio.
- `atualizadoEm` em ISO 8601 com fuso, e a lista **do mais recente para o mais
  antigo** — a ordem da faixa.
- **Nunca cacheável**: `Cache-Control: private, no-store`.

`PUT /perfil/historico/{midiaSlug}` recebe
`{ temporadaNumero?, episodioNumero?, segundosAssistidos }` e responde `204`:
é o player salvando a posição. Idempotente pelo mesmo motivo dos `PUT` acima.

> **Avaliação e resenha escrevem o mesmo registro.** `/midias/{id}/avaliacao`
> é a nota rápida, sem texto; `/midias/{id}/resenha` é a nota com texto. Não
> são dois registros — quem avalia e depois resenha o mesmo título continua
> com uma avaliação só. Marcar como assistida e registrar no diário seguem a
> mesma ideia: o diário é a versão com data.

---

---

# Camada social 🕓

> **Nada daqui existe na API ainda** — nem `Pessoa`, nem `Resenha`, nem
> `Lista`, nem `RegistroDiario`, nem os endpoints que os servem. Daqui até o
> fim do documento é **especificação**, escrita para quem vai construir.
>
> A exceção é `Credito`, que o detalhe da mídia já devolve hoje. Ele está
> descrito aqui embaixo por ficar perto de `Pessoa`, mas é ✅.
>
> Isto **não é backlog morto**: é a fatia que sustenta metade das telas do
> curso. Só não vale programar contra ela achando que já está no ar.

O catálogo é o substrato. O que gera tela — e o que faz as pessoas voltarem —
é o que elas registram, escrevem e organizam em cima dele.

## Entidades novas

### Pessoa 🕓

Quem dirige, atua ou apresenta. Tem página própria.

```json
{
  "id": "p1",
  "slug": "marina-aleixo",
  "nome": "Marina Aleixo",
  "bio": "Diretora, trabalha com ficção científica desde 2016.",
  "fotoUrl": null,
  "papeis": ["direcao"]
}
```

`papeis` é um subconjunto de `direcao`, `elenco`, `apresentacao`. Uma pessoa
pode ter mais de um.

### Credito ✅

Liga uma pessoa a um título. **Já existe**: vem em `creditos` no detalhe da
mídia. É daqui que o front tira direção e apresentação — não há campo escalar
para isso.

```json
{
  "pessoa": { "slug": "marina-aleixo", "nome": "Marina Aleixo", "fotoUrl": "https://image.tmdb.org/t/p/w342/..." },
  "papel": "direcao",
  "personagem": "Ana"
}
```

`personagem` só é preenchido quando `papel` é `elenco`; nos outros papéis ele
**não vem**. `fotoUrl` também é omitido quando a pessoa não tem foto — aqui
vale a regra geral do documento, "omitido, não `null`".

> **O `pessoa` virou objeto em setembro de 2026.** Até então a API mandava só
> o nome, numa string, com `fotoUrl` solto ao lado do papel. Nome não é
> identificador — existem dois "João Silva" —, e a página da pessoa precisa
> de um endereço estável. O `slug` é derivado do nome com a mesma regra do
> slug de mídia; no dia em que a pessoa virar entidade com página própria,
> ele vira coluna no banco, porque aí o endereço publicado precisa sobreviver
> a uma correção de grafia. Mudança em
> [lequeplay-api#2](https://github.com/Um-Leque-de-Tecnologia/lequeplay-api/pull/2).

### Resenha 🕓

Texto de uma pessoa sobre um título. **Tem página própria e URL
compartilhável** — é o que alimenta a OG image gerada.

```json
{
  "id": "r1",
  "midia": { "slug": "sinais-de-carbono", "titulo": "Sinais de Carbono", "posterUrl": "…" },
  "autor": { "usuario": "ana", "nome": "Ana", "avatarUrl": null },
  "nota": 9,
  "texto": "…",
  "contemSpoiler": false,
  "curtidas": 12,
  "curtidaPeloUsuario": false,
  "criadaEm": "2026-08-01T20:11:00Z",
  "atualizadaEm": "2026-08-01T20:11:00Z"
}
```

`curtidaPeloUsuario` só vem preenchido em requisição autenticada; nas
públicas, sempre `false`.

Uma resenha por pessoa por título — reenviar substitui.

### Lista 🕓

Coleção curada, com ordem. Pública ou privada.

```json
{
  "id": "l1",
  "slug": "para-assistir-cansada",
  "titulo": "Para assistir cansada",
  "descricao": "Nada que exija anotar nome de personagem.",
  "autor": { "usuario": "ana", "nome": "Ana", "avatarUrl": null },
  "publica": true,
  "totalItens": 12,
  "capas": ["…", "…", "…", "…"],
  "curtidas": 30,
  "criadaEm": "2026-07-14T12:00:00Z"
}
```

`capas` traz as **4 primeiras** capas da lista, para montar o mosaico sem
carregar os 12 itens. Os itens vêm no detalhe da lista.

### RegistroDiario 🕓

"Assisti tal dia." É o histórico, e é a base da recomendação personalizada.

```json
{
  "id": "d1",
  "midia": { "slug": "…", "titulo": "…", "posterUrl": "…" },
  "assistidoEm": "2026-08-20",
  "nota": 8,
  "resenhaId": "r1",
  "revisita": false
}
```

`assistidoEm` é **data**, não timestamp. `revisita: true` quando a pessoa já
tinha assistido antes — a mesma mídia pode ter vários registros.

### UsuarioPublico 🕓

O perfil que qualquer pessoa vê.

```json
{
  "usuario": "ana",
  "nome": "Ana",
  "bio": "…",
  "avatarUrl": null,
  "estatisticas": {
    "assistidas": 214,
    "resenhas": 38,
    "listas": 6,
    "seguidores": 91,
    "seguindo": 40
  },
  "seguidoPeloUsuario": false
}
```

`usuario` é o handle, único, usado na URL: `/@ana`.

---

## Endpoints — pessoas 🕓

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/pessoas/{slug}` | dados da pessoa |
| `GET` | `/pessoas/{slug}/creditos` | `Pagina<{ midia, papel, personagem }>` |

O detalhe da mídia (`GET /midias/{slug}`) passa a incluir
`creditos: Credito[]` — no máximo 12, ordenados por relevância. A lista
completa vem do endpoint da pessoa.

## Endpoints — resenhas 🕓

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/midias/{slug}/resenhas` | | `Pagina<Resenha>` · `?ordem=recentes\|curtidas` |
| `GET` | `/resenhas/{id}` | | uma resenha — **página própria** |
| `PUT` | `/midias/{midiaId}/resenha` | ✓ | cria ou substitui a minha |
| `DELETE` | `/midias/{midiaId}/resenha` | ✓ | remove a minha |
| `PUT` | `/resenhas/{id}/curtida` | ✓ | curte · `204` · idempotente |
| `DELETE` | `/resenhas/{id}/curtida` | ✓ | descurte · `204` |

Corpo do `PUT`:

```json
{ "nota": 9, "texto": "…", "contemSpoiler": false }
```

`texto` entre 10 e 5000 caracteres. `nota` é opcional — dá para resenhar sem
dar nota.

> **A resenha atualiza a avaliação.** Se vier `nota`, ela conta como a
> avaliação daquela pessoa para aquele título. Não são dois registros
> separados — senão o front precisa manter duas coisas em sincronia.

## Endpoints — listas 🕓

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/listas` | | `Pagina<Lista>` — só as públicas |
| `GET` | `/listas/{slug}` | | a lista com `itens: { midia, ordem }[]` |
| `POST` | `/listas` | ✓ | cria · `201` com a lista |
| `PUT` | `/listas/{id}` | ✓ | edita título, descrição, visibilidade |
| `DELETE` | `/listas/{id}` | ✓ | remove |
| `PUT` | `/listas/{id}/itens/{midiaId}` | ✓ | adiciona · `{ "ordem": 3 }` opcional |
| `DELETE` | `/listas/{id}/itens/{midiaId}` | ✓ | remove item |
| `PUT` | `/listas/{id}/curtida` | ✓ | curte · `204` |
| `DELETE` | `/listas/{id}/curtida` | ✓ | descurte · `204` |

Lista privada devolve **`404`**, não `403`, para quem não é dona — `403`
confirmaria que ela existe.

## Endpoints — diário 🕓

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/perfil/diario` | ✓ | `Pagina<RegistroDiario>` · `?de=&ate=` |
| `POST` | `/perfil/diario` | ✓ | registra · `201` |
| `PUT` | `/perfil/diario/{id}` | ✓ | edita data ou nota |
| `DELETE` | `/perfil/diario/{id}` | ✓ | remove |
| `GET` | `/usuarios/{usuario}/diario` | | público, se o perfil for público |

Corpo do `POST`:

```json
{ "midiaId": "1", "assistidoEm": "2026-08-20", "nota": 8, "revisita": false }
```

Registrar no diário **marca como assistida** automaticamente. São a mesma
informação vista de dois jeitos.

## Endpoints — pessoas que usam 🕓

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/usuarios/{usuario}` | | `UsuarioPublico` |
| `GET` | `/usuarios/{usuario}/resenhas` | | `Pagina<Resenha>` |
| `GET` | `/usuarios/{usuario}/listas` | | `Pagina<Lista>` — só públicas |
| `PUT` | `/usuarios/{usuario}/seguir` | ✓ | segue · `204` · idempotente |
| `DELETE` | `/usuarios/{usuario}/seguir` | ✓ | deixa de seguir · `204` |
| `GET` | `/perfil/seguindo` | ✓ | `Pagina<UsuarioPublico>` |
| `GET` | `/perfil/seguidores` | ✓ | `Pagina<UsuarioPublico>` |
| `PUT` | `/perfil` | ✓ | edita nome, bio, avatar |

## Endpoints — feed, estatísticas e ranking 🕓

| Método | Rota | Auth | O que faz |
| --- | --- | --- | --- |
| `GET` | `/perfil/feed` | ✓ | atividade de quem eu sigo |
| `GET` | `/perfil/estatisticas` | ✓ | números do ano: por gênero, por mês, total de horas |
| `GET` | `/midias/ranking` | | `?periodo=semana\|mes\|ano\|sempre` |

Item do feed:

```json
{
  "id": "a1",
  "tipo": "resenha",
  "usuario": { "usuario": "ana", "nome": "Ana", "avatarUrl": null },
  "midia": { "slug": "…", "titulo": "…", "posterUrl": "…" },
  "resenhaId": "r1",
  "ocorridoEm": "2026-08-21T18:30:00Z"
}
```

`tipo` é `resenha`, `diario`, `lista` ou `curtida`.

> **O feed é a tela mais lenta do produto** — de propósito. Ele existe para o
> front exercitar Suspense e streaming, carregando cada bloco no seu ritmo.
> Não precisa ser rápido; precisa ser **incremental**: aceite `?limite=` e
> devolva rápido as primeiras entradas.

## Dados de exemplo

O catálogo de mentira precisa ser bom o suficiente para a busca vetorial
fazer sentido. Sem variedade, tudo parece funcionar.

### Catálogo

- **Mínimo 60 títulos**, idealmente 100+
- Os três tipos, com pelo menos **15 séries** (algumas com 2+ temporadas)
- Pelo menos **6 gêneros**, e **títulos com 2 ou 3 gêneros** — `generos` é
  lista, e lista que na prática só tem um item não exercita nada
- **Sinopses de verdade**, com 2 a 4 frases descritivas. É sobre esse texto
  que a busca vetorial trabalha. Sinopse genérica faz a feature parecer
  quebrada quando ela está certa.
- Alguns títulos **sem avaliação** (`totalAvaliacoes: 0`)
- Algum título **sem capa** (sem a chave `posterUrl`)

### Pessoas

- **Mínimo 40 pessoas**, com créditos distribuídos
- Pelo menos **8 pessoas com 3+ créditos** — página de pessoa vazia não
  ensina nada sobre listagem
- Alguém com dois papéis (dirigiu um, atuou em outro)

### Camada social

Esta parte é a que costuma ser semeada mal, e é a que mais aparece na tela.

- **Mínimo 15 usuários**, com nome, handle e bio preenchidos
- **Mínimo 300 resenhas**, distribuídas de forma desigual: alguns títulos com
  20+, muitos com 2 ou 3, e **alguns com nenhuma**
- **Texto de resenha de verdade**, de 3 a 15 linhas, com opinião. Este é o
  requisito mais caro e o mais importante: é o corpus da busca vetorial e do
  resumo de opiniões. Lorem ipsum inviabiliza duas features de uma vez.
- Resenhas de tamanhos bem diferentes — o layout precisa aguentar a de duas
  linhas e a de quinze
- Algumas com `contemSpoiler: true`
- **Mínimo 25 listas públicas**, algumas com 3 itens e alguma com 40+
- **Diário denso em pelo menos 3 usuários**: 150+ registros espalhados por 2
  anos, senão a tela de estatísticas fica vazia e a recomendação não tem base
- Um grafo de seguidores conectado, senão o feed nasce vazio

---

## Casos de borda que a API **deve** produzir

Não são defeitos — são situações reais que o front precisa aprender a tratar.
Vários viram ticket de aula, então **não os esconda**:

| Situação | Resposta esperada |
| --- | --- |
| Título sem nenhuma avaliação | `totalAvaliacoes: 0` — e `notaMedia` **vem mesmo assim**, como `0` |
| Título com nota real `0` | `notaMedia: 0` com `totalAvaliacoes > 0` — é outro caso, e a diferença tem que aparecer |
| Título sem capa | **sem a chave** `posterUrl` (nunca `"posterUrl": null`) |
| Série sem duração conhecida | **sem a chave** `duracaoMin` — não `0`, que significaria "dura zero" |
| Título de um gênero só | `generos` com um item — array, nunca string solta |
| Busca sem resultado | `200` com `itens: []` |
| Busca com `q` vazio | `400` com `codigo: "VALIDACAO"` apontando `q` |
| Slug inexistente | `404` com `codigo` |
| Última página | menos itens que `porPagina` |
| Série com temporada anunciada e ainda sem episódios | temporada com `episodios: []` |
| Token expirado | `401` com `codigo: "TOKEN_EXPIRADO"` |
| Nota fora de 0–10 | `400` com `detalhes` apontando o campo |
| Título sem nenhuma resenha | `200` com `itens: []` |
| Resenha sem nota | `nota: null` com `texto` preenchido |
| Lista privada de outra pessoa | `404` — nunca `403` |
| Lista vazia | `totalItens: 0` e `capas: []` |
| Perfil sem nada registrado | estatísticas zeradas, não `404` |
| Feed de quem não segue ninguém | `200` com `itens: []` |
| Seguir a si mesma | `400` com `codigo: "AUTO_SEGUIR"` |
| Resenha longa demais | `400` apontando `texto` |
| Curtir duas vezes | `204` — a operação é idempotente |

---

## Não-funcionais

- **Sem autenticação nos endpoints públicos.** O catálogo é aberto.
- **Limite de requisições** por IP nos públicos e por usuário nos
  autenticados. Devolva `429` com `Retry-After`.
- **Tempo de resposta**: até 300ms nas listagens com o catálogo de exemplo.
  O feed é a exceção — ele pode ser lento, desde que aceite `?limite=`.
- **Documentação viva** — OpenAPI publicada. A aula 1 pede que a turma leia a
  documentação da API, então ela precisa existir e estar certa.
- **Ambiente de desenvolvimento** que suba com um comando e já venha semeado.
  Se cada aluno tiver que popular o banco na mão, metade não passa da aula 1.
- **CORS** não é necessário para o front (quem chama é o servidor do Next),
  mas libere `localhost` se quiser permitir teste direto do navegador.
- **Vinte pessoas mexendo no mesmo banco.** O ambiente semeado é compartilhado
  e alguém vai apagar a lista que outra pessoa estava usando de exemplo.
  Ou dê um banco por aluno, ou tenha um comando de resemear.

---

## Ordem sugerida de construção

O front consegue trabalhar com mock, então o backend pode entregar em fatias.
Esta ordem destrava o curso na sequência das sprints:

1. **Catálogo** — `GET /midias`, `GET /midias/{slug}`, `GET /generos`
2. **Navegação profunda** — temporadas, episódios, `GET /catalogo/versao`
3. **Identidade** — `POST /auth/login`, `GET /auth/eu`, perfil
4. **Camada social** — resenhas, diário, listas, curtidas. É a fatia com mais
   tela dependendo dela: sem ela, metade dos tickets não tem o que consumir.
5. **Grafo** — seguir, feed, perfil público, ranking
6. **Pessoas** — `GET /pessoas/{slug}` e créditos no detalhe da mídia
7. **Catálogo grande, com resenhas de verdade** — precisa estar pronto antes
   da busca (`GET /v1/busca`), senão ela não tem sobre o que trabalhar

As fatias 4 e 5 são o que mudou de tamanho. Se o tempo apertar, **corte
pessoas (6) antes de cortar social (4)** — pessoa é uma tela bonita, social é
o que sustenta o produto.
