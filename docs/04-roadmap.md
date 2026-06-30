# Roadmap — Polymarket Insights

Visão de evolução do projeto além da V1. Cada fase é independente o suficiente para ser um marco de portfólio por si só.

## V1 — Trending Dashboard (escopo fechado em `01-prd.md`)
Lista + filtro + busca + detalhe de mercado com gráfico histórico. Sem WebSocket, sem conta de usuário. Stack: Bun + Turborepo + Next.js 16 + Tailwind + shadcn/ui, dados via Gamma + CLOB REST, TDD nos adapters, Git Flow desde o primeiro commit.

**Entregável de portfólio**: app funcional, documentado, com design system aplicado de ponta a ponta, suíte de testes cobrindo a camada crítica, e histórico de Git organizado o suficiente para servir de amostra de processo, não só de código.

---

## V2 — Tempo real
Adiciona a camada de WebSocket sobre a base da V1, sem alterar a arquitetura de adapters.

- Hook `useLivePrice` conectando ao canal `market` da CLOB WebSocket — atualiza preço/probabilidade ao vivo na página de detalhe.
- Order book com atualização em tempo real (em vez de snapshot estático da V1).
- Indicador visual de "ao vivo" na topbar.
- Reconexão automática com backoff em caso de queda de conexão.
- Testes: mockar o WebSocket (ex: `vitest-websocket-mock`) para testar lógica de reconexão e parsing de mensagens sem depender de conexão real.

**Aprendizado-chave**: gestão de WebSocket em React (lifecycle, cleanup, reconexão), separação entre estado servidor (Server Components) e estado realtime (client), TDD em código assíncrono/event-driven.

---

## V3 — Whale activity feed
Camada de "inteligência de mercado" usando a Data API.

- Feed de trades grandes (`$1k+`) em tempo real, com filtro por tamanho mínimo e categoria.
- Página de perfil de wallet (endereço, histórico de atividade, win rate aproximado).
- Esse módulo é o mais próximo dos cases reais estudados (Pariflow, WhaleSight) — boa peça de portfólio para mostrar leitura de dados on-chain/Data API.
- Ponto de reavaliação de observabilidade: se o volume de eventos crescer, considerar métricas mais ricas (ainda sem necessariamente ir para OpenTelemetry completo).

**Aprendizado-chave**: streams de eventos de alto volume, paginação infinita, performance de listas longas (virtualização).

---

## V4 — Comparador multi-plataforma
Diferencial mais forte identificado na pesquisa (poucos projetos fazem isso bem).

- Busca a mesma pergunta/tema em Polymarket + Metaculus + Manifold (APIs públicas de cada uma).
- Visualização lado a lado das probabilidades implícitas de cada plataforma.
- Página de "calibração": para mercados já resolvidos, mostra se a probabilidade da Polymarket bateu com o resultado real (reliability diagram).
- Novo pacote no monorepo (`packages/forecasting-client` ou similar) seguindo o mesmo padrão de adapter + TDD do `polymarket-client`.

**Aprendizado-chave**: integração de múltiplas APIs heterogêneas, normalização de dados de fontes diferentes em um modelo único, visualização estatística (calibration curve).

---

## V5 (exploratória) — Mapa-múndi de eventos
Inspirado no PolyWorld. Fase mais complexa, avaliar se vale o esforço vs. retorno de portfólio.

- Mercados geopolíticos plotados em mapa (Leaflet ou MapLibre GL).
- Requer geocoding de eventos (manual ou via heurística de tags/título).

**Decisão de avaliar depois**: essa fase tem alto custo de geocoding manual; só entrar nela se as fases anteriores já estiverem sólidas e documentadas.

---

## Princípios de escalonamento (válidos em toda fase)

1. **Nunca quebrar a camada de adapters** — toda nova fonte de dado (Data API, Metaculus, Manifold) ganha seu próprio client + adapter, seguindo o padrão de `02-architecture.md`, como um novo `package` no monorepo quando fizer sentido.
2. **Design system não se modifica por fase** — se uma fase nova "pedir" uma cor ou padrão visual não previsto, isso é sinal para atualizar `03-design-system.md` primeiro, depois implementar. Não inventar estilo direto no componente.
3. **TDD continua obrigatório nas camadas críticas** — toda nova lógica de adaptação/normalização de dados nasce com teste, independente da fase.
4. **Git Flow se mantém** — `feature/` para cada entrega de fase, `release/` quando a fase estiver pronta para ir ao ar.
5. **Cada fase é um marco fechado** — antes de começar a próxima, a fase atual deve estar funcional, testada, sem dívida técnica óbvia pendente.
6. **Reavaliar stack a cada fase**, não preventivamente — por exemplo, só adicionar TanStack Query quando o estado client da V2 (WebSocket) realmente pedir; só considerar backend próprio/Supabase se V3+ precisar persistir algo (watchlists, por exemplo); só considerar OpenTelemetry se a arquitetura deixar de ser um monolito único.
