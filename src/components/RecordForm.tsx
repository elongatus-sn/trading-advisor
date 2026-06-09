import { useState } from "react";
import { DEFAULT_SYMBOLS_JP, SYMBOLS_FX, type ProposalData, type QuoteData } from "../types";
import { saveRecord } from "../lib/storage";

interface Props {
  proposal: ProposalData;
  quotes: QuoteData[];
  today: string;
  onSave: () => void;
}

const STOCK_OPTIONS = ["様子見", "押し目買い", "空売り", "反発狙い", "損切り設定更新", "利確設定更新"];
const FX_OPTIONS    = ["設定済み(継続)", "値幅変更", "レンジ変更", "一時停止", "新規設定"];

export default function RecordForm({ proposal, quotes, today, onSave }: Props) {
  const [notes, setNotes]   = useState<Record<string, string>>({});
  const [actual, setActual] = useState<Record<string, string>>({});
  const [memo, setMemo]     = useState("");

  const allSymbols = [...DEFAULT_SYMBOLS_JP, ...SYMBOLS_FX];

  const save = () => {
    saveRecord({
      date: today,
      proposal,
      quotes: quotes.map(q => ({ label: q.label, code: q.code, pct: q.pct, last: q.last })),
      actualSettings: actual,
      notes,
      memo,
      createdAt: new Date().toISOString(),
    });
    onSave();
  };

  return (
    <div style={{ background: "#1a2232", border: "1px solid #2a3a52", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 14 }}>実際の設定を記録</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allSymbols.map(s => (
          <div key={s.code} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 70, fontSize: 12, color: "#6b85a8" }}>{s.label}</span>
            <select
              value={actual[s.code] || ""}
              onChange={e => setActual(p => ({ ...p, [s.code]: e.target.value }))}
              style={{ background: "#0d1826", color: "#e2e8f0", border: "1px solid #2a3a52", borderRadius: 6, padding: "4px 8px", fontSize: 12, flex: 1 }}
            >
              <option value="">未設定</option>
              {(s.type === "fx" ? FX_OPTIONS : STOCK_OPTIONS).map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <input
              placeholder="メモ"
              value={notes[s.code] || ""}
              onChange={e => setNotes(p => ({ ...p, [s.code]: e.target.value }))}
              style={{ background: "#0d1826", color: "#e2e8f0", border: "1px solid #2a3a52", borderRadius: 6, padding: "4px 8px", fontSize: 12, width: 120 }}
            />
          </div>
        ))}
      </div>

      <textarea
        placeholder="今日の全体メモ（相場観・迷った点など）"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        rows={3}
        style={{ width: "100%", marginTop: 12, background: "#0d1826", color: "#e2e8f0", border: "1px solid #2a3a52", borderRadius: 6, padding: "8px 10px", fontSize: 12, resize: "vertical", boxSizing: "border-box" }}
      />

      <button
        onClick={save}
        style={{ marginTop: 12, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
      >
        記録を保存
      </button>
    </div>
  );
}
