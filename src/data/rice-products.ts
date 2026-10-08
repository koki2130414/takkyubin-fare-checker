/**
 * 注文フォーム「ご希望のお米の量」の選択肢データ。
 *
 * ============================================================================
 * 商品の追加・削除・価格改定は、このファイルの RICE_PRODUCTS だけを更新します。
 * 更新手順は README.md の「お米の選択肢の更新方法」を参照してください。
 * ============================================================================
 *
 * 「箱込み」は箱を含んだ発送時の重量です。宅急便のサイズ区分は
 * この箱込み重量をもとに判定します（src/lib/size.ts の judgeSizeByWeight）。
 *
 * 注文フォームにある「※直接受け取り」の選択肢は配送しないため、
 * ここには含めていません（送料が発生しないため）。
 */

export type RiceProduct = {
  /** 内部で使う識別子（フォームの選択肢と 1 対 1） */
  readonly id: string;
  /** 画面に出す名前 */
  readonly label: string;
  /** 箱を含んだ発送重量（kg） */
  readonly grossWeightKg: number;
  /** 商品代金（円）。送料は含まない。 */
  readonly priceYen: number;
  /** 補足（「精米すると26キロくらい」など）。不要なら省略。 */
  readonly note?: string;
};

export const RICE_PRODUCTS: readonly RiceProduct[] = [
  { id: "5kg", label: "箱込み5キロ", grossWeightKg: 5, priceYen: 2700 },
  { id: "10kg", label: "箱込み10キロ", grossWeightKg: 10, priceYen: 5400 },
  {
    id: "30kg",
    label: "箱込み30キロ",
    grossWeightKg: 30,
    priceYen: 16200,
    note: "精米すると26キロくらいになります",
  },
  {
    id: "genmai30kg",
    label: "箱込み玄米30キロ",
    grossWeightKg: 30,
    priceYen: 13000,
  },
];

export const RICE_PRODUCT_META = {
  /** 選択肢の出どころ */
  source: "注文フォーム「ご希望のお米の量」",
  /** このデータを更新した日（YYYY-MM-DD） */
  updatedOn: "2026-10-08",
} as const;

const BY_ID = new Map(RICE_PRODUCTS.map((product) => [product.id, product]));

/** id からお米の選択肢を引く。見つからなければ null。 */
export function findRiceProduct(id: string): RiceProduct | null {
  return BY_ID.get(id) ?? null;
}
