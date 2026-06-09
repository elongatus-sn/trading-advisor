import type { ProposalData } from "../types";

function actionColor(a: string): string {
  if (!a) return "#94a3b8";
  if (a.includes("様子見")) return "#fbbf24";
  if (a.includes("空売り") || a.includes("売り")) return "#f87171";
  if (a.includes("押し目") || a.includes("反発") || a.includes("買い")) return "#4ade80";
  return "#93c5fd";
}

export default function ProposalCard({ proposal }: { proposal: ProposalData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ fontSize: 11, color: "#6b85a8", marginBottom: 6 }}>相場サマリ</div>
        <div style={{ color: "#c8d6e8", fontSize: 14, lineHeight: 1.6 }}>{proposal.summary}</div>
        {proposal.risk_note && (
          <div style={{ marginTop: 10, background: "#2a1a1a", borderLeft: "3px solid #f87171", padding: "8px 12px", borderRadius: "0 6px 6px 0", color: "#fca5a5", fontSize: 13 }}>
            ⚠ {proposal.risk_note}
          </div>
        )}
      </div>

      {proposal.stock_advice?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: "#6b85a8", marginBottom: 8, letterSpacing: 1 }}>日本株 設定提案</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {proposal.stock_advice.map((a, i) => (
              <div key={i} style={{ background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 8, padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: "0 0 80px" }}>
                  <div style={{ fontSize: 12, color: "#6b85a8" }}>{a.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: actionColor(a.action), marginTop: 2 }}>{a.action}</div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 12, color: "#c8d6e8" }}>{a.reason}</div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span style={{ color: "#f87171" }}>損切 {a.loss_cut}</span>
                  <span style={{ color: "#4ade80" }}>利確 {a.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {proposal.fx_advice?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: "#6b85a8", marginBottom: 8, letterSpacing: 1 }}>FX リピート設定提案</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {proposal.fx_advice.map((a, i) => (
              <div key={i} style={{ background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd" }}>{a.label}</span>
                    <span style={{ fontSize: 12, color: "#6b85a8", marginLeft: 10 }}>
                      レンジ想定: {a.range_low} 〜 {a.range_high}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#fcd34d" }}>値幅: {a.strategy}</span>
                </div>
                {a.note && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{a.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
