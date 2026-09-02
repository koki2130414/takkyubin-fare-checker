/**
 * 郵便番号から都道府県・市区町村を補完する（任意機能）。
 *
 * 利用先: zipcloud（https://zipcloud.ibsnet.co.jp/doc/api）
 *   - API キー不要、利用条件が公開されているサービス
 *   - 送信するのは「7 桁の郵便番号」のみ。町名・番地・建物名は送信しません。
 *   - 取得結果も保存しません（ブラウザのメモリ上だけで使用）。
 *
 * 失敗しても都道府県は手動で選択できるため、この機能は必須ではありません。
 */

import { findPrefectureByName } from "@/data/prefectures";
import { normalizeNumericText } from "./validation";

export const POSTAL_API_ENDPOINT = "https://zipcloud.ibsnet.co.jp/api/search";
export const POSTAL_API_NAME = "zipcloud";
export const POSTAL_API_DOC_URL = "https://zipcloud.ibsnet.co.jp/doc/api";
export const POSTAL_LOOKUP_TIMEOUT_MS = 6000;

export type PostalLookupFailure =
  | "invalidFormat"
  | "notFound"
  | "timeout"
  | "network";

export const POSTAL_LOOKUP_MESSAGES: Readonly<
  Record<PostalLookupFailure, string>
> = {
  invalidFormat: "郵便番号は 7 桁の半角数字で入力してください。",
  notFound: "該当する住所が見つかりませんでした。都道府県を選択してください。",
  timeout:
    "郵便番号の検索がタイムアウトしました。都道府県を手動で選択してください。",
  network:
    "郵便番号の検索に失敗しました。都道府県を手動で選択してください。",
};

export type PostalLookupResult =
  | {
      readonly ok: true;
      readonly prefectureCode: string;
      readonly prefectureName: string;
      readonly city: string;
    }
  | {
      readonly ok: false;
      readonly reason: PostalLookupFailure;
      readonly message: string;
    };

/** 入力された郵便番号を 7 桁の半角数字に正規化する。不正なら null。 */
export function normalizePostalCode(input: string): string | null {
  const normalized = normalizeNumericText(input ?? "").replace(/[-ー－‐]/g, "");
  return /^\d{7}$/.test(normalized) ? normalized : null;
}

function fail(reason: PostalLookupFailure): PostalLookupResult {
  return { ok: false, reason, message: POSTAL_LOOKUP_MESSAGES[reason] };
}

type ZipcloudResponse = {
  status?: number;
  results?: Array<{
    prefcode?: string;
    address1?: string;
    address2?: string;
    address3?: string;
  }> | null;
};

/**
 * 郵便番号から住所を検索する。
 * 送信されるのは郵便番号 7 桁のみ。結果はどこにも保存しない。
 */
export async function lookupPostalCode(
  input: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<PostalLookupResult> {
  const zipcode = normalizePostalCode(input);
  if (!zipcode) return fail("invalidFormat");

  const timeoutMs = options.timeoutMs ?? POSTAL_LOOKUP_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);

  const onExternalAbort = () => controller.abort("external");
  options.signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(
      `${POSTAL_API_ENDPOINT}?zipcode=${encodeURIComponent(zipcode)}`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!response.ok) return fail("network");

    const json = (await response.json()) as ZipcloudResponse;
    const first = json.results?.[0];
    if (!first || !first.address1) return fail("notFound");

    const prefecture = findPrefectureByName(first.address1);
    if (!prefecture) return fail("notFound");

    return {
      ok: true,
      prefectureCode: prefecture.code,
      prefectureName: prefecture.name,
      city: `${first.address2 ?? ""}${first.address3 ?? ""}`,
    };
  } catch {
    // AbortController によるタイムアウトかどうかを判定する
    return controller.signal.reason === "timeout"
      ? fail("timeout")
      : fail("network");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}
