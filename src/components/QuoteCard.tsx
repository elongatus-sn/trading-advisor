import type { QuoteData } from "../types";

function pctColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return "#8a9bb0";
  return v >= 0 ? "#4ade80" : "#f87171";
}

export function pctStr(v: number | null | undefined): string {
  if (v === null || v === undefined) return "−";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

export default function QuoteCard({ d }: { d: QuoteData }) {
  return (
    <div style={{
      background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 8,
      padding: "10px 14px", minWidth: 130,
    }}>
      <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 2 }}>{d.label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
        {d.error ? "−" : (d.last?.toLocaleString("ja-JP", { maximumFractionDigits: 3 }) ?? "−")}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: pctColor(d.pct) }}>
        {d.error
          ? <span style={{ color: "#f87171", fontSize: 11 }}>取得失敗</span>
          : pctStr(d.pct)}
      </div>
      {!d.error && d.range && (
        <div style={{ fontSize: 10, color: "#6b85a8", marginTop: 2 }}>日中幅 {d.range}%</div>
      )}
    </div>
  );
}
