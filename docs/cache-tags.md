# Tags de cache

As buscas feitas pela camada `lib/api.ts` usam tags para permitir a
invalidação do cache sem precisar esperar o tempo de revalidação.

## Schema

| Busca | Endpoint | Tags | O que invalida |
|---|---|---|---|
| Listagem de mídias | `/midias` | `midias` | O catálogo |
| Busca de mídias | `/busca` | `midias` | Resultados do catálogo |
| Ficha de mídia | `/midias/:slug` | `midias`, `midia:<slug>` | O catálogo e a ficha específica |
| Gêneros | `/generos` | `generos` | Lista de gêneros |
| Histórico | `/perfil/historico` | nenhuma | Não possui cache |

## Tags de mídia

A tag geral do catálogo é:

```text
midias