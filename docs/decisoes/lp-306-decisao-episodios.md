# Decisão arquitetural: LP-306 — Tratamento de episódios de séries

- **Ticket:** LP-306 (`feat/lp-306-decisao-episodios`)
- **Data:** 21 de setembro de 2026
- **Status:** Aceita

---

## 1. Contexto

A ementa do curso e o desenho conceitual do produto estabelecem uma hierarquia clássica de exibição para streaming:

$$\text{Mídia (Série)} \longrightarrow \text{Temporada} \longrightarrow \text{Episódio}$$

No entanto, ao confrontar a especificação com a implementação real da API (`lequeplay-api`), verificou-se que o backend publica no detalhe da série (`GET /v1/midias/{slug}`) apenas o resumo das temporadas. É o schema `Temporada` da documentação publicada (https://api.lequeplay.rodolfodebonis.com.br/docs):

```yaml
Temporada:
  properties:
    numero: { type: integer }
    nome: { type: string }
    ano: { type: integer }
    totalEpisodios: { type: integer }
  required: [numero, totalEpisodios]
```

`nome` e `ano` podem faltar (LP-305), e a chave `episodios` não existe: ela nem aparece na resposta. As rotas publicadas são `/v1/generos`, `/v1/midias`, `/v1/midias/{id}`, `/v1/busca`, `/v1/catalogo/versao` e as de autenticação — não há rota de temporada.

A API real **não envia o array detalhado de episódios** dentro de cada temporada. O endpoint dedicado `GET /v1/midias/{slug}/temporadas/{numero}` consta no [contrato da API](../api-contrato.md) marcado como `❓ A confirmar`, ainda pendente de desenvolvimento na API em Go.

Só o mock (`data/midias.json`) traz a lista de episódios; ali, *Mapa das Marés* tem uma temporada com `episodios: []` e `totalEpisodios: 0`. Com a API, a chave simplesmente não vem.

---

## 2. A decisão tomada

Diante da ausência do payload de episódios na API pública, foram avaliadas três alternativas:

1. **Simular artificialmente no cliente:** Gerar um array sintético de episódios com base em `totalEpisodios` (ex.: "Episódio 1", "Episódio 2", com durações fictícias).
2. **Criar rotas fantasmas:** Subir páginas como `/midias/[slug]/temporada/[numero]/episodio/[n]` sem correspondência no backend.
3. **Apresentação honesta com fallback gracioso:** Renderizar com clareza o que existe (número da temporada, ano e total de episódios) e exibir um estado vazio informativo quando a lista detalhada não estiver disponível.

### Por que a alternativa 3 foi a escolhida

- **Integridade dos dados:** O front-end não deve inventar dados nem mentir para quem usa o sistema. Gerar episódios genéricos ("Episódio 1", "Episódio 2") transmitiria uma falsa precisão e causaria inconsistência quando a API passasse a fornecer os dados reais (títulos verdadeiros, durações específicas e sinopses).
- **Sem rotas órfãs:** Criar rotas `/episodio/[n]` sem um identificador estável ou endpoint correspondente geraria URLs quebradas, problemas de indexação e complexidade de manutenção desnecessária.
- **Transparência e acessibilidade:** o tipo diz a verdade — `episodios?: Episodio[]` em `lib/tipos.ts` —, e o compilador cobra a ausência de quem lê. A página da temporada ([`app/midias/[slug]/temporada/[numero]/page.tsx`](../../app/midias/[slug]/temporada/[numero]/page.tsx)) e o seletor da ficha ([`components/ficha-temporadas.tsx`](../../components/ficha-temporadas.tsx)) leem `temporada.episodios ?? []`. Sem a lista, a tela mostra número, ano e total, e diz "N episódios — a lista ainda não está disponível". "Os episódios desta temporada ainda não foram anunciados" fica só para `totalEpisodios: 0`, que é o único caso em que a frase é verdade.

  Antes desta decisão, a ficha fazia `temporada.episodios.length`, e com `USAR_MOCK=false` toda série respondia 500 (`Cannot read properties of undefined`).

---

## 3. Proposta de contrato para inclusão futura na API

Para permitir a exibição granular dos episódios nas sprints futuras da camada de catálogo, foi submetida a seguinte proposta de contrato para o time de backend.

### 3.1. Endpoint de temporada completa

- **Método:** `GET`
- **Rota:** `/v1/midias/{slug}/temporadas/{numero}`
- **Autenticação:** Pública (sem necessidade de token)

#### Parâmetros de rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `slug` | `string` | O identificador amigável da série (ex.: `protocolo-aberto`) |
| `numero` | `integer` | O número da temporada na emissora (ex.: `1`). Aceita `0` para temporada de especiais |

#### Resposta de sucesso (`200 OK`)

```json
{
  "numero": 1,
  "ano": 2024,
  "totalEpisodios": 4,
  "episodios": [
    {
      "numero": 1,
      "titulo": "Um commit qualquer",
      "duracaoMin": 48,
      "sinopse": "A equipe descobre uma alteração não documentada no repositório central na véspera do lançamento."
    },
    {
      "numero": 2,
      "titulo": "Três mantenedores e um fim de semana",
      "duracaoMin": 44,
      "sinopse": "Uma falha crítica obriga os mantenedores a reescrever o módulo de concorrência em menos de 48 horas."
    }
  ]
}
```

#### Tipagem TypeScript esperada no front (`lib/tipos.ts`)

```ts
export type Episodio = {
  /** Posição sequencial na temporada, começando em 1. */
  numero: number;
  titulo: string;
  duracaoMin: number;
  sinopse?: string;
};

export type TemporadaCompleta = {
  numero: number;
  nome?: string;
  ano?: number;
  totalEpisodios: number;
  episodios: Episodio[];
};
```

#### Respostas de erro esperadas (RFC 7807 — `application/problem+json`)

1. **Série inexistente (`404 Not Found`):**
   ```json
   {
     "type": "about:blank",
     "title": "Mídia não encontrada",
     "status": 404,
     "detail": "nenhuma série encontrada com o slug informado",
     "instance": "/v1/midias/nao-existe/temporadas/1"
   }
   ```

2. **Temporada inexistente na série (`404 Not Found`):**
   ```json
   {
     "type": "about:blank",
     "title": "Temporada não encontrada",
     "status": 404,
     "detail": "a série não possui a temporada informada",
     "instance": "/v1/midias/protocolo-aberto/temporadas/99"
   }
   ```

3. **Mídia não é série (`400 Bad Request` ou `404 Not Found`):**
   Caso a rota seja requisitada para um filme ou podcast (ex.: `/v1/midias/sinais-de-carbono/temporadas/1`), responder `404 Not Found` informando que o recurso não possui temporadas.

### 3.2. Integração no front-end quando o endpoint for publicado

Assim que a API disponibilizar a rota acima, a função correspondente em [`lib/api.ts`](../../lib/api.ts) será implementada respeitando as convenções de cache:

```ts
export const buscarTemporada = cache(async (
  slug: string,
  numero: number,
): Promise<TemporadaCompleta | null> => {
  try {
    return await buscar<TemporadaCompleta>(`/midias/${slug}/temporadas/${numero}`, {
      tags: [CACHE_TAGS.MIDIAS, tagMidia(slug)],
      revalidar: 3600,
    });
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) return null;
    throw erro;
  }
});
```
