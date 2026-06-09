/// <reference types="@cloudflare/workers-types" />

interface Env {
  NOTION_TOKEN: string;
  NOTION_SETTINGS_PAGE_ID: string;
}

interface SymbolEntry {
  code: string;
  label: string;
  type: "stock" | "index";
}

interface NotionBlock {
  id: string;
  type: string;
  code?: { rich_text: Array<{ plain_text: string }> };
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** "7203.T|トヨタ|stock" 形式のテキストを SymbolEntry[] に変換 */
function parseSymbols(text: string): SymbolEntry[] {
  return text.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const [code, label, type] = l.split("|").map(s => s.trim());
      const t = type === "index" ? "index" : "stock";
      return { code, label: label ?? code, type: t };
    })
    .filter(s => s.code);
}

function formatSymbols(symbols: SymbolEntry[]): string {
  return symbols.map(s => `${s.code}|${s.label}|${s.type}`).join("\n");
}

async function getCodeBlock(pageId: string, token: string): Promise<NotionBlock | null> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=20`,
    { headers: { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28" } }
  );
  const data = await res.json() as { results: NotionBlock[] };
  return data.results?.find(b => b.type === "code") ?? null;
}

// ─── GET /api/symbols ───────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { NOTION_TOKEN, NOTION_SETTINGS_PAGE_ID } = context.env;
  if (!NOTION_TOKEN || !NOTION_SETTINGS_PAGE_ID) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 503, headers: CORS });
  }
  try {
    const block = await getCodeBlock(NOTION_SETTINGS_PAGE_ID, NOTION_TOKEN);
    const text = block?.code?.rich_text?.[0]?.plain_text ?? "";
    return new Response(JSON.stringify({ symbols: parseSymbols(text) }), { headers: CORS });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
};

// ─── PUT /api/symbols ───────────────────────────────────────────
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { NOTION_TOKEN, NOTION_SETTINGS_PAGE_ID } = context.env;
  if (!NOTION_TOKEN || !NOTION_SETTINGS_PAGE_ID) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 503, headers: CORS });
  }
  try {
    const body = await context.request.json() as { symbols: SymbolEntry[] };
    const text = formatSymbols(body.symbols);
    const block = await getCodeBlock(NOTION_SETTINGS_PAGE_ID, NOTION_TOKEN);

    if (block) {
      // 既存ブロックを更新
      await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ code: { rich_text: [{ type: "text", text: { content: text } }], language: "plain text" } }),
      });
    } else {
      // 新規ブロックを追加
      await fetch(`https://api.notion.com/v1/blocks/${NOTION_SETTINGS_PAGE_ID}/children`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ children: [{ type: "code", code: { rich_text: [{ type: "text", text: { content: text } }], language: "plain text" } }] }),
      });
    }

    return new Response(JSON.stringify({ ok: true, symbols: body.symbols }), { headers: CORS });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
};

// プリフライトリクエスト対応
export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });
