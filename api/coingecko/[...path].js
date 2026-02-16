const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export default async function handler(req, res) {
  try {
    const rawPath = req.query.path;
    const segments = Array.isArray(rawPath)
      ? rawPath
      : rawPath
        ? [rawPath]
        : [];

    const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
    const targetUrl = new URL(`${COINGECKO_BASE_URL}/${encodedPath}`);

    for (const [key, value] of Object.entries(req.query)) {
      if (key === "path") continue;
      if (Array.isArray(value)) {
        value.forEach((entry) => targetUrl.searchParams.append(key, String(entry)));
      } else if (value !== undefined) {
        targetUrl.searchParams.set(key, String(value));
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "crypto-dashboard-mvp/1.0",
      },
    });

    const body = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader(
      "content-type",
      upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8",
    );
    res.setHeader("cache-control", "s-maxage=30, stale-while-revalidate=120");
    res.send(body);
  } catch (error) {
    res.status(502).json({
      error: "Failed to reach CoinGecko.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
