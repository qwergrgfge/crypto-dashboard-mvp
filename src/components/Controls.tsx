export type SortKey = "current_price" | "price_change_percentage_24h";
export type SortDir = "asc" | "desc";

type ControlsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: SortKey;
  onSortKeyChange: (value: SortKey) => void;
  sortDir: SortDir;
  onSortDirChange: (value: SortDir) => void;
};

export function Controls({
  search,
  onSearchChange,
  sortKey,
  onSortKeyChange,
  sortDir,
  onSortDirChange,
}: ControlsProps) {
  return (
    <section className="hero-panel controls-panel">
      <div className="field">
        <label htmlFor="coin-search">Search coins</label>
        <input
          id="coin-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Try bitcoin or btc"
          type="search"
        />
      </div>

      <div className="field">
        <label htmlFor="sort-key">Sort by</label>
        <select
          id="sort-key"
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
        >
          <option value="current_price">Price</option>
          <option value="price_change_percentage_24h">24h %</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="sort-dir">Direction</label>
        <select
          id="sort-dir"
          value={sortDir}
          onChange={(event) => onSortDirChange(event.target.value as SortDir)}
        >
          <option value="desc">Highest first</option>
          <option value="asc">Lowest first</option>
        </select>
      </div>
    </section>
  );
}
