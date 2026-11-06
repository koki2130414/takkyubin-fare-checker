/**
 * にいみ農園「お米の値段一覧」のうち、配送でお届けする選択肢のデータ。
 *
 * ============================================================================
 * 品種の追加・価格改定は、このファイルの RICE_PRODUCTS だけを更新します。
 * 更新手順は README.md の「お米の選択肢の更新方法」を参照してください。
 * ============================================================================
 *
 * 出典: https://213nouen.com/prices
 *
 * 重さの表記は「お米そのものの重さ」です（箱の重さを含みません）。
 * 送料は箱の大きさで決まるため、各選択肢に使う箱を shipping に明示しています。
 * 重量から推測せず、値段一覧ページに書かれている箱の大きさをそのまま持ちます。
 *
 * 農園でお受け取りの選択肢は送料がかからないため、ここには含めていません。
 */

import type { TakkyubinSize } from "./fare-table";

export type RiceVariety = "koshihikari" | "asahinoyume";

export type VarietyInfo = {
  readonly id: RiceVariety;
  readonly label: string;
  /** 品種ごとの補足（配送できない選択肢がある場合など） */
  readonly note?: string;
};

export const RICE_VARIETIES: readonly VarietyInfo[] = [
  { id: "koshihikari", label: "コシヒカリ" },
  {
    id: "asahinoyume",
    label: "あさひの夢",
    note: "精米26キロ・玄米30キロは配送を承っておりません（農園でのお受け取りのみ）。",
  },
];

/** 配送に使うサービスと箱 */
export type ProductShipping =
  /** 通常の宅急便。size はそのまま運賃表のサイズ区分。 */
  | { readonly kind: "takkyubin"; readonly size: TakkyubinSize }
  /** 宅急便コンパクト。専用BOXを使うためサイズ区分はない。 */
  | { readonly kind: "compact" };

export type ShippingService = ProductShipping["kind"];

export const SHIPPING_SERVICE_LABELS: Readonly<
  Record<ShippingService, string>
> = {
  takkyubin: "宅急便",
  compact: "宅急便コンパクト",
};

export type RiceProduct = {
  /** 内部で使う識別子 */
  readonly id: string;
  readonly variety: RiceVariety;
  /** 画面に出す名前（お米そのものの重さ） */
  readonly label: string;
  /** お米の代金（円）。送料・箱代は含まない。 */
  readonly priceYen: number;
  /** 配送に使うサービスと箱の大きさ */
  readonly shipping: ProductShipping;
  /** 補足。不要なら省略。 */
  readonly note?: string;
};

export const RICE_PRODUCTS: readonly RiceProduct[] = [
  // ---- コシヒカリ ----
  {
    id: "koshihikari-1kg",
    variety: "koshihikari",
    label: "1キロ",
    priceYen: 800,
    shipping: { kind: "compact" },
    note: "お試しや贈り物に",
  },
  {
    id: "koshihikari-3kg",
    variety: "koshihikari",
    label: "3キロ",
    priceYen: 1800,
    shipping: { kind: "takkyubin", size: 80 },
  },
  {
    id: "koshihikari-4_5kg",
    variety: "koshihikari",
    label: "4.5キロ",
    priceYen: 2700,
    shipping: { kind: "takkyubin", size: 80 },
  },
  {
    id: "koshihikari-9_5kg",
    variety: "koshihikari",
    label: "9.5キロ",
    priceYen: 5400,
    shipping: { kind: "takkyubin", size: 100 },
  },
  {
    id: "koshihikari-seimai26kg",
    variety: "koshihikari",
    label: "精米26キロ",
    priceYen: 14000,
    shipping: { kind: "takkyubin", size: 180 },
    note: "玄米30キロ分を、ご注文をいただいてから精米してお届けします",
  },
  {
    id: "koshihikari-genmai30kg",
    variety: "koshihikari",
    label: "玄米30キロ",
    priceYen: 13500,
    shipping: { kind: "takkyubin", size: 180 },
    note: "精米せず、玄米のままお届けします",
  },

  // ---- あさひの夢（精米26キロ・玄米30キロは配送不可のため未収録）----
  {
    id: "asahinoyume-3kg",
    variety: "asahinoyume",
    label: "3キロ",
    priceYen: 1380,
    shipping: { kind: "takkyubin", size: 80 },
  },
  {
    id: "asahinoyume-4_5kg",
    variety: "asahinoyume",
    label: "4.5キロ",
    priceYen: 2070,
    shipping: { kind: "takkyubin", size: 80 },
  },
  {
    id: "asahinoyume-9_5kg",
    variety: "asahinoyume",
    label: "9.5キロ",
    priceYen: 4200,
    shipping: { kind: "takkyubin", size: 100 },
  },
];

export const RICE_PRODUCT_META = {
  /** 選択肢と価格の出どころ */
  source: "にいみ農園 お米の値段一覧",
  sourceUrl: "https://213nouen.com/prices",
  /** このデータを更新した日（YYYY-MM-DD） */
  updatedOn: "2026-11-06",
} as const;

const BY_ID = new Map(RICE_PRODUCTS.map((product) => [product.id, product]));
const VARIETY_BY_ID = new Map(RICE_VARIETIES.map((v) => [v.id, v]));

/** id からお米の選択肢を引く。見つからなければ null。 */
export function findRiceProduct(id: string): RiceProduct | null {
  return BY_ID.get(id) ?? null;
}

/** 品種情報を引く。見つからなければ null。 */
export function findVariety(id: string): VarietyInfo | null {
  return VARIETY_BY_ID.get(id as RiceVariety) ?? null;
}

/** 指定した品種の、配送できる選択肢を返す。 */
export function productsOfVariety(
  variety: RiceVariety,
): readonly RiceProduct[] {
  return RICE_PRODUCTS.filter((product) => product.variety === variety);
}
