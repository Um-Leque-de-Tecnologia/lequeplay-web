# API do LequePlay — contrato

Este documento é o combinado entre o back e o front. Ele descreve **o que a
API precisa entregar** para que o `lequeplay-web` funcione por inteiro.

Se você está construindo o backend, é a sua especificação. Se você está no
time de front, é a documentação que você consulta.

---

## O que o backend precisa fazer

Guardar e servir três coisas:

1. **O catálogo** — filmes, séries, podcasts e quem trabalhou neles
2. **As contas** — login, token, perfil
3. **A camada social** — o que cada pessoa assistiu, escreveu, organizou em
   listas e curtiu, e quem segue quem

A terceira é a maior, e é a que sustenta a maior parte das telas.

## O que o backend **não** precisa fazer

Vale dizer o que está fora do escopo, porque muda bastante o tamanho do
trabalho:

- **Busca semântica.** Quem embute e compara é o front, num Route Handler. O
  backend só precisa devolver o texto — sinopses e o texto das resenhas.
- **Qualquer chamada a LLM.** As features de IA moram no front.
- **Renderizar HTML, cuidar de sessão em cookie ou de CORS de navegador.**
  Quem fala com a API é o *servidor* do Next, não o navegador. O front guarda
  o token num cookie `httpOnly` e repassa como `Authorization: Bearer` nas
  chamadas de servidor.

---

## Convenções

| | |
| --- | --- |
| Formato | JSON, `UTF-8` |
| Datas | ISO 8601 (`2026-08-22T19:00:00Z`) |
| Autenticação | `Authorization: Bearer <token>` |
| Idioma dos campos | português, `camelCase` |

### Erros

Toda resposta de erro tem o mesmo formato — isso importa, porque o front tem
uma camada só que trata todos:

```json
{
  "erro": {
    "codigo": "MIDIA_NAO_ENCONTRADA",
    "mensagem": "Nenhuma mídia com o slug informado.",
    "detalhes": []
  }
}
```

Em erro de validação, `detalhes` traz campo a campo:

```json
{
  "erro": {
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [{ "campo": "nota", "mensagem": "Deve estar entre 0 e 10." }]
  }
}
```

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

Query: `?pagina=1&porPagina=24`. Padrão: `pagina=1`, `porPagina=24`, máximo
`60`.

```json
{ "itens": [], "pagina": 1, "porPagina": 24, "total": 137 }
```

**Seja consistente.** Toda listagem devolve este envelope, mesmo quando há um
item só ou nenhum. Listagem que às vezes devolve array puro e às vezes
envelope é a causa nº 1 de front quebrado.

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
| `genero` | `string` | um dos valores de `GET /generos` |
| `sinopse` | `string` | prosa — é o texto da busca semântica |
| `capaUrl` | `string \| null` | `null` quando não há capa |
| `notaMedia` | `number \| null` | **`null` quando ninguém avaliou** — não use `0` |
| `totalAvaliacoes` | `number` | |
| `duracaoTotalMin` | `number` | somado pelo backend — o front não tem os episódios |
| `atualizadoEm` | `string` | ISO — o front usa para revalidar cache |

### Por tipo

**`filme`** acrescenta `diretor: string`.

**`serie`** acrescenta `temporadas: ResumoTemporada[]`, onde cada item é
`{ numero, ano, totalEpisodios }`. **Sem os episódios** — eles vêm do
endpoint da temporada.

**`podcast`** acrescenta `apresentador: string` e
`totalEpisodios: number`.

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

### Usuario

`{ "id": "…", "nome": "…", "email": "…" }`

---

## Endpoints públicos

### `GET /midias`

Lista o catálogo.

| Query | Tipo | |
| --- | --- | --- |
| `tipo` | `filme\|serie\|podcast` | opcional |
| `genero` | `string` | opcional |
| `ano` | `number` | opcional |
| `q` | `string` | busca textual por título e sinopse |
| `pagina`, `porPagina` | `number` | paginação |

Devolve `Pagina<Midia>`. Sem resultado, `itens: []` e `total: 0` — **não é
404**.

### `GET /midias/{slug}`

Devolve uma `Midia`. `404` com `codigo: "MIDIA_NAO_ENCONTRADA"` se não
existir.

### `GET /midias/{slug}/temporadas/{numero}`

Só para série. Devolve a temporada completa, com os episódios. `404` se a
série ou a temporada não existir.

### `GET /generos`

`{ "itens": ["Ação", "Comédia", "Documentário", …] }`

O front usa para montar o filtro — não deixe essa lista chumbada no
front-end.

### `GET /catalogo/versao`

```json
{ "versao": "2026-08-22T19:04:11Z", "totalMidias": 137 }
```

Muda sempre que qualquer título é criado, editado ou removido. O front usa
para decidir se revalida o cache. É barato de implementar e evita revalidação
cega.

---

## Autenticação

### `POST /auth/login`

```json
{ "email": "ana@exemplo.com", "senha": "…" }
```

Resposta `200`:

```json
{
  "token": "eyJhbGciOi…",
  "expiraEm": "2026-08-23T19:04:11Z",
  "usuario": { "id": "u1", "nome": "Ana", "email": "ana@exemplo.com" }
}
```

Credencial errada devolve **`401`** com `codigo: "CREDENCIAL_INVALIDA"`. Use
a mesma mensagem para e-mail inexistente e senha errada — dizer qual dos dois
falhou entrega quais e-mails existem na base.

### `POST /auth/refresh`  ·  `POST /auth/logout`  ·  `GET /auth/eu`

`refresh` renova o token; `eu` devolve o `Usuario` do token atual. Todos
respondem `401` com token ausente, inválido ou expirado.

> **Tempo de vida do token:** algo entre 15 minutos e 1 hora. Curto o
> bastante para o front precisar lidar com expiração — é conteúdo de aula.

---

## Perfil — exige autenticação

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
| `PUT` | `/midias/{midiaId}/avaliacao` | `{ "nota": 8.5 }` · devolve a `Midia` com `notaMedia` recalculada |
| `DELETE` | `/midias/{midiaId}/avaliacao` | remove a avaliação · `204` |

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

> **Avaliação e resenha escrevem o mesmo registro.** `/midias/{id}/avaliacao`
> é a nota rápida, sem texto; `/midias/{id}/resenha` é a nota com texto. Não
> são dois registros — quem avalia e depois resenha o mesmo título continua
> com uma avaliação só. Marcar como assistida e registrar no diário seguem a
> mesma ideia: o diário é a versão com data.

---

---

# Camada social

O catálogo é o substrato. O que gera tela — e o que faz as pessoas voltarem —
é o que elas registram, escrevem e organizam em cima dele.

## Entidades novas

### Pessoa

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

### Credito

Liga uma pessoa a um título. Aparece no detalhe da mídia e na página da
pessoa.

```json
{
  "pessoa": { "slug": "marina-aleixo", "nome": "Marina Aleixo", "fotoUrl": null },
  "papel": "direcao",
  "personagem": null
}
```

`personagem` só é preenchido quando `papel` é `elenco`.

### Resenha

Texto de uma pessoa sobre um título. **Tem página própria e URL
compartilhável** — é o que alimenta a OG image gerada.

```json
{
  "id": "r1",
  "midia": { "slug": "sinais-de-carbono", "titulo": "Sinais de Carbono", "capaUrl": "…" },
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

### Lista

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

### RegistroDiario

"Assisti tal dia." É o histórico, e é a base da recomendação personalizada.

```json
{
  "id": "d1",
  "midia": { "slug": "…", "titulo": "…", "capaUrl": "…" },
  "assistidoEm": "2026-08-20",
  "nota": 8,
  "resenhaId": "r1",
  "revisita": false
}
```

`assistidoEm` é **data**, não timestamp. `revisita: true` quando a pessoa já
tinha assistido antes — a mesma mídia pode ter vários registros.

### UsuarioPublico

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

## Endpoints — pessoas

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/pessoas/{slug}` | dados da pessoa |
| `GET` | `/pessoas/{slug}/creditos` | `Pagina<{ midia, papel, personagem }>` |

O detalhe da mídia (`GET /midias/{slug}`) passa a incluir
`creditos: Credito[]` — no máximo 12, ordenados por relevância. A lista
completa vem do endpoint da pessoa.

## Endpoints — resenhas

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

## Endpoints — listas

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

## Endpoints — diário

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

## Endpoints — pessoas que usam

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

## Endpoints — feed, estatísticas e ranking

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
  "midia": { "slug": "…", "titulo": "…", "capaUrl": "…" },
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

O catálogo de mentira precisa ser bom o suficiente para a busca semântica
fazer sentido. Sem variedade, tudo parece funcionar.

### Catálogo

- **Mínimo 60 títulos**, idealmente 100+
- Os três tipos, com pelo menos **15 séries** (algumas com 2+ temporadas)
- Pelo menos **6 gêneros**
- **Sinopses de verdade**, com 2 a 4 frases descritivas. É sobre esse texto
  que a busca semântica trabalha. Sinopse genérica faz a feature parecer
  quebrada quando ela está certa.
- Alguns títulos **sem avaliação** (`notaMedia: null`)
- Algum título **sem capa** (`capaUrl: null`)

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
  requisito mais caro e o mais importante: é o corpus da busca semântica e do
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
| Título sem nenhuma avaliação | `notaMedia: null` (nunca `0`) |
| Título sem capa | `capaUrl: null` |
| Busca sem resultado | `200` com `itens: []` |
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
   da busca semântica, senão ela não tem sobre o que trabalhar

As fatias 4 e 5 são o que mudou de tamanho. Se o tempo apertar, **corte
pessoas (6) antes de cortar social (4)** — pessoa é uma tela bonita, social é
o que sustenta o produto.
