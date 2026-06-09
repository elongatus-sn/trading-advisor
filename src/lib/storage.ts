import type { TradeRecord } from "../types";

const STORAGE_KEY = "trading_advisor_records";

export function loadRecords(): TradeRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecord(record: TradeRecord): void {
  const records = loadRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
