const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export type CoinMarketItem = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number | null;
  ath: number;
};

export type CoinDetails = {
  id: string;
  symbol: string;
  name: string;
  image: {
    large?: string;
    small?: string;
    thumb?: string;
  };
  market_data?: {
    ath?: {
      usd?: number;
    };
    high_24h?: {
      usd?: number;
    };
    low_24h?: {
      usd?: number;
    };
    total_volume?: {
      usd?: number;
    };
    market_cap?: {
      usd?: number;
    };
  };
};

export type MarketChartPoint = {
  time: number;
  price: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${COINGECKO_BASE_URL}${path}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError(
        "Rate limit reached (429). Please wait a moment and retry.",
        429,
      );
    }

    throw new ApiError(`CoinGecko request failed: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export async function getTopCoins(): Promise<CoinMarketItem[]> {
  const query = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "50",
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  return fetchJson<CoinMarketItem[]>(`/coins/markets?${query.toString()}`);
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const query = new URLSearchParams({
    localization: "false",
    tickers: "false",
    market_data: "true",
    community_data: "false",
    developer_data: "false",
    sparkline: "false",
  });

  return fetchJson<CoinDetails>(`/coins/${id}?${query.toString()}`);
}

type CoinMarketChartResponse = {
  prices: [number, number][];
};

export async function getCoinMarketChart(id: string): Promise<MarketChartPoint[]> {
  const query = new URLSearchParams({
    vs_currency: "usd",
    days: "7",
    interval: "hourly",
  });

  const result = await fetchJson<CoinMarketChartResponse>(
    `/coins/${id}/market_chart?${query.toString()}`,
  );

  return result.prices.map(([time, price]) => ({
    time,
    price,
  }));
}
