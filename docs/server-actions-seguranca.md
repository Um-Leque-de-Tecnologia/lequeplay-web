# Server Action é endpoint público

Uma Server Action parece uma função: você escreve `async function entrar(...)`,
importa, e chama. Ela **não** é uma função — é um endereço na internet.

Este documento é para quem vai escrever a próxima action do LequePlay. Ele
separa duas coisas que costumam virar uma só na cabeça da gente: **o que o
framework já garante** (e você não precisa reimplementar) e **o que continua
sendo trabalho seu** (e ninguém vai fazer por você).

Tudo o que está aqui foi conferido no projeto, contra o servidor de produção
(`npm run build && npm start`). Onde há número, ele foi medido; onde é citação
da documentação, a linha está indicada.

---

## O que acontece quando você escreve `"use server"`

A documentação da versão instalada
(`node_modules/next/dist/docs/01-app/02-guides/server-actions.md`) explica:

> A Server Action runs as a POST request against the page that invokes it. At
> build time, the `'use server'` directive tells the compiler to swap the
> function's implementation in client bundles for a reference (an action ID
> plus a dispatcher) that POSTs back to the server. The implementation stays on
> the server, but the route is reachable to anyone who can send the same POST.
> **Treat every action as an untrusted entry point.**

Na prática: o código não vai para o navegador, mas **o endereço vai**. Qualquer
pessoa com `curl` manda o mesmo POST, com o corpo que quiser, sem passar pela
sua tela. O formulário que você desenhou, os campos que você marcou como
obrigatórios, o botão que você desabilitou — nada disso está no caminho.

---

## O que o Next já faz por você

### 1. Compara o `Origin` com o `Host`

É a proteção contra CSRF, e ela funciona. Medido aqui, postando a action de
entrar três vezes, mudando **só** o cabeçalho `Origin`:

| `Origin` enviado | resposta | a sessão foi criada? |
| --- | --- | --- |
| `http://127.0.0.1:3100` (o próprio site) | `303` → `/` | sim, 2 cookies |
| `https://golpe.example` | **`500`** | **não** |
| *(nenhum)* | `303` → `/` | sim, 2 cookies |

No caso do meio, a action **nem rodou**. O log do servidor diz por quê:

```
⚠ `x-forwarded-host` header with value `127.0.0.1:3100` does not match
  `origin` header with value `golpe.example` from a forwarded Server Actions
  request. Aborting the action.
⨯ Error: Invalid Server Actions request.
```

**Duas observações que só aparecem medindo:**

- Para quem chamou, isso chega como **`500 Internal Server Error`**, e não como
  um `403` educado. A mensagem fica no log do servidor, não na resposta. Se
  você ver um 500 misterioso numa action, olhe o log antes de caçar bug no seu
  código.
- **Sem `Origin` nenhum, a action roda.** A terceira linha da tabela é isso: o
  POST passou e a sessão foi criada, com um aviso no log (`Missing origin
  header from a forwarded Server Actions request`). Todo navegador manda
  `Origin` num POST entre sites — quem não manda é `curl`, script, e qualquer
  coisa que não seja navegador. Ou seja: **essa proteção defende a pessoa que
  usa o site, não o endpoint.**

### 2. Limita o tamanho do corpo

1 MB por padrão. Configurável em `serverActions.bodySizeLimit`.

### 3. Criptografa os IDs das actions e remove o que não é usado

Referências de action são criptografadas no build, e Server Functions que
ninguém usa são removidas dos pacotes do cliente — elas não viram endpoint.

### 4. Criptografa variáveis capturadas por closure

Se uma action inline usa uma variável de fora, esse valor **viaja até o
cliente e volta**. O Next o criptografa com uma chave nova a cada build. A
própria documentação avisa (`02-guides/data-security.md`):

> We don't recommend relying on encryption alone to prevent sensitive values
> from being exposed on the client.

Em produção com mais de uma instância, as chaves divergem entre servidores; aí
é preciso fixar `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

---

## O que continua sendo nosso

A documentação é direta: *"Framework protections are not a substitute for
application-level checks."*

### Validar tudo o que chega no `FormData`

`FormData`, query e cabeçalhos são texto de estranho. Sempre.

O LP-407 é o exemplo caro disso: o campo escondido `de`, do formulário de
login, virava um redirecionador aberto. O servidor aprovava `/<TAB>/golpe.example`
porque começa com uma barra só — e o navegador, ao resolver o endereço,
descarta o TAB e vai para `//golpe.example`, outro host. A validação está em
[`lib/destino-seguro.ts`](../lib/destino-seguro.ts), e roda **na action**.

### Conferir a sessão dentro de cada action que precisa dela

Renderizar o formulário só para quem está logado **não é** barreira. A
documentação:

> Render-time gating (only rendering a form on an authenticated page) is not a
> security boundary, because requests can be sent without going through the UI.

### Não confiar no `proxy.ts` para isso

Esta é a armadilha mais fácil de cair, e a documentação a descreve em
`03-file-conventions/proxy.md`:

> Server Functions are not separate routes in this chain. They are handled as
> POST requests to the route where they are used, so a Proxy matcher that
> excludes a path will also skip Proxy coverage. (…) A matcher change or a
> refactor that moves a Server Function to a different route can silently
> remove Proxy coverage.

Leia de novo a palavra **silently**. O `matcher` do nosso `proxy.ts` cobre
`/perfil/:path*`. No dia em que alguém mover a action de sair para outra rota,
ou apertar o `matcher`, a action deixa de passar pelo proxy — e nada quebra,
nada avisa.

Por isso o proxy aqui é atalho de navegação, não autorização. Quem decide é
quem busca o dado: a DAL em [`lib/dal.ts`](../lib/dal.ts) pergunta ao
`/v1/auth/me` se o token vale.

### Nunca receber token como parâmetro

O token mora em cookie `httpOnly` (LP-403) justamente para o JavaScript da
página não o enxergar. Uma action que recebe `token` como argumento obriga
alguém a tirá-lo de lá — e desfaz a proteção inteira.

Quem precisa do token, lê do cookie **dentro** da action.

### Devolver só o que a tela mostra

O retorno de uma action é serializado para o cliente. Ele é resposta, não
despejo de banco.

O `EstadoDoLogin` da nossa action de entrar devolve `{ erro?, usuario? }` — e
não devolve a senha digitada, de propósito: ela iria e voltaria pela rede sem
necessidade nenhuma.

---

## `allowedOrigins`: quando é preciso

O `next.config.ts` deste projeto **não** configura `serverActions` — tudo está
no padrão do framework, que é o que foi medido acima.

`serverActions.allowedOrigins` passa a ser necessário quando o site roda atrás
de **proxy reverso ou CDN** e o domínio que o servidor enxerga é diferente do
domínio público. Como a comparação é `Origin` contra `Host`/`X-Forwarded-Host`,
nesse cenário as actions começam a ser recusadas em produção — com o mesmo 500
opaco da tabela lá em cima.

```js
// next.config.js
module.exports = {
  experimental: {
    serverActions: { allowedOrigins: ["my-proxy.com", "*.my-proxy.com"] },
  },
};
```

---

## As actions que existem hoje

| arquivo | o que faz | o que ela confere |
| --- | --- | --- |
| [`app/entrar/acoes.ts`](../app/entrar/acoes.ts) | troca usuário e senha por sessão | campos vazios, destino do `?de=`, e devolve a mesma mensagem para usuário inexistente e senha errada |
| [`app/perfil/acoes.ts`](../app/perfil/acoes.ts) | encerra a sessão | lê o token de renovação do cookie; apaga os cookies mesmo se a API falhar |

As duas são POST, as duas são endereços públicos, e nenhuma das duas recebe
token como parâmetro.

---

## Como reproduzir o teste do `Origin`

Suba o servidor de produção e poste a action mudando só o cabeçalho:

```sh
curl -i -X POST http://127.0.0.1:3100/entrar \
  -H "Origin: https://golpe.example" \
  -F "usuario=quemquer" -F "senha=oquequer" \
  -F '$ACTION_ID_...=...'
```

O caminho honesto é ler os campos escondidos (`$ACTION_*`) do HTML da página
antes de postar — é o que o navegador faz sem JavaScript, e é como as medições
deste documento foram feitas. **E olhe o log do servidor**: é lá que está a
razão da recusa, não na resposta.
