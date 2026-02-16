import type { CoinMarketItem } from "../lib/coingecko";

type CoinTableProps = {
  coins: CoinMarketItem[];
  selectedCoinId: string | null;
  onSelectCoin: (id: string) => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value.toFixed(2)}%`;
}

function formatMarketCap(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function CoinTable({ coins, selectedCoinId, onSelectCoin }: CoinTableProps) {
  return (
    <section className="hero-panel table-panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr
                key={coin.id}
                className={coin.id === selectedCoinId ? "selected-row" : ""}
                onClick={() => onSelectCoin(coin.id)}
              >
                <td>{coin.market_cap_rank}</td>
                <td className="name-cell">
                  <img src={coin.image} alt={`${coin.name} logo`} loading="lazy" />
                  <span>{coin.name}</span>
                </td>
                <td>{coin.symbol.toUpperCase()}</td>
                <td>{formatCurrency(coin.current_price)}</td>
                <td
                  className={
                    (coin.price_change_percentage_24h ?? 0) >= 0 ? "pos" : "neg"
                  }
                >
                  {formatPercent(coin.price_change_percentage_24h)}
                </td>
                <td>{formatMarketCap(coin.market_cap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
