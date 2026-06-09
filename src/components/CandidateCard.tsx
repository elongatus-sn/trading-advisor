import type { StockCandidate } from "../types";

interface Props {
  candidate: StockCandidate;
  onAdd: (c: StockCandidate) => void;
  adding: boolean;
}

export default function CandidateCard({ candidate, onAdd, adding }: Props) {
  return (
    <div style={{
      background: "#111e30", border: "1px dashed #2a3a52", borderRadius: 8,
      padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd" }}>{candidate.label}</span>
          <span style={{ fontSize: 10, color: "#4a6180", background: "#1a2232", borderRadius: 4, padding: "1px 6px" }}>
            {candidate.code}
          </span>
          <span style={{ fontSize: 12, color: "#fcd34d", marginLeft: 4 }}>{candidate.action}</span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{candidate.reason}</div>
        <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>目標 {candidate.target}</div>
      </div>
      <button
        onClick={() => onAdd(candidate)}
        disabled={adding}
        style={{
          flexShrink: 0,
          background: adding ? "#1e2f47" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
          color: adding ? "#4a6180" : "#fff",
          border: "none", borderRadius: 8,
          padding: "6px 14px", fontSize: 12, fontWeight: 700,
          cursor: adding ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {adding ? "追加中..." : "＋ 追加"}
      </button>
    </div>
  );
}
