# Domain Docs

Como os engineering skills devem consumir a documentação de domínio deste repositório ao explorar o código.

## Antes de explorar, leia estes

- **`CONTEXT-MAP.md`** na raiz do repo — ele aponta para um `CONTEXT.md` por contexto. Leia cada um relevante ao tópico.
- **`docs/adr/`** na raiz — decisões de arquitetura que afetam o sistema todo.
- **`<context>/docs/adr/`** — decisões específicas de cada contexto (ex.: `apps/web/docs/adr/`, `packages/polymarket-client/docs/adr/`).

Se algum desses arquivos não existir, **siga em frente silenciosamente**. Não sinalize a ausência nem sugira criá-los. O skill `/domain-modeling` (acessível via `/grill-with-docs` e `/improve-codebase-architecture`) os cria sob demanda quando termos ou decisões são resolvidos.

## Estrutura de arquivos — multi-contexto

Este é um monorepo com múltiplos contextos. A presença de `CONTEXT-MAP.md` na raiz é o sinal. Cada workspace/package que tem seu próprio domínio mantém seu próprio `CONTEXT.md` e `docs/adr/`.

```
/
├── CONTEXT-MAP.md                     ← aponta para cada contexto
├── docs/adr/                          ← decisões cross-cutting (infra, CI, monorepo)
├── apps/web/
│   ├── CONTEXT.md                     ← domínio da aplicação web (UI, dashboards, busca)
│   └── docs/adr/                      ← decisões do frontend
├── packages/polymarket-client/
│   ├── CONTEXT.md                     ← domínio do client de API (Gamma, CLOB, adapters)
│   └── docs/adr/                      ← decisões do client
└── packages/ui/
    ├── CONTEXT.md                     ← domínio do design system (tokens, componentes)
    └── docs/adr/                      ← decisões do design system
```

## Use o vocabulário do glossário

Quando seu output nomear um conceito do domínio (em título de issue, proposta de refactor, hipótese, nome de teste), use o termo como definido no `CONTEXT.md` relevante. Não desvie para sinônimos que o glossário evita explicitamente.

Se o conceito que você precisa não está no glossário ainda, isso é um sinal — ou você está inventando linguagem que o projeto não usa (reconsidere) ou há uma lacuna real (anote para `/domain-modeling`).

## Sinalize conflitos com ADRs

Se seu output contradisser um ADR existente, deixe explícito em vez de sobrescrever silenciosamente:

> _Contradiz ADR-0007 (event-sourced orders) — mas vale reabrir porque…_
