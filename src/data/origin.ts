/** 本サイトの発送元（固定）。 */
import { findPrefectureByName, type Prefecture, type RegionCode } from "./prefectures";

const originPrefecture = findPrefectureByName("栃木県");

if (!originPrefecture) {
  throw new Error("発送元の都道府県データが見つかりません。");
}

export const ORIGIN: {
  readonly prefecture: Prefecture;
  readonly city: string;
  readonly region: RegionCode;
  readonly label: string;
} = {
  prefecture: originPrefecture,
  city: "下野市",
  region: originPrefecture.region, // = "kanto"（運賃区分：関東発）
  label: "栃木県 下野市",
};
