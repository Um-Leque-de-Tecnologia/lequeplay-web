# Como Medir Chamadas à API por Visita

Este documento descreve o procedimento oficial e repetível para auditar a quantidade de chamadas HTTP reais que o front-end dispara à API por visita.

O número oficial do projeto é medido exclusivamente com **`build` + `start`**, nunca com `dev`.

---

## Critérios Obrigatórios

1. **Medição feita em `build + start`:** números medidos em `dev` não entram no PR. Em desenvolvimento, o React roda em `StrictMode` (duplicando montagens) e o Fast Refresh (HMR) revalida rotas, inflando a contagem.
2. **Nenhum `console.log` temporário no commit:** qualquer instrumentação de teste deve ser removida antes de commitar.
3. **Contagem pelo contador (`scripts/contador-api.mjs`):** a fonte repetível da contagem é o contador da aula 04, que intercepta o tráfego HTTP entre o Next e a API.

---

## 1. O Conceito Fundamental: Chamadas por Visita vs. Chamadas por Renderização

> **"Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada."**

Quando alguém diz: *"essa página faz 4 chamadas à API"*, a frase é ambígua sem especificar a **camada**:

* **Chamadas por Renderização (Camada de Componentes / React):**
  * Representa quantas vezes funções de busca (`fetch`, `listarMidias`, etc.) são invocadas no código durante a renderização da árvore de Server Components.
  * Se o cabeçalho, a grade principal e o rodapé chamarem `listarMidias()`, ocorrem **3 chamadas na camada de renderização**.

* **Chamadas por Visita (Camada de Rede / HTTP):**
  * Representa quantas requisições HTTP reais saem fisicamente do servidor Next.js em direção à API externa para atender à navegação/visita da pessoa.

* **A diferença é a camada intermediária:**
  * O **React Request Memoization** desduplica chamadas com a mesma URL e opções no mesmo ciclo de renderização. As 3 invocações na camada de componentes colapsam para **apenas 1 requisição de rede**.
  * O **Data Cache do Next.js** (quando aplicável cache de longa duração) intercepta antes da rede: se o dado já estiver em cache, saem **0 requisições de rede** para o backend.
  * Portanto, medir na camada errada (ou em `dev`) gera números fictícios. O número válido é o da camada de rede, observado no contador entre o front e a API.

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

### Onde está na documentação interna da versão instalada
* **Arquivo:** [`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`](../node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md)
* **Seção:** `### Fetching` (linhas 12 a 15)
* **Exemplo de código:** **Linhas 18 a 24**:
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
  * `HIT`: o dado veio direto do Data Cache do Next.js (nenhuma chamada de rede feita).
  * `MISS`: o dado não estava no cache e foi buscado na API externa (chamada de rede efetuada e gravada no cache).
  * `SKIP`: a requisição ignorou o cache deliberadamente (ex: `cache: 'no-store'` ou `revalidate: 0`).

> **Limite importante:** a opção `logging.fetches` é projetada pelo Next.js exclusivamente para o modo de desenvolvimento. Em `build + start`, o Next.js desativa esses logs para preservar a performance. Por isso, a contagem de produção é feita pelo contador intermediário.

### Onde cada log aparece

| Execução | Onde aparece | O que significa |
| :--- | :--- | :--- |
| `npm run dev` | Terminal do Next | O Next imprime os fetches e `HIT`/`MISS`/`SKIP` por causa de `logging.fetches.fullUrl`. |
| `npm run start` | Terminal do Next | O Next imprime apenas a inicialização do servidor; não emite cada fetch da aplicação. |
| Contador (`contador-api.mjs`) | Terminal do contador | É aqui que se contam as requisições HTTP reais feitas pelo Next em `build + start`. |

---

## 3. Procedimento Repetível de Medição (Build + Start)

Qualquer membro do time reproduz o teste seguindo este roteiro:

### Passo 1: Iniciar o contador de API (Terminal 1)
O contador publicado no card da aula 04 (`scripts/contador-api.mjs`) fica entre o front e a API, escutando em `http://localhost:4000/v1` e registrando com precisão cada requisição HTTP recebida:

```bash
# Terminal 1
node scripts/contador-api.mjs
# ou, se precisar de autenticação simulada para testes locais:
AUTH=simulada node scripts/contador-api.mjs
```

### Passo 2: Configurar o `.env.local`
Aponte o front para o contador:

```env
USAR_MOCK=false
API_URL=http://localhost:4000/v1
```

### Passo 3: Executar build e start (Terminal 2)
Em outro terminal:

```bash
# Terminal 2
npm run build
npm run start
```

Se a porta `3000` estiver ocupada, suba em outra sem refazer o build:
* Linux / Mac / Git Bash: `PORT=3001 npm run start`
* Windows (PowerShell): `$env:PORT = 3001; npm run start`

### Passo 4: Fazer uma visita controlada
1. No **Terminal 1 (contador)**, observe o contador zerado ou anote o total antes da navegação.
2. Em janela anônima do navegador, acesse a rota (ex: `http://localhost:3000/midias`).
3. Conte no **contador** as requisições HTTP registradas durante a primeira visita (cache frio).
4. Recarregue a mesma rota (`F5`) para registrar a visita quente (cache quente).
5. Desconsidere requisições do navegador para o Next (como `/_next/*`) e chamadas geradas durante o build.

### Passo 5: Conferir o working tree
Certifique-se de que nenhum `console.log` ou arquivo indesejado permaneceu:
```bash
git diff --check
```

---

## 4. Tabela de Referência Oficial do Projeto

A tabela consolidada com as chamadas de produção medidas e auditadas no projeto está centralizada em:

👉 **[`docs/cache-tags.md`](cache-tags.md#medido-lp-307) (seção *Medido (LP-307)*)**

Na arquitetura atual da `main` (após os avanços do LP-303 e LP-307):
* **`/midias` (1ª visita):** **1 chamada** (o catálogo já é parcialmente aquecido pelo build).
* **`/midias` (2ª visita):** **0 chamadas** (servido integralmente pelo Data Cache).
* **Ficha de filme (1ª visita):** **1 chamada**.
* **Ficha de filme (2ª visita):** **0 chamadas**.

> **Nota sobre números históricos:** a medição pontual realizada nesta branch em 22/09 (antes da pré-geração das temporadas no LP-303 e com o histórico ainda lido no servidor) apontava 2 chamadas na 1ª visita a `/midias`. Como o repositório mantém uma única fonte da verdade, medições pontuais e contextuais de tickets devem constar na descrição do Pull Request correspondente.
