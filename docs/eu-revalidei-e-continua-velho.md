# "Eu revalidei e continua velho"

É a frase da sprint, e quase nunca é o cache de dados. Entre a API e a tela
existem **quatro camadas** que guardam coisa, cada uma num lugar, cada uma
enganando de um jeito. Este guia é para descobrir qual delas está na sua
frente — com prova, e não com palpite.

Tudo aqui foi medido neste projeto (LP-311), em `next build` + `next start`,
com um título mudado na API no meio do teste. **Em `next dev` nenhuma página é
pré-gerada** — a camada 3 não existe lá —, então sintoma de cache se reproduz
em produção.

## A pergunta que separa as camadas

Não é "qual cache é?". É **"a chamada aconteceu?"** — e ela tem três lugares
para ser respondida:

| Instrumento | Responde |
| --- | --- |
| **o contador** (`scripts/contador-api.mjs`, do card da aula 04) | o servidor do Next chamou a API? |
| **a aba Rede do navegador** | o navegador pediu a página ao servidor? (`documento`, ou `fetch` com `?_rsc=`) |
| **o cabeçalho `x-nextjs-cache`** da resposta | o servidor montou a página agora, ou serviu uma pronta? (`HIT` = pronta) |

```
o conteúdo continua velho
│
├─ a aba Rede mostra um pedido para a página?
│   └─ não → 4. ROTEADOR (o navegador nem perguntou)
│
├─ a resposta veio com x-nextjs-cache: HIT?
│   └─ sim → 3. ROTA INTEIRA (o servidor serviu uma página pronta)
│
├─ o contador registrou a chamada à API?
│   └─ não → 2. DADOS (a página foi montada, com um fetch guardado)
│
└─ registrou, e o conteúdo veio velho → não é cache do front: a API mandou assim
```

**1. MEMOIZAÇÃO** nunca aparece nessa árvore, e isso é o primeiro diagnóstico:
ela dura uma renderização. Se o velho sobreviveu a um F5, não é ela.

## As quatro camadas

### 1. Memoização — dentro de uma renderização

**Onde vive:** na memória do servidor, durante **um** pedido. Todo `fetch` com
a mesma URL e as mesmas opções é feito uma vez só por renderização, e o
`cache()` do React faz o mesmo com funções (é o que envolve `buscarMidia` e
`listarMidias` no `lib/api.ts`).

**O sintoma** não é "velho": é "chamei duas vezes e só saiu uma chamada".

**A prova, medida:** a ficha de um filme que ninguém tinha aberto chama
`buscarMidia` no `generateMetadata` **e** na página.

```
GET /midias/sinais-de-carbono    → contador: 1 chamada  GET /v1/midias/sinais-de-carbono
GET /midias/sinais-de-carbono    → contador: 0 chamadas  ← aqui já é a camada 2
```

### 2. Dados — o `fetch` guardado no servidor

**Onde vive:** no servidor, **entre pedidos e entre pessoas**. É o
`next: { revalidate, tags }` que o `lib/api.ts` põe em cada busca do catálogo.

**O sintoma:** a página é dinâmica — renderiza a cada pedido — e mesmo assim
mostra o velho.

**A prova, medida:** o título de `protocolo-aberto` mudou na API.

```
GET /midias   Cache-Control: private, no-cache, no-store   ← montada agora
              título: "Protocolo Aberto"                    ← o velho
              contador: 0 chamadas                          ← o fetch não saiu
```

**Resolve:** `revalidateTag` com a etiqueta da busca (`docs/cache-tags.md`) —
é o que o `/api/revalidar` (LP-309) e o vigia do catálogo (LP-310) fazem. Ou
esperar o `revalidate` vencer: uma hora, no catálogo.

### 3. Rota inteira — a página pronta

**Onde vive:** no servidor, como HTML e payload já montados. É o que o build
marca com `○` e `●`: a home, as temporadas (LP-303).

**O sintoma:** o servidor nem monta a página. O cabeçalho entrega:

```
GET /   x-nextjs-cache: HIT
        Cache-Control: s-maxage=3600, stale-while-revalidate=31532400
        título: "Protocolo Aberto"   ← o velho
        contador: 0 chamadas
```

**Resolve:** a mesma etiqueta. **Revalidar os dados de uma rota derruba a rota
junto** — o Next liga a página pronta às etiquetas dos `fetch` que a montaram.
Medido, depois de `POST /api/revalidar` com `{ "etiqueta": "midias" }`:

```
GET /        x-nextjs-cache: MISS   "Protocolo Aberto — versão nova"   ← montada de novo
GET /        x-nextjs-cache: HIT    "Protocolo Aberto — versão nova"   ← e guardada
GET /midias                          "Protocolo Aberto — versão nova"
contador: 1 chamada  GET /v1/midias                                   ← uma, para as duas
```

### 4. Roteador — a página na memória do navegador

**Onde vive:** na aba do navegador, no "Client Cache". Guarda o que foi
visitado e o que o `<Link>` pré-carregou.

**O sintoma, e o mais traiçoeiro:** o servidor já responde o novo — o `curl`
mostra —, mas quem navega por `<Link>` continua vendo o velho. Nada no
servidor explica, porque **o servidor não foi perguntado**.

**A prova, medida no Chrome:** o título mudou de novo na API e a etiqueta foi
revalidada.

```
o servidor responde:                  "Protocolo Aberto — versão 3"
/sobre → Link → /                     "Protocolo Aberto — versão nova"   ← a velha
  pedidos ao servidor para "/":       nenhum
router.refresh()                      "Protocolo Aberto — versão 3"
  pedidos:                            fetch / (RSC)
```

F5 também resolve: o Client Cache é da aba, e a recarga o limpa.

**Quanto ele dura** — na documentação da versão instalada
(`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md`):

> - The `dynamic` property is used when the page is neither statically generated nor fully prefetched (e.g. with `prefetch={true}`).
>   - Default: 0 seconds (not cached)
> - The `static` property is used for statically generated pages, or when the `prefetch` prop on `Link` is set to `true`, or when calling `router.prefetch`.
>   - Default: 5 minutes

Página **pré-gerada** fica **5 minutos** no navegador; página dinâmica, **0** —
a não ser no voltar/avançar, que reaproveita. O mesmo arquivo registra a
mudança: *"v15.0.0 — The `dynamic` `staleTimes` default changed from 30s to
0s."* Tutorial escrito antes disso descreve um roteador que não é mais o seu.

A configuração é `experimental.staleTimes`, no `next.config.ts`. Não a use
para "consertar" o sintoma: encurtar o tempo de todo mundo para esconder um
caso é trocar um bug por um custo.

## `router.refresh()`: quando é a ferramenta, e quando é remendo

A linha da documentação (`use-router.md`) que decide:

> This clears the Client Cache for the current route, but does **not**
> invalidate the server-side cache.

**É a ferramenta** quando o que está velho é **só a camada 4**: o servidor já
tem o dado certo e a tela da pessoa não. Por exemplo, depois de uma mudança
feita fora de uma Server Action, num dado que não é de cache — como no quadro
da aula 05, "o dado nem é de cache: `refresh()`".

**É remendo** quando o velho está nas camadas 2 ou 3. O `refresh` pede a
página de novo ao servidor, e o servidor devolve **a mesma coisa guardada**:
a tela pisca e continua velha. Aí o conserto é invalidar a etiqueta no
servidor — e a própria Server Action que muda o dado já traz a tela nova na
resposta, sem `refresh` nenhum (aula 05).
