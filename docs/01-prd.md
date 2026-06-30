# PRD — Polymarket Insights (nome provisório)

## 1. Visão geral

Dashboard de estudo que consome a API pública da Polymarket (Gamma, CLOB) para explorar mercados de previsão: tendências, categorias, busca e detalhe de mercado com gráfico de probabilidade. Projeto solo, sem autenticação de usuário, 100% leitura de dados públicos.

**Por que esse projeto**: aprofundar consumo de API REST + WebSocket em tempo real, prática de design system robusto do zero, disciplina de TDD, estrutura de monorepo profissional e portfólio com um caso de uso de dados financeiros/probabilísticos — diferente do CRUD genérico.

## 2. Objetivo e não-objetivo

**Objetivo**: construir um explorer de mercados de previsão, com boa UX de navegação, dados sempre atualizados, performance de carregamento, e um processo de desenvolvimento (TDD, monorepo, Git Flow) que sirva de prática de engenharia tanto quanto o produto final.

**Não-objetivo nesta fase**:
- Trading (não há autenticação de carteira, não há ordens)
- Contas de usuário, login, preferências persistidas
- Mobile app nativo (responsivo web é suficiente)
- Monetização ou usuários reais (ver seção 9)
- Observabilidade enterprise (OpenTelemetry completo) — ver `02-architecture.md` § Observabilidade para o nível adotado

## 3. Personas (uso próprio como referência)

- **Você-estudante**: quer entender consumo de API REST + WS, Server Components, ISR/Cache Components, TDD, monorepo com Turborepo, e design systems.
- **Você-recrutador-futuro**: ao ver o projeto, quer perceber arquitetura limpa, disciplina de testes, histórico de commits/branches organizado (Git Flow), e boas decisões de produto documentadas.

## 4. Escopo da V1 — Trending Dashboard

Definido e fechado para esta fase:

1. **Lista de mercados em alta** (`/events?order=volume24hr&ascending=false&active=true&closed=false`), em cards, paginada.
2. **Filtro por categoria/tag** (Política, Cripto, Esportes, etc., via `tag_id` da Gamma).
3. **Busca textual** de mercados/eventos (via `/public-search`).
4. **Página de detalhe do mercado**: pergunta, outcomes, preço atual, volume, liquidez, gráfico de probabilidade histórico (`/prices-history`), e order book básico (`/book`).

Fora do escopo da V1 (entra em V2+, ver `04-roadmap.md`): WebSocket em tempo real, whale tracking, comparador multi-plataforma, mapa-múndi.

## 5. Critérios de sucesso da V1

**Produto**:
- Carregamento da lista de trending em menos de 1.5s (com cache).
- Busca retorna resultados relevantes em até 500ms percebidos (debounce + loading state).
- Zero erros de CORS ou rate-limit visíveis ao usuário (proxy + cache resolvem isso).
- Design system aplicado de forma consistente: nenhuma tela usa cor, espaçamento ou tipografia fora do token definido em `03-design-system.md`.
- Lighthouse Performance ≥ 90 em desktop.

**Processo de engenharia** (novo nesta revisão):
- Cobertura de testes ≥ 80% na camada de adapters/lib (`lib/polymarket/*`), que é a parte crítica e mais propensa a quebrar silenciosamente.
- Todo componente de UI com pelo menos um teste de comportamento (não de implementação) via Testing Library.
- Nenhum merge em `develop` ou `main` sem suíte de testes passando (CI obrigatório).
- Fluxo de branches seguindo Git Flow clássico (ver `02-architecture.md` § Workflow Git) do primeiro commit em diante.

## 6. Fluxos principais

**Fluxo 1 — Descoberta**: usuário entra → vê dashboard com mercados em alta → filtra por categoria → clica em um card.

**Fluxo 2 — Busca direta**: usuário digita um termo na busca → vê resultados (mercados + eventos) → clica em um resultado.

**Fluxo 3 — Detalhe**: usuário está na página de um mercado → vê pergunta, probabilidade atual, gráfico histórico, order book → pode voltar ou navegar para mercados relacionados (mesmo evento/tag).

## 7. Dados e fontes (resumo — contrato completo em `05-api-contract.md`)

| Dado | Fonte | Endpoint |
|---|---|---|
| Lista de mercados/eventos | Gamma | `/events` |
| Busca | Gamma | `/public-search` |
| Categorias | Gamma | `/tags/slug/{slug}` |
| Histórico de preço | CLOB | `/prices-history` |
| Order book | CLOB | `/book` |

Todos sem autenticação, sujeitos a rate limit (ver `02-architecture.md` § Rate limits).

## 8. Riscos e mitigação

- **Schema da API pode mudar sem aviso** (não é API oficialmente versionada para uso de terceiros) → normalizar dados em camada própria (adapters), nunca usar tipos da API direto na UI; testes de contrato sobre os adapters detectam quebra cedo.
- **Rate limit em uso intenso durante dev** → cache agressivo local + Route Handler proxy com cache.
- **Dados financeiros reais podem ser mal interpretados** (ex: achar que é recomendação de investimento) → disclaimer textual no rodapé ("dados públicos, fins educacionais, não é recomendação financeira").
- **Complexidade de processo (monorepo + TDD + Git Flow) pode desacelerar demais um projeto solo** → mitigado por escopo da V1 ser deliberadamente pequeno; o processo é investimento para V2+, não deve travar a entrega da V1.

## 9. Sobre escalonamento (visão, não escopo da V1)

Esse PRD cobre a V1. Decisões de arquitetura, porém, já consideram crescimento (ver `04-roadmap.md` para V2/V3): mais fontes de dados (Data API, WebSocket), mais páginas (whale tracker, comparador), e eventual evolução para SaaS real caso o projeto ganhe tração — por isso a stack escolhida (Next.js + Turborepo + Vercel) suporta isso sem reescrita, mesmo a V1 não precisando de nada disso. A estrutura de monorepo em particular já antecipa múltiplos apps/packages (ver `02-architecture.md` § Estrutura do monorepo) sem que a V1 precise usar mais de um app.

## 10. Fora de escopo deste documento

Identidade visual, tokens de design → `03-design-system.md`.
Stack técnica, estrutura de monorepo, TDD, Git Flow, observabilidade → `02-architecture.md`.
Fases futuras detalhadas → `04-roadmap.md`.
Contrato de API validado → `05-api-contract.md`.
