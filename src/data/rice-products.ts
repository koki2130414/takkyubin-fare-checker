/**
 * 注文フォーム「ご希望のお米の量」の選択肢データ。
 *
 * ============================================================================
 * 商品の追加・削除・価格改定は、このファイルの RICE_PRODUCTS だけを更新します。
 * 更新手順は README.md の「お米の選択肢の更新方法」を参照してください。
 * ============================================================================
 *
 * 配送サービスは選択肢ごとに異なります。
 *  - takkyubin … 通常の宅急便。`grossWeightKg`（箱込みの発送重量）から
 *                サイズ区分を判定します（src/lib/size.ts の judgeSizeByWeight）。
 *  - compact   … 宅急便コンパクト。専用BOXを使うためサイズ区分はなく、
 *                運賃は配送先の地域だけで決まります。
 *
 * 注文フォームにある「※直接受け取り」の選択肢は配送しないため、
 * ここには含めていません（送料が発生しないため）。
 */

/** 配送に使うサービス */
export type ShippingService = "takkyubin" | "compact";

export const SHIPPING_SERVICE_LABELS: Readonly<
  Record<ShippingService, string>
> = {
  takkyubin: "宅急便",
  compact: "宅急便コンパクト",
};

export type RiceProduct = {
  /** 内部で使う識別子（フォームの選択肢と 1 対 1） */
  readonly id: string;
  /** 画面に出す名前 */
  readonly label: string;
  /** 配送に使うサービス */
  readonly service: ShippingService;
  /**
   * 発送時の重量（kg）。
   * service が "takkyubin" のときだけサイズ区分の判定に使います。
   * "compact" では運賃計算に使いませんが、目安として保持します。
   */
  readonly grossWeightKg: number;
  /** 商品代金（円）。送料は含まない。 */
  readonly priceYen: number;
  /** 補足（「精米すると26キロくらい」など）。不要なら省略。 */
  readonly note?: string;
};

export const RICE_PRODUCTS: readonly RiceProduct[] = [
  {
    id: "1kg",
    label: "1キロ",
    service: "compact",
    grossWeightKg: 1,
    priceYen: 800,
  },
  {
    id: "5kg",
    label: "箱込み5キロ",
    service: "takkyubin",
    grossWeightKg: 5,
    priceYen: 2700,
  },
  {
    id: "10kg",
    label: "箱込み10キロ",
    service: "takkyubin",
    grossWeightKg: 10,
    priceYen: 5400,
  },
  {
    id: "30kg",
    label: "箱込み30キロ",
    service: "takkyubin",
    grossWeightKg: 30,
    priceYen: 16200,
    note: "精米すると26キロくらいになります",
  },
  {
    id: "genmai30kg",
    label: "箱込み玄米30キロ",
    service: "takkyubin",
    grossWeightKg: 30,
    priceYen: 13000,
  },
];

export const RICE_PRODUCT_META = {
  /** 選択肢の出どころ */
  source: "注文フォーム「ご希望のお米の量」",
  /** このデータを更新した日（YYYY-MM-DD） */
  updatedOn: "2026-10-29",
} as const;

const BY_ID = new Map(RICE_PRODUCTS.map((product) => [product.id, product]));

/** id からお米の選択肢を引く。見つからなければ null。 */
export function findRiceProduct(id: string): RiceProduct | null {
  return BY_ID.get(id) ?? null;
}
