/**
 * 毎朝トレード顧問 — 提案生成スクリプト
 * GitHub Actions から実行。@anthropic-ai/sdk を使用（ANTHROPIC_API_KEY 必須）。
 * 出力: public/proposal.json
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";

// ─── 銘柄定義 ──────────────────────────────────────────────────
const SYMBOLS_JP = [
  { code: "7203.T",  label: "トヨタ",  type: "stock" },
  { code: "6758.T",  label: "ソニーG", type: "stock" },
  { code: "9984.T",  label: "SBG",     type: "stock" },
  { code: "^N225",   label: "日経225", type: "index" },
];
const SYMBOLS_FX = [
  { code: "USDJPY=X", label: "USD/JPY", type: "fx" },
  { code: "EURJPY=X", label: "EUR/JPY", type: "fx" },
  { code: "GBPJPY=X", label: "GBP/JPY", type: "fx" },
];

// ─── Yahoo Finance 取得 ────────────────────────────────────────
async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.code)}?interval=1d&range=5d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const meta   = json.chart.result[0].meta;
  const q      = json.chart.result[0].indicators.quote[0];
  const closes = q.close;
  const n      = closes.length;

  const prev  = closes[n - 2];
  const last  = closes[n - 1] ?? meta.regularMarketPrice;
  const pct   = prev ? ((last - prev) / prev) * 100 : null;
  const high  = q.high[n - 1];
  const low   = q.low[n - 1];
  const range = high && low && prev ? ((high - low) / prev * 100).toFixed(2) : null;

  return { ...symbol, last, prev, pct, high, low, range };
}

// ─── プロンプト構築 ────────────────────────────────────────────
function pctStr(v) {
  if (v === null || v === undefined) return "−";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

function buildPrompt(stockData, fxData, today) {
  const fmt = (d) =>
    d.error
      ? `  ${d.label}(${d.code}): データ取得失敗`
      : `  ${d.label}(${d.code}): 終値=${d.last?.toFixed(2) ?? "−"} 前日比=${pctStr(d.pct)} 日中値幅=${d.range ?? "−"}% 高値=${d.high?.toFixed(2) ?? "−"} 安値=${d.low?.toFixed(2) ?? "−"}`;

  return `あなたは個人投資家の取引支援アシスタントです。以下は${today}（今日）の朝時点で確認できた前日の値動きデータです。
これを見て、今日の松井証券での取引における設定の考え方を提案してください。

【日本株・指数の前日値動き】
${stockData.map(fmt).join("\n")}

【FX前日値動き】
${fxData.map(fmt).join("\n")}

以下の形式でJSON形式のみで回答してください（前置き・後書き不要）：
{
  "summary": "前日相場の簡潔な特徴を2文で",
  "stock_advice": [
    { "label": "銘柄名", "action": "様子見|押し目狙い|空売り検討|反発狙い等", "reason": "理由30字以内", "loss_cut": "損切りの目安（%）", "target": "利確の目安（%）" }
  ],
  "fx_advice": [
    { "label": "通貨ペア", "range_low": 数値, "range_high": 数値, "strategy": "リピート系の推奨値幅（円）", "note": "注意点30字以内" }
  ],
  "risk_note": "今日特に気をつけるべき点を1文で"
}`;
}

// ─── メイン ────────────────────────────────────────────────────
const today = new Date().toLocaleDateString("ja-JP", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo",
}).replace(/\//g, "-");

console.log(`[${new Date().toISOString()}] Fetching quotes for ${today}...`);

const allSymbols = [...SYMBOLS_JP, ...SYMBOLS_FX];
const results = await Promise.allSettled(allSymbols.map(fetchQuote));
const quotes = allSymbols.map((s, i) => {
  const r = results[i];
  if (r.status === "fulfilled") return r.value;
  console.warn(`  ⚠ ${s.label}: ${r.reason?.message}`);
  return { ...s, error: r.reason instanceof Error ? r.reason.message : "fetch failed" };
});

console.log(`[${new Date().toISOString()}] Calling Claude SDK...`);

const client = new Anthropic(); // ANTHROPIC_API_KEY を env から自動読み込み
const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: buildPrompt(
    quotes.filter(d => d.type !== "fx"),
    quotes.filter(d => d.type === "fx"),
    today,
  )}],
});

const text     = message.content.filter(b => b.type === "text").map(b => b.text).join("");
const jsonStr  = text.replace(/```json\n?|```/g, "").trim();
const proposal = JSON.parse(jsonStr);

const output = {
  generatedAt: new Date().toISOString(),
  quotes: quotes.map(q => ({
    label: q.label, code: q.code, type: q.type,
    pct: q.pct ?? null, last: q.last ?? null, error: q.error ?? null,
  })),
  proposal,
};

writeFileSync("public/proposal.json", JSON.stringify(output, null, 2));
console.log(`✅ Saved public/proposal.json (${output.generatedAt})`);
