/// <reference types="@cloudflare/workers-types" />

interface Env {
  NOTION_TOKEN: string;
  NOTION_PAGE_ID: string;
}

interface NotionRichText {
  plain_text: string;
}

interface NotionBlock {
  type: string;
  code?: {
    rich_text: NotionRichText[];
    language: string;
  };
}

interface NotionBlocksResponse {
  results: NotionBlock[];
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { NOTION_TOKEN, NOTION_PAGE_ID } = context.env;

  if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
    return new Response(
      JSON.stringify({ error: "Notion credentials not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children?page_size=10`,
      {
        headers: {
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Notion API: HTTP ${res.status}`);
    }

    const data = await res.json() as NotionBlocksResponse;

    // 最初のコードブロック（JSON）を取得
    const codeBlock = data.results.find(b => b.type === "code");
    if (!codeBlock) {
      return new Response(
        JSON.stringify({ error: "提案データがまだ生成されていません" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const jsonStr = codeBlock.code?.rich_text?.[0]?.plain_text ?? "";
    const proposal = JSON.parse(jsonStr);

    return new Response(JSON.stringify(proposal), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
