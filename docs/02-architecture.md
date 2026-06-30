# Arquitetura Técnica — Polymarket Insights

## 1. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Runtime/package manager | Bun | Instalação e execução mais rápidas que Node+npm/pnpm; test runner próprio disponível, mas usamos Vitest sob Bun (ver § Testes) por compatibilidade com o ecossistema React Testing Library |
| Monorepo | Turborepo + Bun workspaces | Cache de build/test incremental, orquestração de tasks entre apps/packages, sem o overhead de configuração do Nx para um projeto desse porte |
| Framework | Next.js 16.2 (App Router, LTS estável em jun/2026) | Server Components reduzem JS no client; Route Handlers como proxy nativo; Turbopack já é o bundler padrão na v16; Cache Components (estável a partir da 16.2) substitui o antigo `revalidate` solto por um modelo explícito de cache |
| Linguagem | TypeScript (strict) | Tipagem nos adapters de API é crítica dado que a Polymarket retorna campos como string-JSON |
| Linter/formatter | Biome | Substitui ESLint + Prettier por uma ferramenta única, mais rápida (Rust), com configuração mínima — alinhado à filosofia de stack enxuta do projeto |
| Estilo | Tailwind CSS | Tokens do design system mapeiam direto pra `tailwind.config` |
| Componentes | shadcn/ui (Radix por baixo) | Componentes acessíveis, copiáveis, fácil de re-skinar com os tokens do projeto |
| Gráficos | Recharts | Curva de aprendizado baixa, suficiente para line chart de probabilidade e depth chart simples |
| Testes | Vitest + Testing Library (executados via Bun) | Vitest tem suporte nativo a ESM e roda bem sob Bun; Testing Library para testes de comportamento de componente, não de implementação |
| Estado servidor | fetch nativo + Cache Components do Next | Sem necessidade de TanStack Query na V1 — Server Components já resolvem a maior parte; reavaliar se WebSocket (V2) pedir estado client mais rico |
| Logs | pino (formato JSON estruturado) | Mínimo necessário para observabilidade sem dependência de serviço pago |
| Error tracking | Sentry (tier gratuito) | Único serviço externo adotado; cobre o que logs locais não cobrem (stack trace em produção, alertas) |
| Deploy | Vercel | Integração nativa com Next.js, edge functions para o proxy se necessário |
| Ícones | lucide-react | Padrão shadcn |

Não incluído na V1, mas preparado para entrar sem reescrita: TanStack Query (quando WebSocket pedir cache client), Zustand (se estado global crescer), Supabase (se precisar persistir watchlists/usuários no futuro), OpenTelemetry (se observabilidade precisar de tracing distribuído — improvável em app solo sem microsserviços).

## 2. Estrutura do monorepo

```
polymarket-insights/
├── apps/
│   └── web/                          # o app Next.js (V1)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── page.tsx                 # trending dashboard (home)
│       │   │   │   ├── markets/[slug]/page.tsx  # detalhe do mercado
│       │   │   │   └── layout.tsx               # sidebar + topbar
│       │   │   ├── api/
│       │   │   │   ├── events/route.ts
│       │   │   │   ├── search/route.ts
│       │   │   │   └── markets/[slug]/prices/route.ts
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── markets/
│       │   │   ├── layout/
│       │   │   └── search/
│       │   └── lib/
│       │       └── utils.ts
│       ├── tests/                    # testes de integração/e2e do app
│       ├── package.json
│       └── next.config.ts
├── packages/
│   ├── polymarket-client/            # client + adapters da API Polymarket (isolado, testável sozinho)
│   │   ├── src/
│   │   │   ├── gamma-client.ts
│   │   │   ├── clob-client.ts
│   │   │   ├── adapters.ts
│   │   │   └── types.ts
│   │   ├── tests/
│   │   └── package.json
│   ├── ui/                           # componentes shadcn compartilháveis + tokens do design system
│   │   ├── src/
│   │   └── package.json
│   ├── eslint-config/ → biome-config/  # configuração compartilhada do Biome entre apps/packages
│   └── tsconfig/                     # tsconfig base compartilhado
├── turbo.json
├── biome.json
├── package.json                      # workspace root
└── bun.lockb
```

**Por que monorepo desde a V1, mesmo com um único app**: o pacote `polymarket-client` isolado é o ganho real — ele pode ser testado, versionado e até publicado separadamente do app web. Se a V2+ trouxer outro app (ex: um worker de WebSocket rodando à parte, ou uma CLI de estudo), o client já está pronto para ser reutilizado sem refactor. O custo de setup do Turborepo é baixo o suficiente para não atrasar a V1.

## 3. Padrão de dados — adapter layer (pacote `polymarket-client`)

```typescript
// packages/polymarket-client/src/types.ts
export type NormalizedMarket = {
  id: string;
  slug: string;
  question: string;
  outcomes: { label: string; price: number; tokenId: string }[];
  volume24h: number;
  liquidity: number;
  endDate: string | null;
  active: boolean;
};

// packages/polymarket-client/src/adapters.ts
export function adaptMarket(raw: GammaMarketRaw): NormalizedMarket {
  const outcomeLabels = JSON.parse(raw.outcomes ?? "[]") as string[];
  const outcomePrices = JSON.parse(raw.outcomePrices ?? "[]") as string[];
  const tokenIds = JSON.parse(raw.clobTokenIds ?? "[]") as string[];

  return {
    id: raw.id,
    slug: raw.slug,
    question: raw.question,
    outcomes: outcomeLabels.map((label, i) => ({
      label,
      price: Number(outcomePrices[i] ?? 0),
      tokenId: tokenIds[i] ?? "",
    })),
    volume24h: raw.volume24hr ?? 0,
    liquidity: Number(raw.liquidityNum ?? 0),
    endDate: raw.endDate,
    active: raw.active ?? false,
  };
}
```

**Regra-chave inalterada**: nenhum componente de UI importa tipos crus da API Polymarket. Tudo passa por `adapters.ts` no pacote `polymarket-client`.

## 4. TDD — como se aplica neste projeto

TDD não é tratado como dogma para 100% do código (ex: não faz sentido escrever teste antes de um componente puramente visual sem lógica), mas é **obrigatório** nas camadas onde a lógica é testável e crítica:

**Onde TDD é obrigatório** (escrever teste antes da implementação):
- `packages/polymarket-client/src/adapters.ts` — toda função de adaptação de payload. É a camada mais sensível a quebra silenciosa (ver `05-api-contract.md` sobre inconsistências de schema da própria API).
- Lógica de filtro/ordenação/paginação que rodar no client ou no Route Handler.
- Funções puras de formatação (preço, volume, data relativa).

**Onde teste vem depois da implementação** (ainda obrigatório, só não TDD estrito):
- Componentes de UI — testa-se comportamento renderizado (Testing Library: "o usuário vê X quando Y"), não a implementação interna.
- Route Handlers — teste de integração simples (status code, shape da resposta), não TDD linha a linha.

**Fluxo de TDD nos adapters** (exemplo prático):
```typescript
// packages/polymarket-client/tests/adapters.test.ts
import { describe, it, expect } from "vitest";
import { adaptMarket } from "../src/adapters";

describe("adaptMarket", () => {
  it("faz parse de outcomes/outcomePrices/clobTokenIds vindos como string JSON", () => {
    const raw = {
      id: "1",
      slug: "test-market",
      question: "Test?",
      outcomes: '["Yes", "No"]',
      outcomePrices: '["0.65", "0.35"]',
      clobTokenIds: '["token-yes", "token-no"]',
      volume24hr: 1000,
      liquidityNum: 500,
      endDate: "2026-12-31T00:00:00Z",
      active: true,
    };

    const result = adaptMarket(raw);

    expect(result.outcomes).toEqual([
      { label: "Yes", price: 0.65, tokenId: "token-yes" },
      { label: "No", price: 0.35, tokenId: "token-no" },
    ]);
  });

  it("lida com campos nulos/ausentes sem quebrar", () => {
    const raw = { id: "1", slug: "test", question: "Test?" } as GammaMarketRaw;
    expect(() => adaptMarket(raw)).not.toThrow();
  });
});
```

Esse teste teria, por exemplo, pego de imediato a inconsistência documentada em `05-api-contract.md` (liquidity como string em `Market` vs number em `Event`) — é exatamente esse tipo de regressão que a suíte protege.

## 5. Estratégia de cache (Next.js 16 — Cache Components)

A partir do Next 16, o modelo de cache mudou de `fetch(..., { next: { revalidate } })` solto para um modelo mais explícito via Cache Components. Para a V1, usamos a abordagem estável documentada pela Vercel:

```typescript
// apps/web/src/app/api/events/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const r = await fetch(
    `https://gamma-api.polymarket.com/events?${searchParams.toString()}`,
    { next: { revalidate: 30 } } // ainda suportado em rotas de API; usar Cache Components em Server Components de página
  );
  if (!r.ok) return Response.json({ error: "upstream" }, { status: 502 });
  return Response.json(await r.json());
}
```

Em páginas/Server Components, preferir `"use cache"` (diretiva estável do Cache Components) em vez de depender só de `revalidate` do fetch — validar contra a documentação oficial do Next 16 no momento da implementação, já que esse modelo pode evoluir entre 16.2 e versões futuras.

**TTLs por tipo de dado** (mantido da versão anterior):
- Lista de trending: 30s
- Detalhe de mercado: 30s
- Histórico de preço: 60s
- Tags/categorias: 1h

## 6. Rate limits — como lidar

Sem mudanças na estratégia: cache absorve a maioria das requisições repetidas; backoff exponencial simples em 429 (1s, 2s, 4s, máx 3 tentativas); nunca polling agressivo no client.

## 7. Workflow Git — Git Flow clássico

Branches permanentes:
- `main` — sempre reflete o que está em produção (deploy automático via Vercel).
- `develop` — branch de integração, onde features convergem antes de virar release.

Branches temporárias:
- `feature/<nome>` — uma por funcionalidade (ex: `feature/trending-dashboard`, `feature/search-bar`), nasce de `develop`, volta para `develop` via PR.
- `release/<versão>` — quando `develop` está pronta para uma versão (ex: `release/v1.0`), nasce de `develop`, recebe só ajustes finais/correções, depois faz merge em `main` E em `develop`.
- `hotfix/<nome>` — correção urgente em produção, nasce de `main`, faz merge em `main` E em `develop`.

**Convenção de commit**: Conventional Commits (já usado no seu workflow atual de CLAUDE.md) — `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`.

**Regra de PR**: nenhum merge em `develop` ou `main` sem CI verde (lint Biome + testes Vitest + build Next passando).

## 8. Observabilidade — nível adotado (mínimo razoável)

Decisão consciente de **não** adotar OpenTelemetry completo nesta fase — seria desproporcional para um app solo sem múltiplos serviços para traçar. O nível adotado:

- **Logs estruturados** via `pino` nos Route Handlers — formato JSON, nunca `console.log` solto, para que logs sejam parseáveis se um dia forem agregados em algum serviço.
- **Error tracking** via Sentry (tier gratuito) — captura erros client e server-side do Next automaticamente via `@sentry/nextjs`, com stack trace e contexto de request.
- **Métricas de performance**: Vercel Analytics (incluso no plano usado para deploy) cobre Web Vitals sem setup adicional.

Ponto de entrada documentado para V2+: se o projeto crescer para múltiplos serviços (ex: um worker de WebSocket separado do app web), reavaliar OpenTelemetry nesse momento — não antes.

## 9. Responsividade

Mobile-first com breakpoints padrão Tailwind (`sm`, `md`, `lg`, `xl`). Sidebar colapsa para drawer em mobile (`< md`). Grid de cards: 1 coluna mobile, 2 tablet, 3-4 desktop.

## 10. Acessibilidade (mínimo viável)

- Contraste AA em todos os textos (validar tokens do design system).
- Navegação por teclado funcional (shadcn/Radix já garante isso nos primitivos).
- `alt` em todas as imagens de evento/mercado.

## 11. O que muda em V2+ (preparação, não implementação agora)

- WebSocket: entra como hook client-side isolado (`useLivePrice`), possivelmente vivendo em `packages/polymarket-client` para reuso, sem alterar a camada de adapters.
- Mais fontes (Data API): novo arquivo `data-client.ts` no mesmo pacote, mesmo padrão de adapter, mesma disciplina de TDD.
- Estado mais complexo: avaliar TanStack Query nesse ponto, não antes.
- Observabilidade: reavaliar OpenTelemetry se a arquitetura deixar de ser monolítica.
