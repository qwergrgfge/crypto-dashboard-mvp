const API_BASE_URL = "https://api.coincap.io/v2";

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
  const requestUrl = import.meta.env.PROD
    ? `/api/coincap?${new URLSearchParams({ path }).toString()}`
    : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(requestUrl);
  } catch {
    throw new ApiError(
      "Network error while loading crypto data. Please retry in a moment.",
      0,
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError(
        "Rate limit reached (429). Please wait a moment and retry.",
        429,
      );
    }

    throw new ApiError(`Crypto API request failed: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

type CoinCapAsset = {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  priceUsd: string;
  marketCapUsd: string;
  volumeUsd24Hr?: string;
  changePercent24Hr?: string;
};

type CoinCapAssetsResponse = {
  data: CoinCapAsset[];
};

type CoinCapAssetResponse = {
  data: CoinCapAsset;
};

type CoinCapHistoryResponse = {
  data: Array<{
    priceUsd: string;
    time: number;
  }>;
};

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coinIcon(symbol: string): string {
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

async function fetchHistory(id: string, days: number): Promise<CoinCapHistoryResponse> {
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  const interval = days <= 1 ? "m15" : "h2";
  return fetchJson<CoinCapHistoryResponse>(
    `/assets/${id}/history?interval=${interval}&start=${start}&end=${end}`,
  );
}

export async function getTopCoins(): Promise<CoinMarketItem[]> {
  const result = await fetchJson<CoinCapAssetsResponse>("/assets?limit=50");
  return result.data.map((coin) => {
    const currentPrice = toNumber(coin.priceUsd) ?? 0;
    const marketCap = toNumber(coin.marketCapUsd) ?? 0;
    const volume24h = toNumber(coin.volumeUsd24Hr) ?? 0;
    const change24h = toNumber(coin.changePercent24Hr);

    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coinIcon(coin.symbol),
      current_price: currentPrice,
      market_cap: marketCap,
      market_cap_rank: Number(coin.rank) || 0,
      total_volume: volume24h,
      high_24h: 0,
      low_24h: 0,
      price_change_percentage_24h: change24h,
      ath: 0,
    };
  });
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const [assetResult, dayHistory] = await Promise.all([
    fetchJson<CoinCapAssetResponse>(`/assets/${id}`),
    fetchHistory(id, 1),
  ]);

  const prices = dayHistory.data
    .map((point) => Number(point.priceUsd))
    .filter((value) => Number.isFinite(value));

  const high24h = prices.length > 0 ? Math.max(...prices) : undefined;
  const low24h = prices.length > 0 ? Math.min(...prices) : undefined;
  const marketCap = toNumber(assetResult.data.marketCapUsd) ?? undefined;
  const volume = toNumber(assetResult.data.volumeUsd24Hr) ?? undefined;

  return {
    id: assetResult.data.id,
    symbol: assetResult.data.symbol,
    name: assetResult.data.name,
    image: {
      large: coinIcon(assetResult.data.symbol),
      small: coinIcon(assetResult.data.symbol),
      thumb: coinIcon(assetResult.data.symbol),
    },
    market_data: {
      ath: {
        usd: undefined,
      },
      high_24h: {
        usd: high24h,
      },
      low_24h: {
        usd: low24h,
      },
      total_volume: {
        usd: volume,
      },
      market_cap: {
        usd: marketCap,
      },
    },
  };
}

export async function getCoinMarketChart(id: string): Promise<MarketChartPoint[]> {
  const result = await fetchHistory(id, 7);
  return result.data
    .map((point) => ({
      time: point.time,
      price: Number(point.priceUsd),
    }))
    .filter((point) => Number.isFinite(point.price));
}
