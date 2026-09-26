# Qual aviso de cache usar

Depois que uma Server Action altera um dado, o Next tem quatro jeitos de
avisar que algo mudou: `updateTag`, `revalidateTag`, `revalidatePath` e
`refresh()`. Eles não se substituem. A alteração pode estar salva no servidor
e a pessoa continuar vendo o valor antigo, se o aviso escolhido não redesenha
a rota na mesma resposta.

A decisão abaixo saiu da seção "Choosing a cache update" da versão instalada,
em `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, linhas
141–150. Cada critério cita a linha que o sustenta.

## O critério

| Quando usar | Qual | Critério |
| --- | --- | --- |
| A pessoa precisa ver a própria mudança agora | `updateTag` | Expira a etiqueta na hora, e a releitura que volta na resposta da action espera o dado novo (linha 145). |
| Pode atualizar depois, em segundo plano | `revalidateTag` | Marca a etiqueta para um refresh stale-while-revalidate: a leitura seguinte ainda recebe o valor velho enquanto o novo é buscado por trás (linha 146). |
| Só um endereço foi afetado | `revalidatePath` | Invalida pela URL quando uma rota só mudou e etiquetar seria excesso (linha 147). |
| O dado nem é de cache | `refresh()` | Busca de novo o payload da rota atual sem invalidar cache, quando a tela depende de estado fora do cache que a action acabou de mudar (linha 148). |

`updateTag`, `revalidatePath` e `refresh()` redesenham a rota atual no
servidor e incluem esse payload na resposta da action, então a página reflete
a mudança na mesma ida e volta (linhas 43–47 e 150). `updateTag` só pode ser
chamado de dentro de uma Server Action.

## Revalidei e continua velho

`revalidateTag` com perfil de stale-while-revalidate é a exceção. Ele marca a
etiqueta para refresh em segundo plano e **não** inclui um redesenho na
resposta da action. A página só reflete a mudança numa leitura seguinte
(linhas 74 e 150).

A revalidação aconteceu. A tela daquela resposta continua a antiga. É isso
que aparece como "revalidei e continua velho".

O perfil que faz isso é o `"max"` (ou outro perfil de cache-life com
stale-while-revalidate). `POST /api/revalidar` usa outro perfil da mesma
função: `revalidateTag(etiqueta, { expire: 0 })`, que expira na hora. Esse
segundo argumento é o caminho de Route Handler e webhook, documentado em
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`,
linha 139. Dentro de uma action, quem precisa da tela nova na hora é
`updateTag`, não o `"max"`.

## As etiquetas que já existem

A aula 03 já etiquetou o cache por recurso. O esquema está em
[`docs/cache-tags.md`](cache-tags.md) e as constantes em
[`lib/cache-tags.ts`](../lib/cache-tags.ts):

| Recurso | Etiqueta |
| --- | --- |
| Catálogo | `midias` (`CACHE_TAGS.MIDIAS`) |
| Ficha de um título | `midia:<slug>` (`tagMidia(slug)`), junto com `midias` |
| Gêneros | `generos` (`CACHE_TAGS.GENEROS`) |
| Histórico | nenhuma: `tags: []` e `revalidar: 0`, porque o dado é de uma pessoa só |

Quem invalida de fora continua sendo `POST /api/revalidar`: recebe a etiqueta
e chama `revalidateTag` com `{ expire: 0 }`. Uma action nova de um recurso
que já tem etiqueta usa **essa** etiqueta — `updateTag(CACHE_TAGS.MIDIAS)`,
`updateTag(tagMidia(slug))` ou `updateTag(CACHE_TAGS.GENEROS)` — e não uma
string nova. Etiqueta é acordo entre quem grava o cache e quem invalida;
`"midia"` sem o `s` não gera erro, a invalidação simplesmente não acontece.

A regra de alcance continua a de [`docs/cache-tags.md`](cache-tags.md):
invalide a etiqueta mais estreita que resolve o caso. `midias` derruba o
catálogo inteiro; `midia:<slug>` derruba só aquela ficha.
