const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export default async function handler(req, res) {
  try {
    const requestedPath = String(req.query.path || "");
    if (!requestedPath) {
      res.status(400).json({ error: "Missing path query parameter." });
      return;
    }

    const normalizedPath = requestedPath.startsWith("/")
      ? requestedPath
      : `/${requestedPath}`;
    const targetUrl = new URL(`${COINGECKO_BASE_URL}${normalizedPath}`);
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
      targetUrl.searchParams.set("x_cg_demo_api_key", apiKey);
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "crypto-dashboard-mvp/1.0",
      },
    });

    const body = await upstreamResponse.text();
    if (upstreamResponse.status === 401) {
      res.status(401).json({
        error: "CoinGecko rejected the request (401).",
        detail:
          "Set COINGECKO_API_KEY in Vercel Project Settings -> Environment Variables, then redeploy.",
      });
      return;
    }

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
