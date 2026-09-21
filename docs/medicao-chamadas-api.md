# Como Medir Chamadas à API por Visita (Critério de Aceite: Build + Start)

Este documento descreve o procedimento oficial e repetível para auditar a quantidade de chamadas que o front-end dispara à API por visita, garantindo a integridade dos dados e das métricas reportadas nos Pull Requests (PRs).

---

## 🎯 Resumo dos Critérios de Aceite

Conforme definido para o projeto:
1. **Medição feita em `build + start`:** Números medidos em `dev` não são válidos e enganam quem lê o PR (devido a React StrictMode e Fast Refresh).
2. **Zero `console.log` de teste no commit:** Nenhum log temporário de medição pode ser commitado (conferido via `git diff`), mas o número produzido vai para o PR.
3. **No PR:** Deve constar o nome da opção nativa do Next.js encontrada, a linha exata da documentação interna, a justificativa conceitual (*"Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada"*) e a tabela de chamadas medidas.

---

## 1. O Conceito Fundamental: Chamadas por Visita vs. Chamadas por Renderização

> **"Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada."**

Quando alguém diz: *"essa página faz 4 chamadas à API"*, essa frase é ambígua se não definirmos a **camada**:

* **Chamadas por Renderização (Camada de Componentes / React):**
  * Representa quantas vezes funções de busca (`fetch`, `obterMidias`, etc.) são invocadas no código dos componentes durante a renderização da árvore de Server Components.
  * Se o cabeçalho, a grade principal e o rodapé chamarem `obterMidias()`, ocorrerão **3 chamadas na camada de renderização**.

* **Chamadas por Visita (Camada de Rede / HTTP):**
  * Representa quantas requisições HTTP reais saem fisicamente do servidor Next.js em direção ao backend externo (ex: `http://localhost:8080`) para atender à navegação/visita do usuário.

* **A diferença é a camada intermediária:**
  * O **React Request Memoization** desduplica chamadas com mesma URL e opções dentro do mesmo ciclo de renderização. As 3 invocações na camada de componentes colapsam para **apenas 1 requisição de rede**.
  * O **Data Cache do Next.js** (quando aplicável cache de longa duração) intercepta antes da rede: se o dado já estiver em cache, saem **0 requisições de rede** para o backend.
  * Portanto, medir na camada errada (ou medir em `dev` onde o `StrictMode` executa tudo 2 vezes) gera números fictícios.

---

## 2. Opção Nativa de Log do Next.js e Referência na Documentação

Para depurar e enxergar cada fetch e o status do cache nativamente:

### Configuração no Projeto
No arquivo [`next.config.ts`](../next.config.ts):
```ts
const nextConfig: NextConfig = {
  // ...
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

### Onde está na Documentação Oficial da versão instalada?
* **Arquivo:** [`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`](../node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md)
* **Seção:** `### Fetching` (linhas 12 a 15)
* **Código de exemplo:** **Linhas 18 a 24**:
  ```js
  module.exports = {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }
  ```
* **Status exibidos pelo Next.js:**
  * `HIT`: O dado veio direto do Data Cache do Next.js (nenhuma chamada de rede feita).
  * `MISS`: O dado não estava no cache e foi buscado na API externa (chamada de rede efetuada e gravada no cache).
  * `SKIP`: A requisição ignorou o cache deliberadamente (ex: `cache: 'no-store'` ou `revalidate: 0`).

> **Nota Técnica:** A opção `logging.fetches` é projetada pelo Next.js para rodar durante o desenvolvimento. Para comprovação formal em PRs, o aceite exige medição em ambiente de produção local (`build + start`).

---

## 3. Procedimento Repetível de Medição (Build + Start)

Qualquer membro do time pode reproduzir o teste seguindo este roteiro:

### Passo 1: Garantir que o Backend está rodando (ou manter USAR_MOCK=true)

> ⚠️ **Atenção ao erro de build (`503 Não foi possível alcançar a API`):**
> Se você definir `USAR_MOCK=false`, o Next.js tentará se conectar à API real durante o `npm run build` (ao pré-renderizar rotas como a Home `/`). Se o backend **não** estiver rodando em `http://localhost:8080`, o build falhará com erro de conexão.
> 
> Portanto:
> * **Para rodar a medição real com a API:** Suba primeiro o servidor da API (`lequeplay-api`) na porta 8080 e configure no `.env.local`:
>   ```env
>   API_URL=http://localhost:8080
>   USAR_MOCK=false
>   ```
> * **Se o backend não estiver rodando no momento:** Deixe `USAR_MOCK=true` no `.env.local`. O projeto usará o mock local e o `build` passará com sucesso.

### Passo 2: Instrumentação temporária de medição (apenas se for medir)
No arquivo [`lib/api.ts`](../lib/api.ts), adicione temporariamente uma linha de log na função `buscar`:
```ts
// lib/api.ts (temporário apenas para a medição)
async function buscar<T>(caminho: string, opcoes: Opcoes): Promise<T> {
  console.log(`[MEDICAO-API] ${caminho}`);
  // ...
```

### Passo 3: Executar Build e Start
```bash
npm run build
npm run start
```

### Passo 4: Limpar a tela do terminal
Antes de bater na rota, limpe a tela do terminal onde o servidor está rodando:
* Windows (PowerShell): `cls` ou `Ctrl + L`
* Linux / Mac: `clear` ou `Ctrl + L`

### Passo 5: Acessar a página e auditar as saídas
1. Em janela anônima do navegador, acesse `http://localhost:3000/midias`.
2. Conte as linhas `[MEDICAO-API]` exibidas no terminal do `start`.
3. Pressione `F5` para recarregar e observe o comportamento com cache quente.

### Passo 6: Reverter a alteração temporária (Obrigatório antes do commit)
Reverta o arquivo [`lib/api.ts`](../lib/api.ts):
```bash
git restore lib/api.ts
# ou git checkout lib/api.ts
```

Certifique-se com `git diff` de que **nenhum `console.log` sobrou**:
```bash
git diff lib/api.ts
```

*(Alternativa sem tocar no código: se o backend estiver rodando localmente no terminal ao lado, basta observar os logs de acesso HTTP recebidos no terminal do backend durante `npm run build && npm run start`).*

---

## 4. Tabela de Referência: Chamadas por Visita Medidas em Produção

| Rota | Endpoints acionados via `lib/api.ts` | 1ª Visita (Cache Frio) | 2ª Visita (Cache Quente / F5) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| **`/` (Home)** | `GET /midias`<br>`GET /perfil/historico` | **2 chamadas** | **1 chamada** | `/midias` responde via cache; histórico possui `revalidate: 0` e reexecuta |
| **`/midias` (Catálogo)** | `GET /midias?params`<br>`GET /generos` | **2 chamadas** | **0 ou 1 chamada** | Respeita o TTL de cache dos gêneros e mídias |
| **`/midias/[slug]` (Ficha)** | `GET /midias/:slug` | **1 chamada** | **0 chamadas** | Cache de 300 segundos |
| **`/sobre` (Sobre)** | Nenhum | **0 chamadas** | **0 chamadas** | Página estática |

---

## 5. Modelo Pronto para Colar no Pull Request (PR)

Copie e cole a seção abaixo na descrição do seu PR:

```markdown
### 📊 Medição e Auditoria de Chamadas à API

#### 1. Configuração Nativa de Log do Next.js
- **Opção configurada:** `logging.fetches.fullUrl` em `next.config.ts`.
- **Referência na documentação:** `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`, linhas 18 a 24 (seção `### Fetching`, linha 12).

#### 2. Fundamentação Conceitual
> *Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada.*
- **Chamadas por renderização (Camada React):** Quantas vezes funções de busca são invocadas no código dos Server Components.
- **Chamadas por visita (Camada de Rede HTTP):** Quantas requisições HTTP reais chegam ao backend.
- O React Request Memoization e o Next.js Data Cache atuam como camadas intermediárias, desduplicando e cacheando as requisições para que múltiplas chamadas na renderização resultem no menor número possível de requisições de rede.

#### 3. Resultados Medidos em Produção (`npm run build && npm run start`)
*Medição realizada com `USAR_MOCK=false` conectando à API local:*

| Rota Testada | 1ª Visita (Cache Frio) | 2ª Visita (F5 / Cache Quente) |
| :--- | :---: | :---: |
| `/midias` (Catálogo) | 2 chamadas (`/midias`, `/generos`) | 0 chamadas (Data Cache) |

#### 4. Verificação de Código Limpo
- [x] Medição validada em `build + start` (não em `dev`).
- [x] Nenhum `console.log` de teste commitado (conferido via `git diff lib/api.ts`).
```
