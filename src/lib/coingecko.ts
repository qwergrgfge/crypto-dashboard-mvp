const API_BASE_URL = "https://api.coinpaprika.com/v1";

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
    ? `/api/coinpaprika?${new URLSearchParams({ path }).toString()}`
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

type CoinPaprikaTicker = {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  quotes?: {
    USD?: {
      price?: number;
      volume_24h?: number;
      market_cap?: number;
      percent_change_24h?: number;
      ath_price?: number;
    };
  };
  ath_price?: number;
};

type CoinPaprikaOhlcv = {
  time_close: string;
  close: number;
  high: number;
  low: number;
};

function coinLogo(symbol: string): string {
  const safeSymbol = symbol.toLowerCase();
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${safeSymbol}.png`;
}

function numberOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

function numberOrUndefined(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

async function getHistoricalOhlcv(id: string, days: number): Promise<CoinPaprikaOhlcv[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  return fetchJson<CoinPaprikaOhlcv[]>(`/coins/${id}/ohlcv/historical?${params.toString()}`);
}

export async function getTopCoins(): Promise<CoinMarketItem[]> {
  const result = await fetchJson<CoinPaprikaTicker[]>("/tickers?quotes=USD");

  return result
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 50)
    .map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coinLogo(coin.symbol),
      current_price: numberOrZero(coin.quotes?.USD?.price),
      market_cap: numberOrZero(coin.quotes?.USD?.market_cap),
      market_cap_rank: coin.rank,
      total_volume: numberOrZero(coin.quotes?.USD?.volume_24h),
      high_24h: 0,
      low_24h: 0,
      price_change_percentage_24h: numberOrUndefined(coin.quotes?.USD?.percent_change_24h) ?? null,
      ath: numberOrZero(coin.quotes?.USD?.ath_price ?? coin.ath_price),
    }));
}

export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const [ticker, ohlcv] = await Promise.all([
    fetchJson<CoinPaprikaTicker>(`/tickers/${id}?quotes=USD`),
    getHistoricalOhlcv(id, 1),
  ]);

  const highs = ohlcv.map((item) => item.high).filter(Number.isFinite);
  const lows = ohlcv.map((item) => item.low).filter(Number.isFinite);
  const high24h = highs.length ? Math.max(...highs) : undefined;
  const low24h = lows.length ? Math.min(...lows) : undefined;

  const logo = coinLogo(ticker.symbol);

  return {
    id: ticker.id,
    symbol: ticker.symbol,
    name: ticker.name,
    image: {
      large: logo,
      small: logo,
      thumb: logo,
    },
    market_data: {
      ath: {
        usd: numberOrUndefined(ticker.quotes?.USD?.ath_price ?? ticker.ath_price),
      },
      high_24h: {
        usd: numberOrUndefined(high24h),
      },
      low_24h: {
        usd: numberOrUndefined(low24h),
      },
      total_volume: {
        usd: numberOrUndefined(ticker.quotes?.USD?.volume_24h),
      },
      market_cap: {
        usd: numberOrUndefined(ticker.quotes?.USD?.market_cap),
      },
    },
  };
}

export async function getCoinMarketChart(id: string): Promise<MarketChartPoint[]> {
  const result = await getHistoricalOhlcv(id, 7);
  return result
    .map((point) => ({
      time: Date.parse(point.time_close),
      price: point.close,
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.price));
}
