import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CoinDetails, MarketChartPoint } from "../lib/coingecko";

type CoinDetailProps = {
  coinId: string;
  detail: CoinDetails | null;
  chartPoints: MarketChartPoint[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
};

function formatCurrency(value?: number): string {
  if (value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatCompactCurrency(value?: number): string {
  if (value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: number): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CoinDetail({
  coinId,
  detail,
  chartPoints,
  loading,
  error,
  onBack,
  onRetry,
}: CoinDetailProps) {
  const chartData = chartPoints.map((point) => ({
    ...point,
    label: formatShortDate(point.time),
  }));

  return (
    <section className="hero-panel detail-panel">
      <div className="detail-header">
        <button type="button" className="back-btn" onClick={onBack}>
          Back
        </button>
        <h2>{detail?.name ?? coinId}</h2>
      </div>

      {loading ? <p>Loading coin details...</p> : null}

      {error ? (
        <div className="detail-error">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Retry detail fetch
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="stats-grid">
            <div>
              <p className="stat-label">ATH</p>
              <p>{formatCurrency(detail?.market_data?.ath?.usd)}</p>
            </div>
            <div>
              <p className="stat-label">24h High</p>
              <p>{formatCurrency(detail?.market_data?.high_24h?.usd)}</p>
            </div>
            <div>
              <p className="stat-label">24h Low</p>
              <p>{formatCurrency(detail?.market_data?.low_24h?.usd)}</p>
            </div>
            <div>
              <p className="stat-label">24h Volume</p>
              <p>{formatCompactCurrency(detail?.market_data?.total_volume?.usd)}</p>
            </div>
            <div>
              <p className="stat-label">Market Cap</p>
              <p>{formatCompactCurrency(detail?.market_data?.market_cap?.usd)}</p>
            </div>
          </div>

          <div className="chart-wrap">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="label"
                    minTickGap={28}
                    tick={{ fill: "#cde2fb", fontSize: 12 }}
                  />
                  <YAxis
                    width={80}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        notation: "compact",
                        maximumFractionDigits: 2,
                      }).format(Number(value))
                    }
                    tick={{ fill: "#cde2fb", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#7ad1ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No chart data available for this coin.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
