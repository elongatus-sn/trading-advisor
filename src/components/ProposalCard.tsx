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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {proposal.fx_advice.map((a, i) => (
              <div key={i} style={{ background: "#111e30", border: "1px solid #1e3a5a", borderRadius: 10, overflow: "hidden" }}>
                {/* ヘッダー */}
                <div style={{
                  background: "#1a2232", borderBottom: "1px solid #1e3a5a",
                  padding: "9px 14px", display: "flex", flexWrap: "wrap",
                  justifyContent: "space-between", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#93c5fd" }}>{a.label}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "#6b85a8" }}>
                      レンジ <span style={{ color: "#e2e8f0" }}>{a.range_low} 〜 {a.range_high}</span>
                    </span>
                    <span style={{ color: "#fcd34d", fontWeight: 700 }}>{a.strategy}</span>
                  </div>
                </div>
                {/* ボディ */}
                <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* 用語説明 */}
                  {a.strategy_simple && (
                    <div style={{ fontSize: 11, color: "#60a5fa", fontStyle: "italic" }}>
                      ＝ {a.strategy_simple}
                    </div>
                  )}
                  {/* 注意点 */}
                  {a.note && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, color: "#4a6180", flexShrink: 0, marginTop: 1 }}>⚠️</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{a.note}</span>
                    </div>
                  )}
                  {/* 設定方法 */}
                  {a.daytrade && (
                    <div style={{
                      background: "#0d2137", border: "1px solid #1e3a5a",
                      borderRadius: 6, padding: "8px 10px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.5, marginBottom: 4 }}>
                        ⚡ 設定方法
                      </div>
                      <div style={{ fontSize: 12, color: "#bfdbfe", lineHeight: 1.6 }}>
                        {a.daytrade}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
