/// <reference types="@cloudflare/workers-types" />

// 固定FXペア
const FX_SYMBOLS = [
  { code: "USDJPY=X", label: "USD/JPY", type: "fx" as const },
  { code: "EURJPY=X", label: "EUR/JPY", type: "fx" as const },
  { code: "CNHJPY=X", label: "CNH/JPY", type: "fx" as const },
  { code: "HKDJPY=X", label: "HKD/JPY", type: "fx" as const },
];

interface SymbolDef {
  code: string;
  label: string;
  type: "stock" | "index" | "fx";
}

interface QuoteResult extends SymbolDef {
  last: number | null;
  prev: number | null;
  pct: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  error: string | null;
}

async function fetchQuote(sym: SymbolDef): Promise<QuoteResult> {
  const encoded = sym.code.replace("^", "%5E").replace("=", "%3D");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=5d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ...sym, last: null, prev: null, pct: null, high: null, low: null, open: null, error: `HTTP ${res.status}` };

    const json = await res.json() as {
      chart: { result: Array<{
        indicators: { quote: Array<{ close: number[]; high: number[]; low: number[]; open: number[] }> };
      }>; error: { description: string } | null };
    };

    if (json.chart.error) return { ...sym, last: null, prev: null, pct: null, high: null, low: null, open: null, error: json.chart.error.description };
    const result = json.chart.result?.[0];
    if (!result) return { ...sym, last: null, prev: null, pct: null, high: null, low: null, open: null, error: "no data" };

    const q = result.indicators.quote[0];
    const closes = (q.close ?? []).filter((v): v is number => v != null);
    const highs  = (q.high  ?? []).filter((v): v is number => v != null);
    const lows   = (q.low   ?? []).filter((v): v is number => v != null);
    const opens  = (q.open  ?? []).filter((v): v is number => v != null);

    const last = closes.at(-1) ?? null;
    const prev = closes.at(-2) ?? null;
    const pct  = last != null && prev != null && prev !== 0
      ? Math.round(((last - prev) / prev) * 10000) / 100
      : null;

    return {
      ...sym,
      last: last != null ? Math.round(last * 100) / 100 : null,
      prev: prev != null ? Math.round(prev * 100) / 100 : null,
      pct,
      high: (highs.at(-1) ?? null),
      low:  (lows.at(-1)  ?? null),
      open: (opens.at(-1) ?? null),
      error: null,
    };
  } catch (e: unknown) {
    return { ...sym, last: null, prev: null, pct: null, high: null, low: null, open: null, error: String(e) };
  }
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "max-age=300",
};

// ─── GET /api/market-data ────────────────────────────────────────
// Query params:
//   stocks=7203.T,6758.T,...  (label付き: "7203.T:トヨタ,6758.T:ソニーG")
// Returns: { generatedAt, quotes: QuoteResult[] }
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const stocksParam = url.searchParams.get("stocks") ?? "";

  // stocks パラメータを解析 "code:label:type,..." 形式
  const stockSymbols: SymbolDef[] = stocksParam
    ? stocksParam.split(",").map(s => {
        const [code, label, type] = s.split(":").map(p => p.trim());
        return {
          code,
          label: label || code,
          type: (type === "index" ? "index" : "stock") as "stock" | "index",
        };
      }).filter(s => s.code)
    : [
        { code: "7203.T", label: "トヨタ",  type: "stock" },
        { code: "6758.T", label: "ソニーG", type: "stock" },
        { code: "9984.T", label: "SBG",     type: "stock" },
        { code: "^N225",  label: "日経225", type: "index" },
      ];

  const allSymbols = [...stockSymbols, ...FX_SYMBOLS];

  // 並列フェッチ
  const quotes = await Promise.all(allSymbols.map(fetchQuote));

  return new Response(
    JSON.stringify({ generatedAt: new Date().toISOString(), quotes }),
    { headers: CORS }
  );
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });
