# API do LequePlay — contrato

Este documento é o combinado entre o back e o front. Ele descreve **o que a
API precisa entregar** para que o `lequeplay-web` funcione por inteiro.

Se você está construindo o backend, é a sua especificação. Se você está no
time de front, é a documentação que você consulta.

---

## O que o backend precisa fazer

Guardar e servir o catálogo, as contas e o que cada pessoa marcou. Só isso.

## O que o backend **não** precisa fazer

Vale dizer o que está fora do escopo, porque muda bastante o tamanho do
trabalho:

- **Busca semântica.** Quem embute e compara é o front, num Route Handler. O
  backend só precisa devolver o texto dos títulos — sinopse e afins.
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
| `GET` | `/perfil/lista` | `Pagina<Midia>` — minha lista |
| `PUT` | `/perfil/lista/{midiaId}` | adiciona · `204` · idempotente |
| `DELETE` | `/perfil/lista/{midiaId}` | remove · `204` |
| `GET` | `/perfil/assistidas` | `Pagina<Midia>` |
| `PUT` | `/perfil/assistidas/{midiaId}` | marca como assistida · `204` |
| `DELETE` | `/perfil/assistidas/{midiaId}` | desmarca · `204` |
| `GET` | `/perfil/avaliacoes` | `{ itens: [{ midiaId, nota, avaliadoEm }] }` |
| `PUT` | `/midias/{midiaId}/avaliacao` | `{ "nota": 8.5 }` · devolve a `Midia` com `notaMedia` recalculada |
| `DELETE` | `/midias/{midiaId}/avaliacao` | remove a avaliação · `204` |

**`PUT` e não `POST`** nas três primeiras porque são idempotentes: adicionar
duas vezes à lista tem o mesmo efeito de adicionar uma. Isso deixa a UI
otimista do front muito mais simples — ela pode reenviar sem medo.

**A avaliação devolve a mídia atualizada.** Sem isso o front teria que fazer
uma segunda chamada só para saber a nova média.

Regras: `nota` de `0` a `10`, com uma casa decimal. Uma avaliação por pessoa
por mídia — reenviar substitui.

---

## Dados de exemplo

O catálogo de mentira precisa ser bom o suficiente para a busca semântica
fazer sentido. Sem variedade, tudo parece funcionar.

- **Mínimo 60 títulos**, idealmente 100+
- Os três tipos, com pelo menos **15 séries** (algumas com 2+ temporadas)
- Pelo menos **6 gêneros**
- **Sinopses de verdade**, com 2 a 4 frases descritivas. Este é o requisito
  mais importante: é sobre esse texto que a busca semântica trabalha. Sinopse
  genérica faz a feature da sprint 6 parecer quebrada quando ela está certa.
- Alguns títulos **sem avaliação** (`notaMedia: null`)
- Algum título **sem capa** (`capaUrl: null`)
- Pelo menos **3 usuários de teste**, com listas e avaliações já preenchidas

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

---

## Não-funcionais

- **Sem autenticação nos endpoints públicos.** O catálogo é aberto.
- **Limite de requisições** por IP nos públicos e por usuário nos
  autenticados. Devolva `429` com `Retry-After`.
- **Tempo de resposta**: até 300ms nas listagens com o catálogo de exemplo.
- **Documentação viva** — OpenAPI publicada. A aula 1 pede que a turma leia a
  documentação da API, então ela precisa existir e estar certa.
- **Ambiente de desenvolvimento** que suba com um comando e já venha semeado.
  Se cada aluno tiver que popular o banco na mão, metade não passa da aula 1.
- **CORS** não é necessário para o front (quem chama é o servidor do Next),
  mas libere `localhost` se quiser permitir teste direto do navegador.

---

## Ordem sugerida de construção

O front consegue trabalhar com mock, então o backend pode entregar em fatias.
Esta ordem destrava o curso na sequência das sprints:

1. `GET /midias`, `GET /midias/{slug}`, `GET /generos` — destrava as sprints 0 e 1
2. `GET /midias/{slug}/temporadas/{numero}` e `GET /catalogo/versao` — sprint 1
3. `POST /auth/login`, `GET /auth/eu` — sprint 2
4. Perfil e avaliação — sprint 2
5. Catálogo grande, com sinopses ricas — **antes da sprint 3**, senão a busca
   semântica não tem sobre o que trabalhar
