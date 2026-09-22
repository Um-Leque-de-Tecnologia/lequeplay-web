# Como Medir Chamadas à API por Visita

Este é o procedimento oficial para medir chamadas reais do front-end para a API. O número válido para o PR é medido com `build` + `start`, nunca com `dev`.

---

## Critérios

Conforme definido para o projeto:
1. **Medição feita em `build + start`:** números de `dev` não entram no PR.
2. **Nenhum `console.log` temporário:** se uma instrumentação local for usada, ela deve ser removida antes do commit.
3. **PR:** registrar a unidade, a rota, a visita (fria ou quente), a configuração usada e a fonte da contagem.

---

## 1. O Conceito Fundamental: Chamadas por Visita vs. Chamadas por Renderização

> **Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada.**

Quando alguém diz: *"essa página faz 4 chamadas à API"*, essa frase é ambígua se não definirmos a **camada**:

* **Chamadas por Renderização (Camada de Componentes / React):**
  * Representa quantas vezes funções de busca (`fetch`, `obterMidias`, etc.) são invocadas no código dos componentes durante a renderização da árvore de Server Components.
  * Se o cabeçalho, a grade principal e o rodapé chamarem `obterMidias()`, ocorrerão **3 chamadas na camada de renderização**.

* **Chamadas por Visita (Camada de Rede / HTTP):**
  * Representa quantas requisições HTTP reais saem fisicamente do servidor Next.js em direção ao backend externo para atender à navegação/visita do usuário.

* **A diferença é a camada intermediária:**
  * O **React Request Memoization** desduplica chamadas com mesma URL e opções dentro do mesmo ciclo de renderização. As 3 invocações na camada de componentes colapsam para **apenas 1 requisição de rede**.
  * O **Data Cache do Next.js** (quando aplicável cache de longa duração) intercepta antes da rede: se o dado já estiver em cache, saem **0 requisições de rede** para o backend.
  * Portanto, medir na camada errada gera números fictícios. O número deste documento é da camada de rede, observado no servidor da API.

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

### Referência na documentação do Next 16
* **Opção:** `logging.fetches.fullUrl`.
* **Documentação:** [Logging > Fetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging), seção `### Fetching`, linhas 12–15 da página consultada em 2026-09-22.
* **Trecho da documentação (linhas 12–15):** “You can configure the logging level and whether the full URL is logged to the console when running Next.js in development mode.”
* **Exemplo da documentação:**
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

> **Limite importante:** `logging.fetches` é logging de desenvolvimento. Ele não é a fonte da contagem oficial do PR e não deve ser usado para afirmar um número de produção.

### Onde cada log aparece

| Execução | Onde aparece | O que significa |
| :--- | :--- | :--- |
| `npm run dev` | terminal que executou o comando | O Next imprime os fetches e `HIT`/`MISS`/`SKIP` por causa de `logging.fetches.fullUrl`. |
| `npm run start` | terminal que executou o comando | O Next imprime apenas a inicialização; não imprime cada fetch da aplicação. |
| API externa | terminal ou painel de logs do backend | É aqui que se contam as requisições HTTP reais feitas pelo Next em produção. |

Se `npm run start` retornar `EADDRINUSE` na porta 3000, ele **não iniciou um
novo servidor**. Acesse a janela que já executa o processo da porta 3000 ou
encerre-o e inicie o servidor em uma porta livre. No Git Bash:

```bash
PORT=3001 npm run start
```

No PowerShell:

```powershell
$env:PORT = 3001; npm run start
```

Depois, acesse exatamente `http://localhost:3001/midias` e observe o terminal
que exibiu `Ready` para confirmar que está olhando o processo correto.

---

## 3. Procedimento Repetível de Medição (Build + Start)

Qualquer membro do time pode reproduzir o teste seguindo este roteiro:

### Passo 1: Garantir que o backend está rodando

> **Atenção ao erro de build (`503 Não foi possível alcançar a API`):**
> Se você definir `USAR_MOCK=false`, o Next.js tentará se conectar à API real durante o `npm run build` (ao pré-renderizar rotas como a Home `/`). Se o backend **não** estiver rodando em `http://localhost:8080`, o build falhará com erro de conexão.
> 
> Portanto:
> * **Para rodar a medição real com a API:** Suba primeiro o servidor da API (`lequeplay-api`) na porta 8080 e configure no `.env.local`:
>   ```env
>   API_URL=http://localhost:8080
>   USAR_MOCK=false
>   ```
> * **Se o backend não estiver rodando no momento:** Deixe `USAR_MOCK=true` no `.env.local`. O projeto usará o mock local e o `build` passará com sucesso.

### Passo 2: Executar build e start
```bash
npm run build
npm run start
```

Se a porta `3000` estiver ocupada, use outra sem alterar o build:
```bash
PORT=3001 npm run start
```

### Passo 3: Fazer uma visita controlada
Antes de bater na rota, limpe a tela do terminal onde o servidor está rodando:
* Windows (PowerShell): `cls` ou `Ctrl + L`
* Linux / Mac: `clear` ou `Ctrl + L`

1. Limpe o log de acesso do backend.
2. Em uma janela anônima, acesse a rota, por exemplo `http://localhost:3000/midias`.
3. Conte no log do **backend** apenas as requisições originadas pelo Next durante essa visita.
4. Para a segunda medição, recarregue a mesma rota e registre-a como visita quente.
5. Não conte requisições do navegador para o Next, como `/_next/*`, nem chamadas feitas durante o build.

### Passo 4: Verificar o working tree
Se você adicionou logging temporário, remova-o e confira que **nenhum `console.log` de teste sobrou**:
```bash
git diff --check
git grep -n '\[MEDICAO-API\]\|console\.log' -- ':!node_modules'
```

O segundo comando pode encontrar logs de produção já existentes; remova somente os logs temporários introduzidos para esta medição.

---

## 4. Registro do resultado no PR

| Rota | Unidade | 1ª visita (cache frio) | 2ª visita (cache quente) | Fonte |
| :--- | :--- | :--- | :--- | :--- |
| `/midias` | chamadas HTTP Next -> API por visita | **2 chamadas** (`/midias`, `/generos`) | **0 chamadas** (cache quente) | log de acesso do backend; `revalidate: 3600` |

---

## 5. Modelo para o Pull Request

Copie e cole a seção abaixo na descrição do seu PR:

```markdown
### 📊 Medição e Auditoria de Chamadas à API

#### 1. Configuração Nativa de Log do Next.js
- **Opção configurada:** `logging.fetches.fullUrl` em `next.config.ts`.
- **Referência na documentação:** [Logging > Fetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging), linhas 12–15 da página consultada em 2026-09-22.

#### 2. Fundamentação Conceitual
> *Número sem unidade não é número: chamadas por visita e chamadas por renderização são coisas diferentes, e a diferença é a camada.*
- **Chamadas por renderização (Camada React):** Quantas vezes funções de busca são invocadas no código dos Server Components.
- **Chamadas por visita (Camada de Rede HTTP):** Quantas requisições HTTP reais chegam ao backend.
- O React Request Memoization e o Next.js Data Cache atuam como camadas intermediárias, desduplicando e cacheando as requisições para que múltiplas chamadas na renderização resultem no menor número possível de requisições de rede.

#### 3. Resultados Medidos em Produção (`npm run build && npm run start`)
*Medição realizada com `USAR_MOCK=false`; a contagem é do log de acesso da API:*

| Rota testada | Unidade | 1ª visita (cache frio) | 2ª visita (cache quente) |
| :--- | :---: | :---: |
| `/midias` (Catálogo) | chamadas HTTP Next -> API por visita | **2** (`/midias`, `/generos`) | **0** (cache quente) |

#### 4. Verificação de Código Limpo
- [x] Medição validada em `build + start` (não em `dev`).
- [x] Nenhum `console.log` de teste commitado (conferido com `git grep` e `git diff --check`).
```
