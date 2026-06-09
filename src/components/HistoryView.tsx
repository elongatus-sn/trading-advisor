import { loadRecords } from "../lib/storage";

function pctColor(v: number | null | undefined): string {
  if (v === null || v === undefined) return "#8a9bb0";
  return v >= 0 ? "#4ade80" : "#f87171";
}

function pctStr(v: number | null | undefined): string {
  if (v === null || v === undefined) return "−";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

export default function HistoryView() {
  const records = loadRecords();

  if (records.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#6b85a8", padding: 40 }}>
        まだ記録がありません
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {records.map((r, i) => (
        <div key={i} style={{ background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{r.date}</span>
            <span style={{ fontSize: 11, color: "#6b85a8" }}>
              {new Date(r.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 記録
            </span>
          </div>

          {r.proposal?.summary && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, lineHeight: 1.5 }}>
              {r.proposal.summary}
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a3a52" }}>
                {["銘柄", "前日比", "提案", "実際の設定"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#6b85a8", padding: "4px 8px", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.quotes?.map((q, j) => {
                const stockAdv = r.proposal?.stock_advice?.find(a => a.label === q.label);
                const fxAdv    = r.proposal?.fx_advice?.find(a => a.label === q.label);
                const adv = stockAdv?.action ?? (fxAdv ? `値幅: ${fxAdv.strategy}` : "−");
                const act = r.actualSettings?.[q.code] || "−";
                const match = act !== "−" && adv !== "−" && act.slice(0, 3) === adv.slice(0, 3);
                return (
                  <tr key={j} style={{ borderBottom: "1px solid #151f2e" }}>
                    <td style={{ padding: "4px 8px", color: "#c8d6e8" }}>{q.label}</td>
                    <td style={{ padding: "4px 8px", color: pctColor(q.pct) }}>{pctStr(q.pct)}</td>
                    <td style={{ padding: "4px 8px", color: "#93c5fd" }}>{adv}</td>
                    <td style={{ padding: "4px 8px" }}>
                      <span style={{ color: match ? "#4ade80" : "#fbbf24" }}>{act}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {r.memo && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", background: "#0d1826", borderRadius: 6, padding: "8px 10px" }}>
              {r.memo}
            </div>
          )}
          {r.proposal?.risk_note && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#fca5a5" }}>⚠ {r.proposal.risk_note}</div>
          )}
        </div>
      ))}
    </div>
  );
}
