/**
 * 都道府県 と ヤマト運輸の運賃地域区分（発地・着地の「地帯」）の対応データ。
 *
 * 出典: ヤマト運輸「宅急便運賃一覧表：全国一覧（現金でのお支払い）」
 *       https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 *
 * このファイルは「都道府県 → 地域区分」の対応のみを持ち、金額は持ちません。
 * 金額は src/data/fare-table.ts を参照してください。
 */

/** 運賃計算で使う地域区分（地帯）のコード */
export type RegionCode =
  | "hokkaido"
  | "kitaTohoku"
  | "minamiTohoku"
  | "kanto"
  | "shinetsu"
  | "hokuriku"
  | "chubu"
  | "kansai"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa";

/** 画面表示用の地域名 */
export const REGION_LABELS: Readonly<Record<RegionCode, string>> = {
  hokkaido: "北海道",
  kitaTohoku: "北東北",
  minamiTohoku: "南東北",
  kanto: "関東",
  shinetsu: "信越",
  hokuriku: "北陸",
  chubu: "中部",
  kansai: "関西",
  chugoku: "中国",
  shikoku: "四国",
  kyushu: "九州",
  okinawa: "沖縄",
};

export type Prefecture = {
  /** JIS 都道府県コード（2桁ゼロ埋め） */
  readonly code: string;
  readonly name: string;
  readonly region: RegionCode;
};

/** 全47都道府県。code は JIS X 0401 の都道府県コード。 */
export const PREFECTURES: readonly Prefecture[] = [
  { code: "01", name: "北海道", region: "hokkaido" },
  { code: "02", name: "青森県", region: "kitaTohoku" },
  { code: "03", name: "岩手県", region: "kitaTohoku" },
  { code: "04", name: "宮城県", region: "minamiTohoku" },
  { code: "05", name: "秋田県", region: "kitaTohoku" },
  { code: "06", name: "山形県", region: "minamiTohoku" },
  { code: "07", name: "福島県", region: "minamiTohoku" },
  { code: "08", name: "茨城県", region: "kanto" },
  { code: "09", name: "栃木県", region: "kanto" },
  { code: "10", name: "群馬県", region: "kanto" },
  { code: "11", name: "埼玉県", region: "kanto" },
  { code: "12", name: "千葉県", region: "kanto" },
  { code: "13", name: "東京都", region: "kanto" },
  { code: "14", name: "神奈川県", region: "kanto" },
  { code: "15", name: "新潟県", region: "shinetsu" },
  { code: "16", name: "富山県", region: "hokuriku" },
  { code: "17", name: "石川県", region: "hokuriku" },
  { code: "18", name: "福井県", region: "hokuriku" },
  { code: "19", name: "山梨県", region: "kanto" },
  { code: "20", name: "長野県", region: "shinetsu" },
  { code: "21", name: "岐阜県", region: "chubu" },
  { code: "22", name: "静岡県", region: "chubu" },
  { code: "23", name: "愛知県", region: "chubu" },
  { code: "24", name: "三重県", region: "chubu" },
  { code: "25", name: "滋賀県", region: "kansai" },
  { code: "26", name: "京都府", region: "kansai" },
  { code: "27", name: "大阪府", region: "kansai" },
  { code: "28", name: "兵庫県", region: "kansai" },
  { code: "29", name: "奈良県", region: "kansai" },
  { code: "30", name: "和歌山県", region: "kansai" },
  { code: "31", name: "鳥取県", region: "chugoku" },
  { code: "32", name: "島根県", region: "chugoku" },
  { code: "33", name: "岡山県", region: "chugoku" },
  { code: "34", name: "広島県", region: "chugoku" },
  { code: "35", name: "山口県", region: "chugoku" },
  { code: "36", name: "徳島県", region: "shikoku" },
  { code: "37", name: "香川県", region: "shikoku" },
  { code: "38", name: "愛媛県", region: "shikoku" },
  { code: "39", name: "高知県", region: "shikoku" },
  { code: "40", name: "福岡県", region: "kyushu" },
  { code: "41", name: "佐賀県", region: "kyushu" },
  { code: "42", name: "長崎県", region: "kyushu" },
  { code: "43", name: "熊本県", region: "kyushu" },
  { code: "44", name: "大分県", region: "kyushu" },
  { code: "45", name: "宮崎県", region: "kyushu" },
  { code: "46", name: "鹿児島県", region: "kyushu" },
  { code: "47", name: "沖縄県", region: "okinawa" },
];

const PREFECTURE_BY_CODE = new Map(PREFECTURES.map((p) => [p.code, p]));
const PREFECTURE_BY_NAME = new Map(PREFECTURES.map((p) => [p.name, p]));

/** 都道府県コードから都道府県を引く。見つからなければ null。 */
export function findPrefectureByCode(code: string): Prefecture | null {
  return PREFECTURE_BY_CODE.get(code) ?? null;
}

/** 都道府県名から都道府県を引く。見つからなければ null。 */
export function findPrefectureByName(name: string): Prefecture | null {
  return PREFECTURE_BY_NAME.get(name) ?? null;
}
