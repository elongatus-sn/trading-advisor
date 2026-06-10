import { useState, useEffect, useCallback } from "react";
import type { DailyData, StockCandidate } from "./types";
import QuoteCard from "./components/QuoteCard";
import ProposalCard from "./components/ProposalCard";
import CandidateCard from "./components/CandidateCard";
import RecordForm from "./components/RecordForm";
import HistoryView from "./components/HistoryView";

const TODAY = new Date().toLocaleDateString("ja-JP", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo",
}).replace(/\//g, "-");

function formatJST(iso: string | null): string {
  if (!iso) return "未生成";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const [tab, setTab]         = useState<"today" | "history">("today");
  const [data, setData]       = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setError]  = useState("");
  const [saved, setSaved]     = useState(false);

  // 銘柄操作の状態
  const [removingCode, setRemovingCode]   = useState<string | null>(null);
  const [addingCode,   setAddingCode]     = useState<string | null>(null);
  const [symbolMsg,    setSymbolMsg]      = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/proposal", { cache: "no-store" });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as DailyData & { error?: string };
      if (json.error || !json.generatedAt) { setData(null); return; }
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 現在の株式銘柄を quotes から再構築
  const currentStockSymbols = (data?.quotes ?? [])
    .filter(q => q.type !== "fx")
    .map(q => ({ code: q.code, label: q.label, type: q.type as "stock" | "index" }));

  // 銘柄を Notion 設定ページへ保存
  const saveSymbols = async (symbols: typeof currentStockSymbols) => {
    const res = await fetch("/api/symbols", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    if (!res.ok) throw new Error(`symbols API ${res.status}`);
  };

  // 銘柄削除
  const handleRemove = async (code: string) => {
    if (!window.confirm(`「${currentStockSymbols.find(s => s.code === code)?.label}」を監視リストから削除しますか？`)) return;
    setRemovingCode(code);
    setSymbolMsg("");
    try {
      const updated = currentStockSymbols.filter(s => s.code !== code);
      await saveSymbols(updated);
      setSymbolMsg("削除しました。次回ルーチン実行時から反映されます。");
    } catch (e) {
      setSymbolMsg("エラー: " + String(e));
    } finally {
      setRemovingCode(null);
    }
  };

  // 候補銘柄を追加
  const handleAdd = async (candidate: StockCandidate) => {
    if (currentStockSymbols.some(s => s.code === candidate.code)) {
      setSymbolMsg(`「${candidate.label}」はすでに監視中です。`);
      return;
    }
    setAddingCode(candidate.code);
    setSymbolMsg("");
    try {
      const type = candidate.code.startsWith("^") ? "index" : "stock";
      const updated = [...currentStockSymbols, { code: candidate.code, label: candidate.label, type }];
      await saveSymbols(updated as typeof currentStockSymbols);
      setSymbolMsg(`「${candidate.label}」を追加しました。次回ルーチン実行時から反映されます。`);
    } catch (e) {
      setSymbolMsg("エラー: " + String(e));
    } finally {
      setAddingCode(null);
    }
  };

  const stockQuotes = data?.quotes.filter(d => d.type !== "fx") ?? [];
  const fxQuotes    = data?.quotes.filter(d => d.type === "fx") ?? [];
  const candidates  = data?.proposal?.stock_candidates ?? [];

  return (
    <div style={{
      minHeight: "100vh", background: "#0d1826", color: "#e2e8f0",
      fontFamily: "'Helvetica Neue', 'Hiragino Sans', sans-serif",
      padding: "0 0 60px",
    }}>
      {/* ヘッダー */}
      <div style={{
        background: "#0a1220", borderBottom: "1px solid #1e2f47",
        padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.5, color: "#93c5fd" }}>
            毎朝トレード顧問
          </div>
          <div style={{ fontSize: 11, color: "#4a6180", marginTop: 1 }}>
            {TODAY} — {loading ? "読み込み中..." : `最終更新: ${formatJST(data?.generatedAt ?? null)}`}
          </div>
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

            {/* 再読み込みボタン */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={load}
                disabled={loading}
                style={{
                  background: loading ? "#1e2f47" : "#162032",
                  color: loading ? "#4a6180" : "#93c5fd",
                  border: "1px solid #1e2f47", borderRadius: 10,
                  padding: "10px 24px", fontSize: 13, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "読み込み中..." : "↻ 最新データを再読み込み"}
              </button>
              <div style={{ color: "#374151", fontSize: 11, marginTop: 6 }}>
                クラウドルーチンにより平日朝6時に自動更新されます
              </div>
            </div>

            {/* エラー表示 */}
            {errorMsg && (
              <div style={{ background: "#2a1a1a", border: "1px solid #f87171", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13 }}>
                ⚠ {errorMsg}
              </div>
            )}

            {/* 銘柄操作メッセージ */}
            {symbolMsg && (
              <div style={{ background: "#0f2a1a", border: "1px solid #4ade80", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 12 }}>
                ✓ {symbolMsg}
              </div>
            )}

            {/* 日本株・指数（削除ボタン付き） */}
            {stockQuotes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 8, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>日本株・指数（前日終値）</span>
                  <span style={{ fontSize: 10, color: "#374151" }}>✕ で監視解除</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {stockQuotes.map(d => (
                    <div key={d.code} style={{ position: "relative" }}>
                      <QuoteCard d={d} />
                      <button
                        onClick={() => handleRemove(d.code)}
                        disabled={removingCode === d.code}
                        title={`「${d.label}」を監視リストから削除`}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "#374151", color: "#94a3b8",
                          border: "1px solid #2a3a52", fontSize: 9, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {removingCode === d.code ? "…" : "✕"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FX */}
            {fxQuotes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 8, letterSpacing: 1 }}>FX（前日終値）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {fxQuotes.map(d => <QuoteCard key={d.code} d={d} />)}
                </div>
              </div>
            )}

            {/* AI 提案 */}
            {data?.proposal && (
              <div>
                <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 10, letterSpacing: 1 }}>AI 設定提案</div>
                <ProposalCard proposal={data.proposal} />
              </div>
            )}

            {/* 入れ替え候補銘柄 */}
            {candidates.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#fcd34d", marginBottom: 8, letterSpacing: 1 }}>
                  ⚡ 入れ替え候補（AI提案）
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {candidates.map(c => (
                    <CandidateCard
                      key={c.code}
                      candidate={c}
                      onAdd={handleAdd}
                      adding={addingCode === c.code}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#374151", marginTop: 8 }}>
                  「＋追加」で次回ルーチンから監視に追加されます
                </div>
              </div>
            )}

            {/* 未生成メッセージ */}
            {!loading && !data && !errorMsg && (
              <div style={{ textAlign: "center", color: "#4a6180", fontSize: 13, padding: "40px 0" }}>
                提案はまだ生成されていません。<br />
                クラウドルーチンが平日朝6時に自動生成します。
              </div>
            )}

            {/* 記録フォーム */}
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

            {/* 免責事項 */}
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
