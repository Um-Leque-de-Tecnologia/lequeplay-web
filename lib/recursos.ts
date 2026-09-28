/**
 * O que a API já faz — e o que ela ainda não faz.
 *
 * Existe um recurso aqui pela mesma razão que existe o `USAR_MOCK`: separar
 * "o código está pronto" de "o endereço existe". Os dois são verdades
 * diferentes, e misturá-las é o que produz botão que falha no clique.
 *
 * ## Por que não basta escrever a action e confiar na sorte
 *
 * `PUT /v1/midias/{id}/resenha` está marcado 🕓 em `docs/api-contrato.md`: é
 * combinado, não realidade. Conferido na API publicada:
 *
 * ```
 * GET /v1/midias/{id}          -> 200
 * GET /v1/midias/{id}/resenha  -> 404 page not found
 * ```
 *
 * Com o recurso desligado, a ficha continua mostrando o que mostra hoje — o
 * campo de escrever e a frase dizendo que publicar ainda não existe. Ligar é
 * mudar o `.env`, não o código das telas.
 */

/**
 * Se o endpoint de publicar resenha está no ar.
 *
 * `=== "true"` e não `!== "false"`: aqui o padrão é **desligado**. No
 * `USAR_MOCK` o padrão é ligado porque a ausência de configuração significa
 * "ainda não tenho backend"; neste, a ausência significa "não sei se o
 * endpoint existe" — e a resposta segura para essa dúvida é não prometer.
 */
export const RESENHA_PUBLICAVEL = process.env.RESENHA_ENDPOINT_EXISTE === "true";
