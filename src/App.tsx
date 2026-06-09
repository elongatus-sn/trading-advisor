import { useState, useCallback } from "react";
import type { DailyData } from "./types";
import QuoteCard from "./components/QuoteCard";
import ProposalCard from "./components/ProposalCard";
import RecordForm from "./components/RecordForm";
import HistoryView from "./components/HistoryView";

const TODAY = new Date().toLocaleDateString("ja-JP", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo",
}).replace(/\//g, "-");

export default function App() {
  const [tab, setTab]         = useState<"today" | "history">("today");
  const [data, setData]       = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setError]  = useState("");
  const [saved, setSaved]     = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    setData(null);
    setSaved(false);
    try {
      const res = await fetch("/api/proposal");
      if (!res.ok) throw new Error(`サーバーエラー: HTTP ${res.status}`);
      const json = await res.json() as DailyData & { error?: string };
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }, []);

  const stockQuotes = data?.quotes.filter(d => d.type !== "fx") ?? [];
  const fxQuotes    = data?.quotes.filter(d => d.type === "fx") ?? [];

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1826", color: "#e2e8f0",
      fontFamily: "'Helvetica Neue', 'Hiragino Sans', sans-serif",
      padding: "0 0 60px",
    }}>
      <div style={{
        background: "#0a1220", borderBottom: "1px solid #1e2f47",
        padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.5, color: "#93c5fd" }}>
            毎朝トレード顧問
          </div>
          <div style={{ fontSize: 11, color: "#4a6180", marginTop: 1 }}>{TODAY} — 前日値動き分析 → 設定提案</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["today", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "#1d4ed8" : "transparent",
                color: tab === t ? "#fff" : "#6b85a8",
                border: "1px solid " + (tab === t ? "#1d4ed8" : "#2a3a52"),
                borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              {t === "today" ? "今日" : "履歴"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "20px 16px" }}>
        {tab === "today" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <button
                onClick={run}
                disabled={loading}
                style={{
                  background: loading ? "#1e2f47" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "14px 32px", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(29,78,216,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "分析中..." : "前日データ取得 → 提案生成"}
              </button>
              {loading && (
                <div style={{ color: "#6b85a8", fontSize: 12, marginTop: 8 }}>
                  Yahoo Finance 取得中 → Claude 分析中...
                </div>
              )}
            </div>

            {errorMsg && (
              <div style={{ background: "#2a1a1a", border: "1px solid #f87171", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13 }}>
                ⚠ {errorMsg}
              </div>
            )}

            {stockQuotes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 8, letterSpacing: 1 }}>日本株・指数（前日終値）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {stockQuotes.map(d => <QuoteCard key={d.code} d={d} />)}
                </div>
              </div>
            )}

            {fxQuotes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 8, letterSpacing: 1 }}>FX（前日終値）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {fxQuotes.map(d => <QuoteCard key={d.code} d={d} />)}
                </div>
              </div>
            )}

            {data?.proposal && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 10, letterSpacing: 1 }}>AI 設定提案</div>
                <ProposalCard proposal={data.proposal} />
              </div>
            )}

            {data?.proposal && !saved && (
              <RecordForm
                proposal={data.proposal}
                quotes={data.quotes}
                today={TODAY}
                onSave={() => setSaved(true)}
              />
            )}

            {saved && (
              <div style={{ textAlign: "center", background: "#0f2a1a", border: "1px solid #4ade80", borderRadius: 10, padding: 16, color: "#4ade80", fontWeight: 700 }}>
                記録しました。「履歴」タブで振り返れます
              </div>
            )}

            <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6, borderTop: "1px solid #1e2f47", paddingTop: 16 }}>
              本ツールの提案は参考情報です。投資判断は必ずご自身で行い、松井証券の利用規約に従ってください。AIの提案は投資助言ではありません。
            </div>
          </div>
        ) : (
          <HistoryView />
        )}
      </div>
    </div>
  );
}
