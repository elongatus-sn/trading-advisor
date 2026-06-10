import type { StockCandidate } from "../types";

interface Props {
  candidate: StockCandidate;
  onAdd: (c: StockCandidate) => void;
  adding: boolean;
}

const ACTION_COLOR: Record<string, string> = {
  "押し目買い":      "#fbbf24",
  "打診買い":        "#fb923c",
  "順張りエントリー": "#34d399",
  "様子見":          "#94a3b8",
};

export default function CandidateCard({ candidate, onAdd, adding }: Props) {
  const acColor = ACTION_COLOR[candidate.action] ?? "#93c5fd";

  return (
    <div style={{
      background: "#0f1c2e",
      border: "1px solid #1e3a5a",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {/* ヘッダー行 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        background: "#111e30",
        borderBottom: "1px solid #1e3a5a",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>
            {candidate.label}
          </span>
          <span style={{
            fontSize: 10, color: "#4a6180",
            background: "#1a2232", borderRadius: 4, padding: "1px 6px",
          }}>
            {candidate.code}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: acColor,
            background: acColor + "18", borderRadius: 4, padding: "2px 8px",
          }}>
            {candidate.action}
          </span>
        </div>
        <button
          onClick={() => onAdd(candidate)}
          disabled={adding}
          style={{
            flexShrink: 0,
            background: adding ? "#1e2f47" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
            color: adding ? "#4a6180" : "#fff",
            border: "none", borderRadius: 7,
            padding: "5px 14px", fontSize: 12, fontWeight: 700,
            cursor: adding ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", marginLeft: 8,
          }}
        >
          {adding ? "追加中..." : "＋ 追加"}
        </button>
      </div>

      {/* ボディ */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* 用語説明 */}
        <div style={{ fontSize: 11, color: acColor + "cc", fontStyle: "italic" }}>
          ＝ {candidate.action_simple}
        </div>

        {/* 注目理由 */}
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: "#4a6180", flexShrink: 0, marginTop: 1 }}>💡</span>
          <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{candidate.reason}</span>
        </div>

        {/* 目標 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#4a6180", flexShrink: 0 }}>🎯</span>
          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>目標 {candidate.target}</span>
        </div>

        {/* デイトレ提案 */}
        {candidate.daytrade && (
          <div style={{
            background: "#0d2137",
            border: "1px solid #1e3a5a",
            borderRadius: 6,
            padding: "8px 10px",
            marginTop: 2,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#60a5fa",
              letterSpacing: 0.5, marginBottom: 4,
            }}>
              ⚡ デイトレ推奨
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe", lineHeight: 1.6 }}>
              {candidate.daytrade}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
