# Etiquetas de cache

Toda busca que passa por `lib/api.ts` grava a resposta no cache do Next com
uma ou mais **etiquetas**. Elas existem para a invalidação ser cirúrgica:
quando um título muda na origem, dá para derrubar só o que depende dele em
vez de esperar o tempo de revalidação ou limpar o cache inteiro.

Quem invalida é a rota `POST /api/revalidar` (LP-309), que recebe a etiqueta
e chama `revalidateTag`.

## O esquema

| Busca | Endpoint | Etiquetas | O que a invalidação derruba |
| --- | --- | --- | --- |
| `listarMidias` | `GET /midias` | `midias` | a listagem do catálogo |
| `buscarMidia` | `GET /midias/{slug}` | `midias`, `midia:<slug>` | o catálogo **e** aquela ficha |
| `listarGeneros` | `GET /generos` | `generos` | a lista de gêneros |
| `listarHistorico` | `GET /perfil/historico` | nenhuma | nada: esta busca não é cacheada |

As constantes estão em [`lib/cache-tags.ts`](../lib/cache-tags.ts). Não
escreva a string à mão: etiqueta é acordo entre quem grava o cache e quem
invalida, e `"midia"` sem o `s` não gera erro nenhum — a invalidação
simplesmente não acontece.

## As duas etiquetas da ficha

A ficha de um título carrega **as duas**:

```ts
tags: [CACHE_TAGS.MIDIAS, tagMidia(slug)]
```

Isso dá dois alcances pelo preço de um:

- **`midia:reacher`** — o título mudou (sinopse corrigida, capa nova). Só
  aquela ficha sai do cache; o catálogo continua servido de graça.
- **`midias`** — o catálogo mudou de forma ampla (reingestão, título novo,
  título removido). Todas as fichas saem junto, porque qualquer uma delas
  pode estar desatualizada.

A regra para escolher: **invalide a etiqueta mais estreita que resolve o seu
caso.** `midias` é o martelo, e usar martelo para tudo transforma o cache em
enfeite.

## Por que `midias`, e não `catalogo`

Duas palavras para a mesma coisa é como o esquema apodrece: metade do código
grava `catalogo`, metade invalida `midias`, e a invalidação para de funcionar
sem ninguém perceber. O nome escolhido é **`midias`**, igual ao recurso da
API (`/v1/midias`) e ao nome do tipo no front.

## Busca nova, etiqueta obrigatória

O tipo `Opcoes` de `lib/api.ts` declara `tags` como **campo obrigatório**.
Não é decoração: é o compilador cobrando o que a disciplina humana esquece.
Quem escrever uma busca nova sem etiqueta não passa do `npm run typecheck`.

Quando a busca **não deve** ser cacheada, há dois casos, e nenhum é
esquecimento:

- **dado de uma pessoa** — o histórico, o `/auth/me` — não passa pelo
  `buscar`: sai pelo `buscarComToken`, que é sempre `no-store` e nem aceita
  opção de cache (LP-411);
- **dado que precisa ser lido na hora** — a versão do catálogo, que o vigia do
  LP-310 compara — usa `semCache: true`, com `tags: []`. Escrever `[]` é
  diferente de esquecer: a lista vazia diz que alguém pensou no assunto e
  decidiu que ali não há o que invalidar.

## Medido (LP-307)

Chamadas à API por visita, contadas no contador entre o front e a API, em
`next build` + `next start` — nunca em `dev`. O "antes" é o mesmo código com
`cache: "no-store"` forçado no `buscar`, só para a medição.

| Visita | Antes (sem cache) | Depois (o `lib/api.ts` de hoje) |
| --- | --- | --- |
| ficha de filme, 1ª | 2 · 657 ms | 1 · 506 ms |
| ficha de filme, 2ª | 2 · 233 ms | **0** · 210 ms |
| `/midias`, 1ª | 2 · 225 ms | 1 · 295 ms |
| `/midias`, 2ª | 2 · 237 ms | **0** · 183 ms |
| `/midias?tipo=serie`, 1ª | 2 · 254 ms | **0** · 254 ms |
| `/midias?tipo=serie`, 2ª | 2 · 175 ms | **0** · 249 ms |

**A segunda visita não chama a API.** A primeira chama só o que ninguém buscou
ainda: a lista do catálogo e a de séries já foram buscadas no build — pela
home e pelo `generateStaticParams` das temporadas (LP-303) —, e a primeira
visita de verdade já as encontra guardadas.

**A ficha busca o catálogo inteiro, mesmo existindo.** Sem cache, toda ficha
custa 2 chamadas: a do título e `/v1/midias`. A segunda vem do
`app/midias/[slug]/not-found.tsx`, que busca destaques para sugerir — e o Next
monta o `not-found` junto com a página, como fronteira, **também quando ela
não é usada**. Com o cache, o custo não aparece; sem ele, é uma chamada a mais
em toda ficha.

**Cache não substitui tempo limite.** A primeira pessoa depois de o
`revalidate` vencer ainda espera a API — por isso o `AbortSignal.timeout` de
10 s do LP-211 continua em toda busca.
