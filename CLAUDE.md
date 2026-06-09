# Trading Advisor — Claude Code 規約

## プロジェクト概要
松井証券での個人トレード支援ツール。売買を自動実行しない「判断支援」ツール。

## アーキテクチャ
- **フロントエンド**: React 18 + TypeScript + Vite → Cloudflare Pages（静的配信）
- **提案生成**: GitHub Actions（平日朝6時JST）が `scripts/generate-proposal.mjs` を実行
  - Yahoo Finance v8 API で株価取得
  - `@anthropic-ai/sdk` で Claude に分析依頼
  - 結果を `public/proposal.json` に保存 → git push → Cloudflare が自動デプロイ
- **APIキー**: GitHub Secrets に `ANTHROPIC_API_KEY`（`claude setup-ci` で取得）

## ディレクトリ構成
- `src/` — React フロントエンド（`/proposal.json` をフェッチして表示）
- `src/components/` — UI コンポーネント
- `src/lib/storage.ts` — localStorage ラッパー
- `src/types.ts` — 型定義・銘柄定数
- `scripts/generate-proposal.mjs` — 提案生成スクリプト（GitHub Actions から実行）
- `public/proposal.json` — 最新提案データ（Actions が毎朝更新）
- `.github/workflows/proposal.yml` — 定時実行ワークフロー

## 重要制約
- `ANTHROPIC_API_KEY` を `src/` 配下のコードに書かない
- SDK は `scripts/` 内のみで使用（フロントエンドから API を直接呼ばない）
- `generate-proposal.mjs` の `model` は `claude-sonnet-4-6` を使用

## セットアップ手順（初回）
```bash
# 1. CLIトークン取得（Claude Code のサブスクに紐づく API キー）
claude setup-ci
# → 出力されたトークンを GitHub Secrets に ANTHROPIC_API_KEY として登録

# 2. GitHub Actions を手動実行して初回データ生成
# → Actions タブ → Daily Trade Proposal → Run workflow

# 3. Cloudflare Pages に GitHub リポジトリを接続
# → dash.cloudflare.com → trading-advisor → Settings → Build → Connect to Git
```

## デプロイフロー
- GitHub Actions が `proposal.json` を更新 → git push → Cloudflare Pages が自動デプロイ
- フロントエンドのコード変更も git push で自動デプロイ

## ローカル開発
```bash
npm install
npm run dev  # Vite dev server (proposal.json は public/ から静的配信)
```
