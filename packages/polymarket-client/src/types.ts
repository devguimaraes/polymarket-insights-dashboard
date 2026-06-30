// Polymarket Gamma API raw types — como chegam da API
// Campos string-JSON são o padrão da Polymarket; adapters fazem o parse.

export type GammaMarketRaw = {
  id: string;
  slug: string;
  question: string;
  outcomes: string; // JSON.stringified array
  outcomePrices: string; // JSON.stringified array
  clobTokenIds: string; // JSON.stringified array
  volume24hr: number | null;
  liquidityNum: string | null;
  endDate: string | null;
  active: boolean | null;
  // campos adicionais presentes na response mas não usados na V1
  [key: string]: unknown;
};

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
