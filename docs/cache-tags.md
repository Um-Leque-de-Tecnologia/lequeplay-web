# Etiquetas de cache

Toda busca que passa por `lib/api.ts` grava a resposta no cache do Next com
uma ou mais **etiquetas**. Elas existem para a invalidação ser cirúrgica:
quando um título muda na origem, dá para derrubar só o que depende dele em
vez de esperar o tempo de revalidação ou limpar o cache inteiro.

Quem invalida é a rota `POST /api/revalidar` (LP-309), que recebe a etiqueta
e chama `revalidateTag`. Qual função usar numa Server Action — `updateTag`,
`revalidateTag`, `revalidatePath` ou `refresh()` — está em
[`docs/atualizacao-de-cache.md`](atualizacao-de-cache.md).

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

Quando a busca **não deve** ser cacheada — dado de uma pessoa só, por
exemplo — a resposta é uma lista vazia e `revalidar: 0`, como em
`listarHistorico`:

```ts
{ tags: [], revalidar: 0 }
```

Escrever `[]` é diferente de esquecer: a lista vazia diz que alguém pensou no
assunto e decidiu que ali não há o que invalidar.
