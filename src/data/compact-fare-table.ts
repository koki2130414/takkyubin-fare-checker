/**
 * ヤマト運輸「宅急便コンパクト」の運賃データ（発払い・現金でのお支払い・税込）。
 *
 * ============================================================================
 * 料金改定時は、このファイルの COMPACT_FARE_TABLE と COMPACT_FARE_META だけを
 * 更新します。更新手順は README.md を参照してください。
 * ============================================================================
 *
 * 出典（一次情報・公式サイト）:
 *   運賃: https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 *   サービス: https://www.kuronekoyamato.co.jp/ytc/customer/send/services/compact/
 *
 * 宅急便コンパクトは専用BOXに入る荷物が対象で、サイズ区分はありません。
 * 運賃は発送地域と配送先地域だけで決まります。
 *
 * 収録範囲: 「関東発」の 1 行のみ（本サイトの発送元は栃木県下野市＝関東地帯に固定）。
 */

import type { RegionCode } from "./prefectures";

/** 発送地域 → 配送先地域 → 税込運賃（円） */
export type CompactFareTable = Readonly<
  Partial<Record<RegionCode, Readonly<Partial<Record<RegionCode, number>>>>>
>;

export type CompactFareMeta = {
  readonly sourceUrl: string;
  readonly serviceUrl: string;
  /** 適用開始日（YYYY-MM-DD）。公式サイトに記載がない場合は null。 */
  readonly effectiveFrom: string | null;
  /** 本データを公式サイトで確認した日（YYYY-MM-DD） */
  readonly checkedOn: string;
  readonly fareKind: string;
  readonly taxIncluded: boolean;
  /** 専用BOX（専用資材）の税込価格（円）。運賃とは別にかかる。 */
  readonly boxPriceYen: number;
  readonly note: string;
};

export const COMPACT_FARE_META: CompactFareMeta = {
  sourceUrl: "https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html",
  serviceUrl:
    "https://www.kuronekoyamato.co.jp/ytc/customer/send/services/compact/",
  // 公式の消費者向け運賃一覧表に適用開始日の記載がないため未設定。
  effectiveFrom: null,
  checkedOn: "2026-10-29",
  fareKind: "宅急便コンパクト 発払い・現金でのお支払いの運賃",
  taxIncluded: true,
  boxPriceYen: 70,
  note: "専用BOX（税込70円）が別途必要です。割引やキャッシュレス決済運賃は含みません。",
};

/** 関東発の宅急便コンパクト運賃（税込・円） */
const KANTO_ORIGIN: Readonly<Partial<Record<RegionCode, number>>> = {
  hokkaido: 870,
  kitaTohoku: 710,
  minamiTohoku: 650,
  kanto: 650,
  shinetsu: 650,
  hokuriku: 650,
  chubu: 650,
  kansai: 710,
  chugoku: 760,
  shikoku: 760,
  kyushu: 870,
  okinawa: 870,
};

/**
 * 発送地域 × 配送先地域 の宅急便コンパクト運賃。
 *
 * TODO: 発送元を関東以外にも広げる場合は、公式の運賃一覧表から該当する発地の行を
 *       転記して追加してください（推測値は絶対に入れないこと）。
 */
export const COMPACT_FARE_TABLE: CompactFareTable = {
  kanto: KANTO_ORIGIN,
};
