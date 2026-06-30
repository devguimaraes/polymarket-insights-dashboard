# Polymarket Insights

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Dashboard de estudo para exploração de mercados de previsão, consumindo a API pública da [Polymarket](https://polymarket.com) (Gamma + CLOB). Projeto solo, somente leitura, sem autenticação.

## Funcionalidades (V1)

- **Trending markets** — lista de mercados em alta, ordenados por volume 24h, com paginação
- **Filtro por categoria** — filtragem por tags (Política, Cripto, Esportes, etc.)
- **Busca textual** — pesquisa de mercados e eventos com preview de resultados
- **Detalhe do mercado** — pergunta, outcomes, preço atual, volume, liquidez, gráfico de probabilidade histórico e order book

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime / Package manager | [Bun](https://bun.com) |
| Framework | [Next.js 16.2](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (Base UI) |
| Monorepo | [Turborepo](https://turbo.build) + Bun workspaces |
| Lint / Format | [Biome](https://biomejs.dev) |
| Testes | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| Gráficos | [Recharts](https://recharts.org) |
| Ícones | [Lucide](https://lucide.dev) |
| Linguagem | TypeScript (strict) |

## Pré-requisitos

- [Bun](https://bun.com) >= 1.3

## Instalação

```bash
git clone https://github.com/devguimaraes/polymarket-insights-dashboard.git
cd polymarket-insights-dashboard
bun install
```

## Como executar

```bash
# Servidor de desenvolvimento (Next.js + Turbopack)
bun dev

# Build de produção
bun build
```

O app estará disponível em `http://localhost:3000`.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `bun dev` | Inicia o servidor de desenvolvimento (turbo dev) |
| `bun build` | Build de produção (turbo build) |
| `bun test` | Executa a suíte de testes (turbo test) |
| `bun lint` | Verifica lint em todos os packages (turbo lint) |
| `bun typecheck` | Verifica tipos TypeScript (turbo typecheck) |
| `bun format` | Formata o código com Biome |
| `bun check` | Executa Biome check (lint + format) em todo o repositório |

Para rodar um único teste:

```bash
cd apps/web && bunx vitest run -t "nome do teste"
```

## Estrutura do projeto

```
polymarket-insights/
├── apps/
│   └── web/                          # @polymarket/web — Next.js 16.2 App Router
│       ├── src/app/                  # Rotas (dashboard, api/*)
│       ├── src/components/           # Componentes específicos do app
│       └── src/components/ui/        # Componentes shadcn/ui
├── packages/
│   ├── polymarket-client/            # @polymarket/client — API client + adapters
│   ├── ui/                           # @polymarket/ui — Componentes compartilhados
│   └── tsconfig/                     # Configurações TypeScript base
├── docs/                             # Documentação do projeto
│   ├── 01-prd.md                     # Product Requirements Document
│   ├── 02-architecture.md            # Decisões de arquitetura
│   ├── 03-design-system.md           # Design tokens e sistema visual
│   ├── 04-roadmap.md                 # Planejamento de fases futuras
│   └── 05-api-contract.md            # Contrato da API Polymarket
├── turbo.json                        # Pipeline Turborepo
├── biome.json                        # Configuração Biome
└── package.json                      # Workspace root
```

## Testes

Os testes usam **Vitest** com **Testing Library** para componentes React.

### Filosofia TDD

- **Obrigatório** na camada de adapters (`packages/polymarket-client/src/adapters.ts`) e funções puras de formatação — teste antes da implementação
- **Pós-implementação** em componentes de UI (testa comportamento renderizado, não detalhes internos) e Route Handlers (teste de integração)

```bash
bun test            # toda a suíte via Turborepo
bun test -- --watch  # modo watch
```

## Deploy

O deploy é feito via [Vercel](https://vercel.com), com integração nativa ao Next.js.

<!-- TODO: adicionar link do deploy quando disponível -->

## Documentação

A documentação completa do projeto está na pasta [`docs/`](docs/):

- [PRD](docs/01-prd.md) — visão geral do produto e escopo
- [Arquitetura](docs/02-architecture.md) — stack, estrutura, cache, Git Flow, observabilidade
- [Design System](docs/03-design-system.md) — tokens de cor, tipografia, espaçamento, componentes
- [Roadmap](docs/04-roadmap.md) — fases V2 a V5
- [Contrato de API](docs/05-api-contract.md) — endpoints, parâmetros, regras de adapter

## Licença

MIT
