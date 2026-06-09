# Trading Advisor — Claude Code 規約

## プロジェクト概要
松井証券での個人トレード支援ツール。売買を自動実行しない「判断支援」ツール。

## アーキテクチャ

```
[クラウドルーチン（平日朝6時JST）]
  Yahoo Finance → Claude自身が分析 → Notion MCP で保存
                                              ↓
[Cloudflare Pages Worker]         ← Notion API で読み取り（NOTION_TOKEN）
  /api/proposal を提供
                                              ↓
[ブラウザ（React Frontend）]
  ページ表示時に自動フェッチ → 提案・相場データを表示
```

## ディレクトリ構成
- `src/` — React フロントエンド
- `src/components/` — UI コンポーネント
- `src/components/CandidateCard.tsx` — AI提案の入れ替え候補銘柄カード
- `src/lib/storage.ts` — localStorage ラッパー（トレード記録）
- `src/types.ts` — 型定義・銘柄定数
- `functions/api/proposal.ts` — Cloudflare Worker（Notion提案ページ → JSON）
- `functions/api/symbols.ts` — Cloudflare Worker（Notion設定ページの銘柄一覧 GET/PUT）
- `routines/trading-advisor-routine.md` — クラウドルーチン用プロンプト原本
- `scripts/generate-proposal.mjs` — 手動テスト用スクリプト（開発時のみ）

## 銘柄管理
- **株式・指数**: Notion 設定ページ（`NOTION_SETTINGS_PAGE_ID`）に `code|label|type` 形式で保存
  - UI（各銘柄の ✕ ボタン）→ `PUT /api/symbols` → Notion に書き込み
  - AI入れ替え候補（⚡ セクション）→「＋追加」→ `PUT /api/symbols`
  - クラウドルーチンが毎朝ステップ0でこのリストを読み取る
- **FX**: USD/JPY, EUR/JPY, CNH/JPY, HKD/JPY の4ペア固定（UI変更不可）

## 認証情報
| 情報 | 用途 | 保管場所 |
|---|---|---|
| `NOTION_TOKEN` | Worker が Notion を読み書き | Cloudflare Pages 環境変数 |
| `NOTION_PAGE_ID` | 提案データ保存ページのID | Cloudflare Pages 環境変数 |
| `NOTION_SETTINGS_PAGE_ID` | 監視銘柄リスト設定ページのID（`37a1463a76fd81f6b957d61a66806ba6`） | Cloudflare Pages 環境変数 |

※クラウドルーチン側の Notion 書き込みは既存の Notion MCP 認証で動作（新規認証情報不要）

## 重要制約
- `NOTION_TOKEN` を `src/` 配下のコードに書かない（Worker 経由のみ）
- 売買の自動実行コードを追加しない

## セットアップ手順（初回）
```
1. Notion で提案保存用ページを新規作成
   → URL末尾の32桁がページID（NOTION_PAGE_ID）

2. Notion 統合トークンを取得
   → notion.so/my-integrations → 新規作成（読み取り権限のみ）
   → 作成したページに統合を「接続」
   → トークン（secret_xxx...）をメモ

3. Cloudflare Pages に環境変数を設定
   → dash.cloudflare.com → trading-advisor → Settings → Environment Variables
   → NOTION_TOKEN = secret_xxx...（シークレット）
   → NOTION_PAGE_ID = ページID

4. Cloudflare Pages に GitHub を接続（自動デプロイ化）
   → Settings → Build → Connect to Git → elongatus-sn/trading-advisor
   → Build command: npm run build / Output dir: dist

5. Claude Desktop でクラウドルーチンを作成
   → Routines → 新規作成
   → routines/trading-advisor-routine.md の内容を貼り付け
   → スケジュール: 0 21 * * 0-4
   → コネクター: Notion MCP
   → PROPOSAL_PAGE_ID をメモしたページIDに置き換え

6. ルーチンを手動実行して動作確認
```

## ローカル開発
```bash
cp .dev.vars.example .dev.vars  # NOTION_TOKEN, NOTION_PAGE_ID を設定
npm install
npm run dev
```
