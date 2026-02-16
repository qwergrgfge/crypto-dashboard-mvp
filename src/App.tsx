import { useEffect, useMemo, useState } from "react";
import { CoinDetail } from "./components/CoinDetail";
import { CoinTable } from "./components/CoinTable";
import { Controls, type SortDir, type SortKey } from "./components/Controls";
import {
  ApiError,
  getCoinDetails,
  getCoinMarketChart,
  getTopCoins,
  type CoinDetails,
  type CoinMarketItem,
  type MarketChartPoint,
} from "./lib/coingecko";

const SELECTED_COIN_STORAGE_KEY = "crypto_dashboard_selected_coin";

function App() {
  const [coins, setCoins] = useState<CoinMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("current_price");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SELECTED_COIN_STORAGE_KEY);
  });
  const [detail, setDetail] = useState<CoinDetails | null>(null);
  const [chartPoints, setChartPoints] = useState<MarketChartPoint[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function loadCoins() {
    setLoading(true);
    setError(null);

    try {
      const data = await getTopCoins();
      setCoins(data);
      setSelectedCoinId((previous) => previous ?? data[0]?.id ?? null);
    } catch (fetchError) {
      if (fetchError instanceof ApiError) {
        setError(fetchError.message);
      } else {
        setError("Failed to load coins. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoins();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedCoinId) {
      localStorage.removeItem(SELECTED_COIN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SELECTED_COIN_STORAGE_KEY, selectedCoinId);
  }, [selectedCoinId]);

  async function loadCoinDetail(coinId: string) {
    setDetailLoading(true);
    setDetailError(null);

    try {
      const [detailData, chartData] = await Promise.all([
        getCoinDetails(coinId),
        getCoinMarketChart(coinId),
      ]);
      setDetail(detailData);
      setChartPoints(chartData);
    } catch (fetchError) {
      if (fetchError instanceof ApiError) {
        setDetailError(fetchError.message);
      } else {
        setDetailError("Failed to load coin details. Please try again.");
      }
      setDetail(null);
      setChartPoints([]);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedCoinId) {
      setDetail(null);
      setChartPoints([]);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    void loadCoinDetail(selectedCoinId);
  }, [selectedCoinId]);

  const filteredAndSortedCoins = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase();
    const filtered = coins.filter((coin) => {
      if (!normalized) return true;
      return (
        coin.name.toLowerCase().includes(normalized) ||
        coin.symbol.toLowerCase().includes(normalized)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;
      const diff = Number(aValue) - Number(bValue);
      return sortDir === "asc" ? diff : -diff;
    });

    return sorted;
  }, [coins, debouncedSearch, sortDir, sortKey]);

  return (
    <div className="app-shell">
      <div className="bg" />
      <div className="overlay" />
      <main className="content">
        <section className="hero-panel intro-panel">
          <p className="eyebrow">Crypto Dashboard MVP</p>
          <h1>Top Coins</h1>
          <p className="intro">
            Search and sort by price or 24h movement, then select a coin for the
            detail view in the next phase.
          </p>
          {selectedCoinId ? (
            <p className="selected-note">Selected coin: {selectedCoinId}</p>
          ) : null}
        </section>

        <Controls
          search={searchInput}
          onSearchChange={setSearchInput}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
        />

        {loading ? (
          <section className="hero-panel state-panel">Loading top coins...</section>
        ) : null}

        {error ? (
          <section className="hero-panel state-panel error-panel">
            <p>{error}</p>
            <button type="button" onClick={() => void loadCoins()}>
              Retry
            </button>
          </section>
        ) : null}

        {!loading && !error && filteredAndSortedCoins.length > 0 ? (
          <CoinTable
            coins={filteredAndSortedCoins}
            selectedCoinId={selectedCoinId}
            onSelectCoin={setSelectedCoinId}
          />
        ) : null}

        {!loading && !error && filteredAndSortedCoins.length === 0 ? (
          <section className="hero-panel state-panel">No coins match your search.</section>
        ) : null}

        {selectedCoinId ? (
          <CoinDetail
            coinId={selectedCoinId}
            detail={detail}
            chartPoints={chartPoints}
            loading={detailLoading}
            error={detailError}
            onBack={() => setSelectedCoinId(null)}
            onRetry={() => void loadCoinDetail(selectedCoinId)}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
