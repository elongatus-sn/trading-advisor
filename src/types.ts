export type SymbolType = "stock" | "index" | "fx";

export interface SymbolDef {
  code: string;
  label: string;
  type: SymbolType;
}

export interface QuoteData {
  code: string;
  label: string;
  type: SymbolType;
  last?: number;
  prev?: number;
  pct?: number | null;
  high?: number;
  low?: number;
  open?: number;
  vol?: number;
  range?: string | null;
  error?: string | null;
}

export interface StockAdvice {
  label: string;
  action: string;
  reason: string;
  loss_cut: string;
  target: string;
}

/** AIが提案する入れ替え候補銘柄 */
export interface StockCandidate {
  code: string;
  label: string;
  reason: string;        // 注目理由
  action: string;        // 推奨アクション名（例: 押し目買い）
  action_simple: string; // 用語の簡単な説明（例: 上昇中の下げを狙って買う）
  target: string;        // 目標値幅
  daytrade: string;      // デイトレ向けエントリー・決済の具体的提案
}

export interface FxAdvice {
  label: string;
  range_low: number;
  range_high: number;
  strategy: string;         // 策略名（例: "50銭幅リピート推奨"）
  strategy_simple: string;  // 平易な説明（例: "50銭ごとに自動で買い→売りを繰り返す"）
  note: string;             // 注意点
  daytrade: string;         // 具体的な設定方法（通貨数・利確幅・損切り目安）
}

export interface ProposalData {
  summary: string;
  stock_advice: StockAdvice[];
  stock_candidates: StockCandidate[];  // 入れ替え候補
  fx_advice: FxAdvice[];
  risk_note: string;
}

export interface DailyData {
  generatedAt: string;
  quotes: QuoteData[];
  proposal: ProposalData;
}

export interface TradeRecord {
  date: string;
  proposal: ProposalData;
  quotes: Pick<QuoteData, "label" | "code" | "pct" | "last">[];
  actualSettings: Record<string, string>;
  notes: Record<string, string>;
  memo: string;
  createdAt: string;
}

// FX は固定（UI での変更不可）
export const SYMBOLS_FX: SymbolDef[] = [
  { code: "USDJPY=X", label: "USD/JPY", type: "fx" },
  { code: "EURJPY=X", label: "EUR/JPY", type: "fx" },
  { code: "CNHJPY=X", label: "CNH/JPY", type: "fx" },
  { code: "HKDJPY=X", label: "HKD/JPY", type: "fx" },
];

// 株式・指数は Notion 設定ページで管理（以下はフォールバック用デフォルト）
export const DEFAULT_SYMBOLS_JP: SymbolDef[] = [
  { code: "7203.T", label: "トヨタ",  type: "stock" },
  { code: "6758.T", label: "ソニーG", type: "stock" },
  { code: "9984.T", label: "SBG",     type: "stock" },
  { code: "^N225",  label: "日経225", type: "index" },
];
