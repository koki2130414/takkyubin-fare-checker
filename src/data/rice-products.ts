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
  /** 補足（「1回限り」など）。不要なら省略。 */
  readonly note?: string;
};

export const RICE_PRODUCTS: readonly RiceProduct[] = [
  { id: "1_5kg", label: "箱込み1.5キロ", grossWeightKg: 1.5, priceYen: 750, note: "1回限り" },
  { id: "5kg", label: "箱込み5キロ", grossWeightKg: 5, priceYen: 2250 },
  { id: "10kg", label: "箱込み10キロ", grossWeightKg: 10, priceYen: 4250 },
  { id: "15kg", label: "箱込み15キロ", grossWeightKg: 15, priceYen: 6000 },
  { id: "20kg", label: "箱込み20キロ", grossWeightKg: 20, priceYen: 8000 },
  { id: "25kg", label: "箱込み25キロ", grossWeightKg: 25, priceYen: 10000 },
  { id: "30kg", label: "箱込み30キロ", grossWeightKg: 30, priceYen: 13000 },
];

export const RICE_PRODUCT_META = {
  /** 選択肢の出どころ */
  source: "注文フォーム「ご希望のお米の量」",
  /** このデータを更新した日（YYYY-MM-DD） */
  updatedOn: "2026-09-02",
} as const;

const BY_ID = new Map(RICE_PRODUCTS.map((product) => [product.id, product]));

/** id からお米の選択肢を引く。見つからなければ null。 */
export function findRiceProduct(id: string): RiceProduct | null {
  return BY_ID.get(id) ?? null;
}
