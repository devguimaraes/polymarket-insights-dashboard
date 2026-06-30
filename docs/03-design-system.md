# Design System — Polymarket Insights

Inspirado em layout de admin dashboard (sidebar + topbar + cards + tabelas), adaptado para o contexto de prediction markets. Tema light, accent roxo/violeta.

> **Onde isso vive no código**: tokens e componentes compartilháveis residem em `packages/ui` no monorepo (ver `02-architecture.md` § Estrutura do monorepo), consumidos pelo app `apps/web`. Isso garante que, se um segundo app entrar no monorepo no futuro (V2+), ele herde o mesmo design system sem duplicação.

## 1. Princípios

- **Dados em primeiro lugar**: a UI nunca compete visualmente com o número/probabilidade. Hierarquia tipográfica clara entre dado principal e metadado.
- **Densidade controlada**: dashboard financeiro pede mais informação por tela do que um app consumer comum, mas sem virar planilha — espaçamento generoso o suficiente para escanear rápido.
- **Consistência antes de originalidade**: tokens aplicados sem exceção. Nenhuma cor ou espaçamento "avulso" direto em componente.

## 2. Paleta de cores

### Accent (marca)
Roxo/violeta como cor de destaque — usado em CTAs primários, links ativos, item de navegação selecionado, e na barra/indicador de probabilidade "Yes".

| Token | Hex aproximado | Uso |
|---|---|---|
| `--accent-50` | `#F5F3FF` | fundo sutil (hover de linha, badge leve) |
| `--accent-100` | `#EDE9FE` | fundo de badge/chip |
| `--accent-400` | `#A78BFA` | ícones secundários, bordas ativas |
| `--accent-600` | `#7C3AED` | accent principal — botões, links, foco |
| `--accent-700` | `#6D28D9` | hover de accent-600 |
| `--accent-900` | `#4C1D95` | texto sobre fundo accent-50/100 |

### Semântico (probabilidade e dados financeiros)

| Token | Cor | Uso |
|---|---|---|
| `--success-600` | verde (`#16A34A`) | outcome "Yes" em alta, variação positiva |
| `--danger-600` | vermelho (`#DC2626`) | outcome "No", variação negativa |
| `--warning-600` | âmbar (`#D97706`) | liquidez baixa, alertas de dados desatualizados |

Atenção: o roxo é a cor de marca, não de probabilidade. Verde/vermelho continuam sendo usados para "Yes/No" e variação de preço porque é convenção universal de mercado financeiro — misturar com o roxo da marca geraria confusão.

### Neutros (base do dashboard)

| Token | Uso |
|---|---|
| `--surface-0` | fundo da página (cinza muito claro, `#FAFAFA`) |
| `--surface-1` | fundo de card (`#FFFFFF`) |
| `--surface-2` | fundo de sidebar/topbar (`#FFFFFF` ou `#F8F7FC` levemente tingido de roxo) |
| `--border` | `#E4E4E7` — bordas hairline |
| `--text-primary` | `#18181B` |
| `--text-secondary` | `#71717A` |
| `--text-muted` | `#A1A1AA` |

## 3. Tipografia

| Elemento | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 28px | 600 | Título de página (raro, ex: "Mercados em alta") |
| H2 | 20px | 600 | Título de seção/card grande |
| H3 | 16px | 500 | Título de card individual |
| Body | 14px | 400 | Texto padrão |
| Caption | 12px | 400 | Metadados, labels de campo |
| Número de destaque | 24-32px | 600 | Preço/probabilidade em página de detalhe |

Fonte: Inter (ou system-ui como fallback) — padrão de dashboards modernos, boa legibilidade em números.

**Números sempre em fonte tabular** (`font-variant-numeric: tabular-nums`) em qualquer lugar que mostre preço/percentual, para evitar "dança" de dígitos ao atualizar.

## 4. Espaçamento

Escala baseada em 4px: `4, 8, 12, 16, 24, 32, 48, 64`. Mapeado para Tailwind padrão (`p-1` a `p-16`). Cards usam padding interno de `16-24px` (`p-4`/`p-6`). Gap entre cards no grid: `16px` (`gap-4`).

## 5. Layout — adaptado do kit de referência

Do kit de admin dashboard, mantemos:
- **Sidebar fixa à esquerda** (collapsible em mobile → drawer): navegação entre "Trending", "Categorias", "Mercado" (busca rápida fica na topbar, não na sidebar).
- **Topbar**: busca global + indicador de "ao vivo"/última atualização.
- **Grid de cards de métrica** no topo do dashboard (ex: volume total 24h, mercados ativos, maior variação do dia) — adaptado do padrão de "KPI cards" do kit.
- **Tabela/lista de itens** abaixo dos cards — no kit é "contacts/deals", aqui vira lista de mercados.

Do kit, descartamos (não fazem sentido no contexto):
- Módulos de CRM (contatos, negócios, pipeline de vendas).
- Qualquer tela de "team members"/permissões — não há usuários no projeto.
- Notificações de sistema tipo "novo lead" — substituído por "novo mercado" ou "mercado fechando em breve", se entrar em fase futura.

### Estrutura da página de Trending (V1)
```
┌─────────────────────────────────────────┐
│ Topbar: busca global · última atualização│
├────────┬────────────────────────────────┤
│        │ KPI cards (4): volume 24h total,│
│Sidebar │ mercados ativos, maior alta,    │
│        │ maior queda                     │
│        ├────────────────────────────────┤
│        │ Filtro de categoria (chips)     │
│        ├────────────────────────────────┤
│        │ Grid de market cards (3-4 col)  │
└────────┴────────────────────────────────┘
```

### Estrutura da página de Detalhe do Mercado (V1)
```
┌─────────────────────────────────────────┐
│ Breadcrumb: Trending > Categoria > Nome  │
├────────────────────┬─────────────────────┤
│ Pergunta + outcomes │ Card lateral:       │
│ + preço atual       │ volume, liquidez,   │
│                     │ data de resolução   │
├────────────────────┴─────────────────────┤
│ Gráfico de probabilidade histórico        │
├────────────────────────────────────────────┤
│ Order book (bids/asks) — versão simples   │
└────────────────────────────────────────────┘
```

## 6. Componentes-chave (shadcn como base, vivendo em `packages/ui`)

| Componente | Base shadcn | Customização |
|---|---|---|
| `MarketCard` | `Card` | Header com imagem do evento, body com pergunta + barra de probabilidade, footer com volume/liquidez |
| `ProbabilityBar` | custom (não é shadcn) | Barra horizontal verde/vermelho proporcional ao preço "Yes"/"No" |
| `CategoryChip` | `Badge` | Estado ativo usa `--accent-600`, inativo usa neutro |
| `SearchBar` | `Input` + `Command` (cmdk) | Dropdown de resultados com preview de mercado |
| `KpiCard` | `Card` | Número grande + label + ícone, sem border, fundo `--surface-1` |
| `ProbabilityChart` | Recharts `LineChart` | Linha única (ou duas, Yes/No), accent-600 para linha principal |

## 7. Estados e feedback

- **Loading**: skeleton com `--surface-2` pulsante, nunca spinner genérico isolado em tela cheia.
- **Vazio** (busca sem resultado, categoria sem mercados): ilustração simples + texto direto, sem jargão.
- **Erro de API**: mensagem amigável + botão de retry, nunca expor erro técnico cru ao usuário.
- **Dado desatualizado** (se cache expirou e fetch falhou): badge sutil "atualizado há Xs" em `--warning-600` quando passar de um threshold (ex: 2 minutos).

## 8. Testes de componentes de UI

Cada componente listado na seção 6 ganha pelo menos um teste de comportamento (Testing Library, ver `02-architecture.md` § TDD), por exemplo:
- `MarketCard`: "exibe a pergunta e a probabilidade formatada como percentual".
- `ProbabilityBar`: "a largura da barra Yes reflete o preço passado via props".
- `SearchBar`: "ao digitar, dispara a busca após debounce".

Esses testes validam comportamento visível ao usuário, não detalhes de implementação (não testamos classes CSS específicas, testamos o que aparece na tela).

## 9. O que falta decidir (revisar ao iniciar a implementação)

- Ícone/logo do projeto (ainda não definido — pode ficar para depois do MVP funcional).
- Dark mode: fora do escopo da V1 (light only), mas tokens já nomeados de forma que dê para adicionar `--surface-0-dark` etc. depois sem refatorar.
