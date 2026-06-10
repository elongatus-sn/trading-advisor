/// <reference types="@cloudflare/workers-types" />

interface Env {
  NOTION_TOKEN: string;
  NOTION_PAGE_ID: string;
  RESEND_API_KEY: string;
  NOTIFY_EMAIL: string;
}

interface QuoteData {
  code: string; label: string; type: string;
  last: number | null; pct: number | null; error: string | null;
}
interface StockAdvice  { label: string; action: string; reason: string; loss_cut: string; target: string; }
interface StockCandidate { code: string; label: string; reason: string; action: string; action_simple: string; target: string; daytrade: string; }
interface FxAdvice { label: string; range_low: number; range_high: number; strategy: string; strategy_simple: string; note: string; daytrade: string; }
interface ProposalData {
  summary: string;
  stock_advice: StockAdvice[];
  stock_candidates: StockCandidate[];
  fx_advice: FxAdvice[];
  risk_note: string;
}
interface DailyData {
  generatedAt: string;
  quotes: QuoteData[];
  proposal: ProposalData | null;
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function pct(v: number | null): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function pctColor(v: number | null): string {
  if (v == null) return "#94a3b8";
  return v >= 0 ? "#4ade80" : "#f87171";
}

function buildHtml(data: DailyData): string {
  const jst = new Date(data.generatedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const stockRows = (data.quotes ?? [])
    .filter(q => q.type !== "fx")
    .map(q => `
      <tr>
        <td style="padding:6px 12px;color:#e2e8f0;font-weight:600;">${q.label}</td>
        <td style="padding:6px 12px;color:#e2e8f0;text-align:right;">${q.last?.toLocaleString() ?? "—"}</td>
        <td style="padding:6px 12px;text-align:right;color:${pctColor(q.pct)};font-weight:700;">${pct(q.pct)}</td>
      </tr>`).join("");

  const fxRows = (data.quotes ?? [])
    .filter(q => q.type === "fx")
    .map(q => `
      <tr>
        <td style="padding:6px 12px;color:#93c5fd;font-weight:600;">${q.label}</td>
        <td style="padding:6px 12px;color:#e2e8f0;text-align:right;">${q.last ?? "—"}</td>
        <td style="padding:6px 12px;text-align:right;color:${pctColor(q.pct)};font-weight:700;">${pct(q.pct)}</td>
      </tr>`).join("");

  const proposal = data.proposal;

  const adviceRows = (proposal?.stock_advice ?? []).map(a => `
    <tr>
      <td style="padding:6px 12px;color:#e2e8f0;font-weight:600;">${a.label}</td>
      <td style="padding:6px 12px;color:#fcd34d;font-weight:700;">${a.action}</td>
      <td style="padding:6px 12px;color:#94a3b8;font-size:13px;">${a.reason}</td>
      <td style="padding:6px 12px;color:#f87171;">${a.loss_cut}</td>
      <td style="padding:6px 12px;color:#4ade80;">${a.target}</td>
    </tr>`).join("");

  const candidateCards = (proposal?.stock_candidates ?? []).map(c => `
    <div style="background:#1a2232;border:1px solid #2a3a52;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="color:#e2e8f0;font-weight:700;font-size:14px;">${c.label}</span>
        <span style="color:#4a6180;font-size:11px;background:#0d1826;border-radius:4px;padding:1px 6px;">${c.code}</span>
        <span style="color:#fbbf24;font-weight:700;font-size:12px;">${c.action}</span>
      </div>
      <div style="color:#60a5fa;font-size:11px;font-style:italic;margin-bottom:4px;">＝ ${c.action_simple}</div>
      <div style="color:#94a3b8;font-size:12px;margin-bottom:4px;">💡 ${c.reason}</div>
      <div style="color:#4ade80;font-size:12px;margin-bottom:6px;">🎯 目標 ${c.target}</div>
      <div style="background:#0d1826;border-radius:6px;padding:8px 10px;">
        <div style="color:#60a5fa;font-size:10px;font-weight:700;margin-bottom:4px;">⚡ デイトレ推奨</div>
        <div style="color:#bfdbfe;font-size:12px;line-height:1.6;">${c.daytrade}</div>
      </div>
    </div>`).join("");

  const fxCards = (proposal?.fx_advice ?? []).map(a => `
    <div style="background:#1a2232;border:1px solid #2a3a52;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="color:#93c5fd;font-weight:700;font-size:14px;">${a.label}</span>
        <span style="color:#fcd34d;font-size:12px;">${a.strategy}</span>
      </div>
      <div style="color:#6b85a8;font-size:12px;margin-bottom:3px;">レンジ: ${a.range_low} 〜 ${a.range_high}</div>
      <div style="color:#60a5fa;font-size:11px;font-style:italic;margin-bottom:4px;">＝ ${a.strategy_simple ?? ""}</div>
      ${a.note ? `<div style="color:#94a3b8;font-size:12px;margin-bottom:6px;">⚠️ ${a.note}</div>` : ""}
      ${a.daytrade ? `
      <div style="background:#0d1826;border-radius:6px;padding:8px 10px;">
        <div style="color:#60a5fa;font-size:10px;font-weight:700;margin-bottom:4px;">⚡ 設定方法</div>
        <div style="color:#bfdbfe;font-size:12px;line-height:1.6;">${a.daytrade}</div>
      </div>` : ""}
    </div>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1220;font-family:'Helvetica Neue','Hiragino Sans',sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">

  <!-- ヘッダー -->
  <div style="background:#111e30;border:1px solid #1e3a5a;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
    <div style="color:#93c5fd;font-size:18px;font-weight:800;margin-bottom:4px;">毎朝トレード顧問</div>
    <div style="color:#4a6180;font-size:12px;">${jst} JST 更新</div>
  </div>

  <!-- 相場サマリ + リスクノート -->
  ${proposal ? `
  <div style="background:#1a2232;border:1px solid #2a3a52;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
    <div style="color:#6b85a8;font-size:11px;margin-bottom:6px;">相場サマリ</div>
    <div style="color:#c8d6e8;font-size:14px;line-height:1.6;">${proposal.summary}</div>
    ${proposal.risk_note ? `
    <div style="margin-top:12px;background:#2a1a1a;border-left:3px solid #f87171;padding:8px 12px;border-radius:0 6px 6px 0;color:#fca5a5;font-size:13px;">
      ⚠ ${proposal.risk_note}
    </div>` : ""}
  </div>` : ""}

  <!-- 株価テーブル -->
  <div style="margin-bottom:20px;">
    <div style="color:#6b85a8;font-size:11px;margin-bottom:8px;letter-spacing:1px;">日本株・指数（前日終値）</div>
    <table style="width:100%;border-collapse:collapse;background:#1a2232;border:1px solid #2a3a52;border-radius:8px;overflow:hidden;">
      <tr style="background:#111e30;">
        <th style="padding:6px 12px;text-align:left;color:#4a6180;font-size:11px;">銘柄</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">終値</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">前日比</th>
      </tr>
      ${stockRows}
    </table>
  </div>

  <!-- FXテーブル -->
  <div style="margin-bottom:20px;">
    <div style="color:#6b85a8;font-size:11px;margin-bottom:8px;letter-spacing:1px;">FX（前日終値）</div>
    <table style="width:100%;border-collapse:collapse;background:#1a2232;border:1px solid #2a3a52;border-radius:8px;overflow:hidden;">
      <tr style="background:#111e30;">
        <th style="padding:6px 12px;text-align:left;color:#4a6180;font-size:11px;">ペア</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">レート</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">前日比</th>
      </tr>
      ${fxRows}
    </table>
  </div>

  <!-- 株式設定提案 -->
  ${adviceRows ? `
  <div style="margin-bottom:20px;">
    <div style="color:#6b85a8;font-size:11px;margin-bottom:8px;letter-spacing:1px;">日本株 設定提案</div>
    <table style="width:100%;border-collapse:collapse;background:#1a2232;border:1px solid #2a3a52;border-radius:8px;overflow:hidden;">
      <tr style="background:#111e30;">
        <th style="padding:6px 12px;text-align:left;color:#4a6180;font-size:11px;">銘柄</th>
        <th style="padding:6px 12px;text-align:left;color:#4a6180;font-size:11px;">判断</th>
        <th style="padding:6px 12px;text-align:left;color:#4a6180;font-size:11px;">理由</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">損切</th>
        <th style="padding:6px 12px;text-align:right;color:#4a6180;font-size:11px;">利確</th>
      </tr>
      ${adviceRows}
    </table>
  </div>` : ""}

  <!-- 入れ替え候補 -->
  ${candidateCards ? `
  <div style="margin-bottom:20px;">
    <div style="color:#fcd34d;font-size:11px;margin-bottom:8px;letter-spacing:1px;">⚡ 入れ替え候補（AI提案）</div>
    ${candidateCards}
  </div>` : ""}

  <!-- FX設定提案 -->
  ${fxCards ? `
  <div style="margin-bottom:20px;">
    <div style="color:#6b85a8;font-size:11px;margin-bottom:8px;letter-spacing:1px;">FX リピート設定提案</div>
    ${fxCards}
  </div>` : ""}

  <!-- リンク -->
  <div style="text-align:center;margin-top:24px;">
    <a href="https://trading-advisor.pages.dev"
       style="background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
      アプリを開く →
    </a>
  </div>

  <!-- フッター -->
  <div style="margin-top:24px;color:#374151;font-size:11px;text-align:center;line-height:1.6;">
    本メールの情報は参考目的です。投資判断は必ずご自身で行ってください。<br>
    AIの提案は投資助言ではありません。
  </div>

</div>
</body>
</html>`;
}

// ─── POST /api/notify ────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { NOTION_TOKEN, NOTION_PAGE_ID, RESEND_API_KEY, NOTIFY_EMAIL } = context.env;

  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY or NOTIFY_EMAIL not configured" }), { status: 503, headers: CORS });
  }
  if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
    return new Response(JSON.stringify({ error: "Notion not configured" }), { status: 503, headers: CORS });
  }

  try {
    // Notion から最新データ取得
    const nr = await fetch(
      `https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children?page_size=10`,
      { headers: { "Authorization": `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28" } }
    );
    const nb = await nr.json() as { results: Array<{ type: string; code?: { rich_text: Array<{ plain_text: string }> } }> };
    const codeBlock = nb.results?.find(b => b.type === "code");
    if (!codeBlock) throw new Error("提案データが見つかりません");

    const jsonStr = codeBlock.code?.rich_text?.map(t => t.plain_text).join("") ?? "";
    const data: DailyData = JSON.parse(jsonStr);

    const jst = new Date(data.generatedAt).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit",
    });
    const subject = `📈 毎朝トレード顧問 ${jst} — 提案生成完了`;

    // Resend でメール送信
    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "毎朝トレード顧問 <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject,
        html: buildHtml(data),
      }),
    });

    if (!mailRes.ok) {
      const err = await mailRes.text();
      throw new Error(`Resend error ${mailRes.status}: ${err}`);
    }

    const result = await mailRes.json() as { id: string };
    return new Response(JSON.stringify({ ok: true, emailId: result.id }), { headers: CORS });

  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });
