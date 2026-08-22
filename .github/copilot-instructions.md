# Convenções do LequePlay

Instruções para o GitHub Copilot neste repositório. Elas são versionadas de
propósito: fazem parte do código, e mudam por Pull Request como qualquer
outra coisa.

## O que é este projeto

Front-end em Next.js (App Router) de um catálogo de filmes, séries e
podcasts. **Ele não é dono dos dados** — consome uma API externa. Não sugira
Prisma, Drizzle, ORM ou acesso direto a banco.

## Stack

- Next.js 16 com App Router e Turbopack
- React 19, TypeScript, Tailwind CSS v4
- Sem biblioteca de estado global; sem biblioteca de componentes

## Regras que valem em toda sugestão

**Server Component é o padrão.** Só use `"use client"` quando houver estado,
efeito, evento de usuário ou API de navegador. Se sugerir `"use client"`,
diga na mesma resposta por que ele é necessário.

**`params` e `searchParams` são Promise** no Next 16. Sempre `await`. Use os
tipos gerados `PageProps<"/rota">` e `LayoutProps<"/rota">` em vez de
escrever o tipo à mão.

**Componente não chama `fetch` direto.** Todo acesso à API passa por
`lib/api.ts`. Se faltar uma função lá, crie-a lá — não contorne.

**`fetch` não rejeita em 404.** Toda chamada nova precisa checar
`resposta.ok` antes de ler o corpo.

**Nada de `any`.** Se o tipo não estiver claro, use `unknown` e estreite com
uma checagem. Nada de `!` para calar o compilador — trate o caso.

**Imutabilidade.** `map`, `filter`, `toSorted`, spread. Nunca `push`, `sort`
ou `splice` sobre dado que veio da API.

**`??` e não `||`** para valor padrão. Nota `0` e string vazia são valores
válidos, e `||` os descartaria.

## Acessibilidade não é opcional

- HTML semântico: `<article>`, `<nav aria-label>`, `<time datetime>`, um `<h1>` por página
- Toda imagem com `alt` — vazio se for decorativa, nunca ausente
- Todo campo de formulário com `<label>` ligada; placeholder não é label
- Nunca remova o foco visível

## Estilo

Tailwind em classes utilitárias no JSX. Sem CSS-in-JS, sem arquivo `.css`
novo — `app/globals.css` já tem os tokens.

## Nomes

Arquivos em `kebab-case`. Componentes em `PascalCase`. Código e comentários
em **português**, seguindo o que já existe no repositório.

## Antes de propor uma API do Next

Este repositório usa Next 16, que mudou bastante em relação ao que a maioria
dos modelos viu no treino. Confira em `node_modules/next/dist/docs/` antes de
sugerir uma API — o `AGENTS.md` na raiz explica isso.
