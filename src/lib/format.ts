/** 表示整形のユーティリティ（純粋関数）。 */

/** 金額を「¥1,230」形式に整形する */
export function formatYen(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

/** 数値を 3 桁区切りに整形する（単位なし） */
export function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

/** "2025-10-01" を "2025年10月1日" に整形する */
export function formatDateJa(isoDate: string | null | undefined): string {
  if (!isoDate) return "未設定";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}
