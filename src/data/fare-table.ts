/**
 * ヤマト運輸「宅急便」の基本運賃データ（発払い・現金でのお支払い・税込）。
 *
 * ============================================================================
 * 料金改定時は、このファイルの FARE_TABLE と FARE_TABLE_META だけを更新します。
 * 更新手順は README.md の「料金データの更新方法」を参照してください。
 * ============================================================================
 *
 * 出典（一次情報・公式サイト）:
 *   運賃: https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 *   サイズ: https://www.kuronekoyamato.co.jp/ytc/customer/send/search/payment/size/
 *
 * 収録範囲: 「関東発」の 1 行のみ（本サイトの発送元は栃木県下野市＝関東地帯に固定）。
 * 他の発地は未収録のため、参照すると「料金データ未設定」として扱われます。
 */

import type { RegionCode } from "./prefectures";

/** 宅急便のサイズ区分 */
export const TAKKYUBIN_SIZES = [60, 80, 100, 120, 140, 160, 180, 200] as const;

export type TakkyubinSize = (typeof TAKKYUBIN_SIZES)[number];

/** 1 つの発着地組み合わせにおける、サイズ別の税込運賃（円） */
export type FareRow = Readonly<Record<TakkyubinSize, number>>;

/** 発送地域 → 配送先地域 → サイズ → 税込運賃（円） */
export type FareTable = Readonly<
  Partial<Record<RegionCode, Readonly<Partial<Record<RegionCode, FareRow>>>>>
>;

/** 料金データのメタ情報（画面に表示して出典と鮮度を明示する） */
export type FareTableMeta = {
  /** 運賃表の出典 URL（公式） */
  readonly sourceUrl: string;
  /** サイズ規格の出典 URL（公式） */
  readonly sizeSourceUrl: string;
  /** 料金表の適用開始日（YYYY-MM-DD）。不明な場合は null。 */
  readonly effectiveFrom: string | null;
  /** 本データを公式サイトで確認した日（YYYY-MM-DD） */
  readonly checkedOn: string;
  /** 運賃の種類 */
  readonly fareKind: string;
  /** 税込かどうか */
  readonly taxIncluded: boolean;
  /** 補足 */
  readonly note: string;
};

export const FARE_TABLE_META: FareTableMeta = {
  sourceUrl: "https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html",
  sizeSourceUrl:
    "https://www.kuronekoyamato.co.jp/ytc/customer/send/search/payment/size/",
  effectiveFrom: "2025-10-01",
  checkedOn: "2026-09-01",
  fareKind: "宅急便 発払い・現金でのお支払いの基本運賃",
  taxIncluded: true,
  note: "割引（持込割・クロネコメンバー割・複数口減額など）およびキャッシュレス決済運賃は含みません。",
};

/**
 * 関東発の税込基本運賃（円）。
 * 数値は上記 sourceUrl の「関東発」の行をそのまま転記したものです。
 */
const KANTO_ORIGIN: Readonly<Partial<Record<RegionCode, FareRow>>> = {
  hokkaido: { 60: 1460, 80: 1740, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
  kitaTohoku: { 60: 1060, 80: 1350, 100: 1650, 120: 2170, 140: 2780, 160: 3160, 180: 4480, 200: 5410 },
  minamiTohoku: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  kanto: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  shinetsu: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  hokuriku: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  chubu: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  kansai: { 60: 1060, 80: 1350, 100: 1650, 120: 2170, 140: 2780, 160: 3160, 180: 4480, 200: 5410 },
  chugoku: { 60: 1190, 80: 1480, 100: 1790, 120: 2310, 140: 2930, 160: 3320, 180: 4900, 200: 6220 },
  shikoku: { 60: 1190, 80: 1480, 100: 1790, 120: 2310, 140: 2930, 160: 3320, 180: 4900, 200: 6220 },
  kyushu: { 60: 1460, 80: 1740, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
  okinawa: { 60: 1460, 80: 2070, 100: 2710, 120: 3360, 140: 4030, 160: 4680, 180: 7210, 200: 8860 },
};

/**
 * 発送地域 × 配送先地域 × サイズ の運賃表。
 *
 * TODO: 発送元を関東以外にも広げる場合は、公式の運賃一覧表から該当する発地の行を
 *       転記して以下に追加してください（推測値は絶対に入れないこと）。
 */
export const FARE_TABLE: FareTable = {
  kanto: KANTO_ORIGIN,
};
