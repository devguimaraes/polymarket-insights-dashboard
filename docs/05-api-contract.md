# Contrato de API — Polymarket (fonte de verdade para implementação)

> **Propósito deste documento**: este é o contrato que qualquer LLM (Claude Code incluso) deve consultar antes de escrever ou alterar código que toque a API da Polymarket. Ele substitui a memória/treinamento do modelo sobre essa API, que pode estar desatualizada. Todo campo aqui foi confirmado em duas fontes: (1) o schema OpenAPI oficial em `docs.polymarket.com`, (2) uma chamada `curl` real executada em 30/06/2026. Onde isso não foi possível, está marcado como **não validado**.
>
> **Regra para o LLM executor**: nunca usar um campo, endpoint ou parâmetro que não esteja neste documento sem antes confirmar contra `https://docs.polymarket.com/llms.txt`. Se um campo precisar ser usado e não estiver aqui, pare e busque a documentação antes de prosseguir.
>
> **Onde isso vive no código**: este contrato é implementado em `packages/polymarket-client` (ver `02-architecture.md` § Estrutura do monorepo). Toda função de `adapters.ts` descrita aqui nasce com teste antes da implementação (TDD obrigatório nessa camada, ver `02-architecture.md` § TDD).

---

## 0. As três APIs (visão geral)

| API | Base URL | Autenticação | Uso na V1 |
|---|---|---|---|
| Gamma | `https://gamma-api.polymarket.com` | Nenhuma (pública) | Sim — descoberta, busca, tags |
| CLOB | `https://clob.polymarket.com` | Nenhuma para leitura | Sim — preço histórico, order book |
| Data API | `https://data-api.polymarket.com` | Nenhuma para leitura | Não usada na V1 (entra na V3, ver roadmap) |

Fonte: `docs.polymarket.com/api-reference/introduction`.

---

## 1. Gamma — `GET /events` (lista de mercados em alta)

**Endpoint**: `https://gamma-api.polymarket.com/events`

**Parâmetros confirmados no OpenAPI oficial** (`gamma-openapi.yaml`):

| Parâmetro | Tipo | Uso na V1 |
|---|---|---|
| `limit` | integer | sim — paginação |
| `offset` | integer | sim — paginação |
| `order` | string | sim — `volume24hr` para trending |
| `ascending` | boolean | sim — `false` para maior volume primeiro |
| `active` | boolean | sim — sempre `true` na home |
| `closed` | boolean | sim — sempre `false` na home |
| `tag_id` | integer | sim — filtro de categoria |
| `tag_slug` | string | existe no schema, mas preferir `tag_id` (ver nota abaixo) |
| `related_tags` | boolean | opcional |
| `liquidity_min`/`liquidity_max` | number | opcional, fase futura |
| `volume_min`/`volume_max` | number | opcional, fase futura |
| `start_date_min/max`, `end_date_min/max` | date-time | opcional |
| `archived`, `featured` | boolean | opcional |

⚠️ **Nota de preferência**: o parâmetro `tag_slug` existe e funciona no schema oficial, mas `tag_id` (integer) é mais confiável porque tags têm múltiplos slugs ao longo do tempo. Sempre preferir `tag_id`.

**Chamada de referência (V1)**:
```
GET https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&ascending=false&limit=20
```

**Resposta real (validada em 30/06/2026, truncada)**:
```json
[
  {
    "id": "30615",
    "ticker": "world-cup-winner",
    "slug": "world-cup-winner",
    "title": "World Cup Winner",
    "description": "This market will resolve according to...",
    "startDate": "2025-07-02T22:26:48.104Z",
    "endDate": "2026-07-20T00:00:00Z",
    "image": "https://polymarket-upload.s3.us-east-2.amazonaws.com/wcwinner-9b065f827e.png",
    "icon": "https://polymarket-upload.s3.us-east-2.amazonaws.com/wcwinner-9b065f827e.png",
    "active": true,
    "closed": false,
    "archived": false,
    "featured": true,
    "liquidity": 223255871.24075,
    "volume": 3495447944.9263263,
    "openInterest": 60930843.057932995,
    "volume24hr": 118933080.35374704,
    "volume1wk": 499346347.5108263,
    "commentCount": 2045,
    "negRisk": true,
    "markets": [
      {
        "id": "558934",
        "question": "Will Spain win the 2026 FIFA World Cup?",
        "conditionId": "0x7976b8dbacf9077eb1453a62bcefd6ab2df199acd28aad276ff0d920d6992892",
        "slug": "will-spain-win-the-2026-fifa-world-cup-963",
        "outcomes": "[\"Yes\", \"No\"]",
        "outcomePrices": "[\"0.1135\", \"0.8865\"]",
        "volume": "71293476.64873321",
        "active": true,
        "closed": false,
        "clobTokenIds": "[\"...\", \"...\"]"
      }
    ]
  }
]
```

**Campos a tratar com atenção** (confirmado por chamada real, não só pela doc):
- `outcomes`, `outcomePrices`, `clobTokenIds` em `Market` são **strings contendo JSON**, não arrays — confirmado na resposta real acima. Sempre `JSON.parse()`. **Este é o primeiro caso de teste a escrever em `adapters.test.ts`.**
- `liquidity`/`volume` em `Event` vêm como `number`. Os mesmos campos dentro de `Market` vêm como `string` (ex: `"liquidity": "7839098.75594"`). **Isso é inconsistente entre Event e Market — tratar os dois tipos separadamente no adapter, e cobrir com teste específico (ver exemplo em `02-architecture.md` § TDD).**
- Um `Event` pode conter múltiplos `Market` (ex: "World Cup Winner" tem um market por seleção).

**Schema completo de `Event` e `Market`**: ver OpenAPI oficial em `https://docs.polymarket.com/api-spec/gamma-openapi.yaml` — campos completos omitidos aqui por brevidade (são ~80 campos por entidade, a maioria irrelevante para a V1). Os campos usados pela V1 estão na tabela da seção 5 (mapa de campos → UI).

---

## 2. Gamma — `GET /public-search` (busca)

**Endpoint**: `https://gamma-api.polymarket.com/public-search`

**Parâmetro obrigatório**: `q` (string).

**Outros parâmetros confirmados**: `limit_per_type`, `page`, `events_status`, `events_tag[]`, `sort`, `ascending`, `search_tags`, `search_profiles`, `keep_closed_markets`, `exclude_tag_id[]`, `optimized`.

**Chamada de referência**:
```
GET https://gamma-api.polymarket.com/public-search?q=bitcoin&limit_per_type=5
```

**Resposta real (validada, truncada)**:
```json
{
  "events": [
    {
      "id": "548274",
      "slug": "what-price-will-bitcoin-hit-in-june-2026",
      "title": "What price will Bitcoin hit in June?",
      "active": true,
      "closed": false,
      "volume24hr": 2108073.3334579994,
      "markets": [
        {
          "id": "2410562",
          "question": "Will Bitcoin reach $90,000 in June?",
          "slug": "will-bitcoin-reach-90k-in-june-2026"
        }
      ]
    }
  ],
  "tags": [],
  "profiles": [],
  "pagination": { "hasMore": true, "totalResults": 0 }
}
```

A resposta segue o schema `Search` oficial: `{ events: Event[], tags: SearchTag[], profiles: Profile[], pagination: Pagination }`. Importante: a busca retorna **eventos completos** (com `markets[]` aninhados), não precisa de uma segunda chamada para detalhar.

---

## 3. Gamma — `GET /tags/slug/{slug}` (categorias)

⚠️ **Achado de validação importante**: `/tags?label=Politics` (filtro por label na query string) **não funciona** — o parâmetro `label` não existe no schema oficial e é silenciosamente ignorado, retornando tags aleatórias. Para obter uma tag específica, usar `/tags/slug/{slug}`.

**Chamada de referência**:
```
GET https://gamma-api.polymarket.com/tags/slug/politics
```

**Resposta real (validada)**:
```json
{
  "id": "2",
  "label": "Politics",
  "slug": "politics",
  "forceShow": false,
  "forceHide": true,
  "createdAt": "2023-10-25T18:55:50.681Z"
}
```

Nota: `forceHide: true` nesse exemplo é um campo de controle editorial da própria Polymarket (não impede a consulta via API, é só uma flag de UI deles). Não tratar como erro.

**Tags confirmadas até agora** (buscar as demais via `/tags/slug/{slug}` antes de usar, nunca assumir um ID):
| Categoria | slug | id confirmado |
|---|---|---|
| Politics | `politics` | `2` |

Demais tags (Crypto, Sports, etc.) **não foram validadas nesta sessão** — antes de usar um `tag_id` no código, rodar `curl https://gamma-api.polymarket.com/tags/slug/{slug}` e confirmar o `id` real. Sugestão de teste: um teste de integração (não TDD puro, roda contra a API real ou um fixture gravado) que falha se um `tag_id` hardcoded no código não bater mais com o slug esperado.

---

## 4. CLOB — `GET /book` (order book)

**Endpoint**: `https://clob.polymarket.com/book`

**Parâmetro obrigatório**: `token_id` (string) — não é o `conditionId` do mercado, é um dos valores dentro do array `clobTokenIds` (depois de `JSON.parse`).

**Chamada de referência**:
```
GET https://clob.polymarket.com/book?token_id=95392237033134859316508517411280839091542508608393424743404750464234370530991
```

**Resposta real (validada, truncada)**:
```json
{
  "market": "0xccc51cccefaae9546754ac4785db8fa14e617573d86da599c0ac8f36850eae9f",
  "asset_id": "95392237033134859316508517411280839091542508608393424743404750464234370530991",
  "timestamp": "1782790252483",
  "hash": "d856c9e7cc1e86a81dd6038416582bf5313856f0",
  "bids": [],
  "asks": [
    { "price": "0.999", "size": "1148206.4" },
    { "price": "0.998", "size": "92500" },
    { "price": "0.997", "size": "13.67" }
  ],
  "min_order_size": "1",
  "tick_size": "0.01",
  "neg_risk": false,
  "last_trade_price": "0.45"
}
```

⚠️ **Ordenação confirmada pelo schema oficial**: `bids` ordenado **descendente por preço**, `asks` ordenado **ascendente por preço** — melhor bid é o primeiro item de `bids`, melhor ask é o primeiro item de `asks`. Mercados de baixa liquidez (como o testado acima) podem ter `bids` vazio — tratar como caso de teste explícito no adapter, não como erro.

Todos os campos de preço/tamanho em `OrderBookSummary` são **strings**, não numbers — sempre `Number()` antes de usar em cálculo.

---

## 5. CLOB — `GET /prices-history` (gráfico histórico)

**Endpoint**: `https://clob.polymarket.com/prices-history`

⚠️ **Atenção ao nome do parâmetro**: o parâmetro obrigatório é `market`, não `token_id` (apesar do valor passado ser, na prática, o mesmo token ID usado em `/book` — confirmado pela chamada real abaixo, que funcionou usando o token ID como valor de `market`). Nomenclatura inconsistente da própria API — documentar isso no código com um comentário, para o próximo desenvolvedor (ou IA) não "corrigir" para `token_id` por engano.

| Parâmetro | Obrigatório | Valores |
|---|---|---|
| `market` | sim | token ID (asset id) |
| `startTs` / `endTs` | não | unix timestamp |
| `interval` | não | `max`, `all`, `1m`, `1w`, `1d`, `6h`, `1h` |
| `fidelity` | não | inteiro, minutos (default 1) |

**Chamada de referência**:
```
GET https://clob.polymarket.com/prices-history?market=95392237033134859316508517411280839091542508608393424743404750464234370530991&interval=1d&fidelity=60
```

**Resposta real (validada)**:
```json
{
  "history": [
    { "t": 1782705604, "p": 0.0005 },
    { "t": 1782709205, "p": 0.0015 },
    { "t": 1782790145, "p": 0.0005 }
  ]
}
```

`t` é unix timestamp (segundos), `p` é o preço (float, já numérico — diferente do `/book`, aqui não vem como string).

---

## 6. Mapa de campos → UI (V1)

Esta tabela conecta os dados crus ao que aparece na tela, para o LLM executor não precisar inferir.

| Elemento de UI | Campo da API | Endpoint | Observação |
|---|---|---|---|
| Card: imagem do mercado | `event.image` ou `event.icon` | `/events` | usar `image`, fallback `icon` |
| Card: pergunta | `market.question` | `/events` (aninhado) | um event pode ter N markets |
| Card: probabilidade "Yes" | `market.outcomePrices[0]` | `/events` (aninhado) | após `JSON.parse`; índice 0 geralmente é "Yes" mas **confirmar via `outcomes[0] === "Yes"`**, não assumir posição |
| Card: volume 24h | `market.volume24hr` ou `event.volume24hr` | `/events` | preferir o do event quando houver múltiplos markets |
| Filtro de categoria (chip) | `tag.label`, `tag.id` | `/tags/slug/{slug}` | resolver id antes de filtrar `/events?tag_id=` |
| Busca | `events[].title`, `events[].markets[]` | `/public-search` | resposta já vem com markets aninhados |
| Detalhe: pergunta completa | `market.question`, `market.description` | `/events/slug/{slug}` (não testado nesta sessão — ver nota abaixo) | |
| Detalhe: gráfico histórico | `history[].t`, `history[].p` | `/prices-history` | `t` é unix seconds, multiplicar por 1000 para `Date` em JS |
| Detalhe: order book | `bids[]`, `asks[]` | `/book` | strings — converter com `Number()` |

**Nota**: o endpoint `/events/slug/{slug}` (para página de detalhe) não foi testado com `curl` nesta sessão por economia de chamadas — está documentado no índice oficial (`api-reference/events/get-event-by-slug`) e segue o mesmo schema `Event` já validado na seção 1. Antes de implementar a página de detalhe, rodar uma chamada real para confirmar — e, seguindo TDD, escrever o teste do adapter correspondente antes da implementação.

---

## 7. Erros e validação

Schema de erro confirmado (CLOB, igual em `/book` e `/prices-history`):
```json
{ "error": "string", "code": "string opcional", "retry_after_seconds": "integer opcional" }
```

Status codes confirmados na doc oficial do `/book`: `400` (token_id inválido), `404` (sem order book pra esse token), `500` (erro interno). Tratar os três no client — `404` não é necessariamente bug, pode ser mercado sem order book ativo. Cada caso de erro vira um teste do client (`gamma-client.test.ts`/`clob-client.test.ts`), validando que o erro é tratado e logado via `pino` (ver `02-architecture.md` § Observabilidade), nunca silenciado.

---

## 8. Regras de ouro para o LLM executor

1. **Nunca inventar um campo.** Se precisar de um dado que não está na seção 6, parar e buscar `https://docs.polymarket.com/llms.txt` antes de prosseguir.
2. **`outcomes`, `outcomePrices`, `clobTokenIds` são sempre strings JSON** dentro de `Market` — `JSON.parse` obrigatório.
3. **Não confiar em posição de array para "Yes"/"No"** — sempre checar `outcomes[i]` para saber qual índice corresponde a qual lado.
4. **`token_id` (usado em `/book` e `/prices-history` como `market`) vem de `clobTokenIds`, não de `conditionId`.** São três identificadores diferentes de um mesmo mercado — não confundir.
5. **Tipos de `liquidity`/`volume` mudam entre `Event` (number) e `Market` (string).** Tratar separadamente no adapter.
6. **Antes de usar um `tag_id` na V1, confirmar via `/tags/slug/{slug}`** — não copiar IDs de fontes terceiras sem validar.
7. **Toda chamada à API passa pelo Route Handler do Next** (ver `02-architecture.md`), nunca direto do client.
8. **Toda função em `adapters.ts` nasce com teste antes da implementação** (TDD obrigatório nessa camada, ver `02-architecture.md` § TDD) — os exemplos de payload real desta seção são a base dos fixtures de teste.
