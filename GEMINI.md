# Regras do LequePlay — Instruções para o Gemini

## Arquitetura e Next.js 16
- Framework: Next.js 16 com App Router.
- Server Components são o padrão absoluto. Todo componente roda no servidor, a menos que haja necessidade estrita de cliente.
- A diretiva `"use client"` só entra na **folha** (leaf component) e no menor componente possível que precise de estado (`useState`), efeito (`useEffect`), eventos de usuário (`onClick`) ou APIs de navegador (`navigator`, `localStorage`). A página (`page.tsx`) continua Server Component.
- No Next.js 16, `params` e `searchParams` são `Promise` e exigem `await` antes do uso.

## Acesso a Dados
- Componentes NUNCA chamam `fetch` direto. Todo acesso à API ou ao mock passa exclusivamente por `lib/api.ts`.
- Enquanto `USAR_MOCK=true` em `.env.local`, os dados são servidos a partir de `data/midias.json`.

## TypeScript e Qualidade
- Sem `any` e sem `!` para calar o compilador.
- Tipos de rotas devem respeitar a tipagem do Next (`PageProps`).
- Antes de commitar, a esteira exige a aprovação de: `npm run lint`, `npm run typecheck` e `npm run build`.

## Commits e Git
- Branches seguem o formato: `tipo/lp-NNN-descricao-curta` (ex: `fix/lp-106-ordenacao-do-catalogo`).
- Commits no formato Conventional Commits com escopo do card: `tipo(lp-NNN): descrição no imperativo e minúscula`.
- Não adicione trailers de coautoria (`Co-Authored-By:`) nem `Generated with` nas mensagens de commit.