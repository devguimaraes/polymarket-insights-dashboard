# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack e runtime

- **Bun** é o package manager e runtime. Use `bun install`, `bun run <script>`, `bun x <pkg>` (não npm/yarn/pnpm).
- **Turborepo** orquestra tarefas entre workspaces. Use os scripts da raiz (`bun dev`, `bun build`, `bun test`, `bun lint`, `bun typecheck`) — eles delegam ao `turbo`.
- **Next.js 16.2** (App Router, Turbopack) em `apps/web`. Não use Pages Router.
- **Tailwind CSS v4** (via `@tailwindcss/postcss`, sem `tailwind.config.ts`).
- **shadcn/ui** (Base UI, não Radix) — componentes em `apps/web/src/components/ui/`. Adicione novos com `bun x shadcn@latest add <component>`.
- **Biome** para lint + format (substitui ESLint + Prettier). Config em `biome.json`. Rode `bun check` para verificar, `bun format` para formatar.
- **Vitest** para testes. Execute `bun test` na raiz (turbo) ou `bunx vitest` dentro de um package específico.
- **Recharts** para gráficos, **lucide-react** para ícones, **pino** para logs estruturados.

## Comandos essenciais

```bash
bun install          # instalar/atualizar todas as dependências dos workspaces
bun dev              # turbo dev (Next.js + Turbopack em apps/web)
bun build            # turbo build (Next.js production build)
bun test             # turbo test (Vitest em todos os packages)
bun lint             # turbo lint (Biome check em todos os packages)
bun typecheck        # turbo typecheck (tsc --noEmit em todos os packages)
bun check            # biome check . (lint + format check na raiz)
bun format           # biome format --write .
```

Para rodar um único teste: `cd apps/web && bunx vitest run -t "nome do teste"` ou `cd packages/polymarket-client && bunx vitest run -t "nome do teste"`.

Adicionar um componente shadcn: `cd apps/web && bun x shadcn@latest add <component>`.

## Estrutura do monorepo

```
polymarket-insights/
├── apps/web/                    # @polymarket/web — Next.js 16.2 App Router
│   ├── src/app/                 # Rotas: (dashboard)/, api/events, api/search, api/markets/[slug]/prices
│   ├── src/components/          # Componentes específicos do app (markets/, layout/, search/)
│   ├── src/components/ui/       # Componentes shadcn/ui instalados
│   └── src/lib/utils.ts         # cn() utility (clsx + tailwind-merge)
├── packages/
│   ├── polymarket-client/       # @polymarket/client — API client + adapters (Gamma + CLOB)
│   │   ├── src/types.ts         # NormalizedMarket e GammaMarketRaw
│   │   ├── src/adapters.ts      # adaptMarket() e funções de parse — TDD obrigatório aqui
│   │   ├── src/gamma-client.ts  # Chamadas à Gamma API
│   │   ├── src/clob-client.ts   # Chamadas à CLOB API
│   │   └── tests/               # Testes Vitest
│   ├── ui/                      # @polymarket/ui — componentes shadcn compartilháveis + tokens de design
│   └── tsconfig/                # base.json + nextjs.json compartilhados
├── turbo.json                   # Pipeline: build, dev, test, lint, typecheck
├── biome.json                   # Config Biome (tailwindDirectives habilitado para CSS)
└── docs/                        # 01-prd.md, 02-architecture.md, 03-design-system.md, 04-roadmap.md, 05-api-contract.md
```

## Arquitetura — regras fundamentais

### Camada de adapters (crítica)
- **Nenhum componente de UI importa tipos crus da API Polymarket.** Tudo passa por `packages/polymarket-client/src/adapters.ts`.
- `outcomes`, `outcomePrices` e `clobTokenIds` em `Market` são **strings contendo JSON** — sempre `JSON.parse()`.
- Tipos de `liquidity`/`volume` mudam entre `Event` (number) e `Market` (string) — tratar separadamente.
- Não confiar em posição de array para "Yes"/"No" — checar `outcomes[i]` para saber qual índice é qual.

### API — endpoints e regras
- Gamma API (`gamma-api.polymarket.com`): `/events`, `/public-search`, `/tags/slug/{slug}` — sem autenticação.
- CLOB API (`clob.polymarket.com`): `/book`, `/prices-history` — sem autenticação para leitura.
- **Toda chamada à API passa pelo Route Handler do Next.js** (proxy em `apps/web/src/app/api/`), nunca direto do client.
- Cache: trending 30s, detalhe de mercado 30s, histórico de preço 60s, tags 1h.
- Rate limit: backoff exponencial (1s, 2s, 4s, máx 3 tentativas) em 429. Nunca polling agressivo no client.
- **Antes de usar um campo não documentado**, buscar `https://docs.polymarket.com/llms.txt`. O contrato completo está em `docs/05-api-contract.md`.
- Para `/prices-history`, o parâmetro se chama `market` (não `token_id`), apesar de receber o token ID como valor.
- `tag_id` é mais confiável que `tag_slug`. Confirmar IDs via `/tags/slug/{slug}` antes de usar, nunca assumir.

### TDD — onde é obrigatório
- **Toda função em `adapters.ts`** nasce com teste antes da implementação (escrever teste → ver falhar → implementar → ver passar).
- Lógica de filtro/ordenação/paginação.
- Funções puras de formatação (preço, volume, data relativa).
- Testes de adapters validam cenários de borda: campos nulos, strings JSON malformadas, arrays vazios de bids.

### Onde teste vem depois (ainda obrigatório)
- Componentes de UI: testa comportamento renderizado (Testing Library), não implementação interna.
- Route Handlers: teste de integração (status code, shape da resposta).

## Design system — tokens, não valores crus

- Nenhum componente usa cor, espaçamento ou tipografia fora dos tokens definidos em `docs/03-design-system.md`.
- Cores: roxo/violeta (`--accent-*`) para marca/CTAs. Verde/vermelho para Yes/No e variação de preço.
- Números sempre em `font-variant-numeric: tabular-nums` para evitar "dança" de dígitos.
- Loading state: skeleton com `--surface-2` pulsante, nunca spinner genérico.
- Erro de API: mensagem amigável + botão de retry, nunca expor erro técnico cru.

## Git — Git Flow clássico

- `main`: produção (deploy automático via Vercel).
- `develop`: branch de integração (branches de feature nascem daqui e voltam via PR).
- `feature/<nome>`: uma por funcionalidade. `release/<versão>`: preparação de release. `hotfix/<nome>`: correção urgente.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`.
- Nenhum merge em `develop` ou `main` sem CI verde (Biome + Vitest + build Next).
- Sem push direto em `main` sem instrução explícita.

## Observabilidade

- Logs estruturados via `pino` nos Route Handlers (formato JSON, nunca `console.log`).
- Sentry para error tracking (tier gratuito).
- Erros nunca são silenciados — logar e reportar.

## Agent skills

### Issue tracker

Issues são rastreadas no Linear via MCP (`mcp__plugin_linear_linear__*`). Veja `docs/agents/issue-tracker.md`.

### Triage labels

Usa os nomes canônicos padrão: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Veja `docs/agents/triage-labels.md`.

### Domain docs

Multi-contexto — `CONTEXT-MAP.md` na raiz aponta para `CONTEXT.md` por workspace do monorepo. Veja `docs/agents/domain.md`.
