# Trading Advisor — Claude Code 規約

## プロジェクト概要
松井証券での個人トレード支援ツール。売買を自動実行しない「判断支援」ツール。

## アーキテクチャ
- **フロントエンド**: React 18 + TypeScript + Vite → Cloudflare Pages
- **API**: Cloudflare Pages Functions (`functions/api/proposal.ts`)
  - Yahoo Finance v8 API で株価取得
  - `@anthropic-ai/sdk` で Claude API 呼び出し
- **APIキー**: Cloudflare 環境変数 `ANTHROPIC_API_KEY`（フロントに露出しない）
- **ローカル開発**: `.dev.vars` に `ANTHROPIC_API_KEY` を設定して `npm run dev`

## ディレクトリ構成
- `src/` — React フロントエンド
- `src/components/` — UI コンポーネント
- `src/lib/storage.ts` — localStorage ラッパー
- `src/types.ts` — 型定義・銘柄定数
- `functions/api/proposal.ts` — Cloudflare Pages Function（サーバーサイド）

## 重要制約
- `ANTHROPIC_API_KEY` を `src/` 配下のコードに書かない
- `functions/` 内でのみ Anthropic SDK を使用
- `proposal.ts` の `model` は `claude-sonnet-4-6` を使用

## デプロイフロー
1. GitHub に push → Cloudflare Pages が自動ビルド・デプロイ
2. Cloudflare ダッシュボード → Settings → Environment Variables に `ANTHROPIC_API_KEY` を設定

## ローカル開発
```bash
cp .dev.vars.example .dev.vars   # APIキーを設定
npm install
npm run dev                       # Vite + Pages Functions 同時起動
```
