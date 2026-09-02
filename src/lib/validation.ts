/**
 * 入力バリデーション（純粋関数）。
 * 画面に入力された文字列を、計算に使える値へ変換します。
 */

import {
  findPrefectureByCode,
  type Prefecture,
} from "@/data/prefectures";
import { findRiceProduct, type RiceProduct } from "@/data/rice-products";
import type { PackageMeasurements } from "./size";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 100;

/** 画面のフォームが持つ、送料計算に必要な生の入力値 */
export type RawShippingInput = {
  readonly destinationPrefectureCode: string;
  readonly lengthCm: string;
  readonly widthCm: string;
  readonly heightCm: string;
  readonly weightKg: string;
  readonly quantity: string;
};

export type ShippingField = keyof RawShippingInput;

export type ValidationErrors = Partial<Record<ShippingField, string>>;

export type ValidatedShippingInput = {
  readonly destination: Prefecture;
  readonly measurements: PackageMeasurements;
  readonly quantity: number;
};

export type ValidationResult =
  | { readonly ok: true; readonly value: ValidatedShippingInput }
  | { readonly ok: false; readonly errors: ValidationErrors };

/** 全角数字・全角ピリオド・空白を半角へ正規化する */
export function normalizeNumericText(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．｡。]/g, ".")
    .replace(/[，,]/g, "")
    .replace(/\s/g, "")
    .trim();
}

/** 数値として解釈する。解釈できない場合は NaN を返す。 */
export function parseNumericField(input: string): number {
  const normalized = normalizeNumericText(input ?? "");
  if (normalized === "") return Number.NaN;
  // 数字と小数点のみを許可（指数表記や記号混じりは弾く）
  if (!/^\d*\.?\d*$/.test(normalized)) return Number.NaN;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

type NumericFieldOptions = {
  readonly label: string;
  readonly allowDecimal?: boolean;
};

function validateNumericField(
  raw: string,
  { label, allowDecimal = true }: NumericFieldOptions,
): { value: number } | { error: string } {
  const normalized = normalizeNumericText(raw ?? "");
  if (normalized === "") {
    return { error: `${label}を入力してください。` };
  }
  const value = parseNumericField(raw);
  if (Number.isNaN(value)) {
    return { error: `${label}は半角数字で入力してください。` };
  }
  if (!allowDecimal && !Number.isInteger(value)) {
    return { error: `${label}は整数で入力してください。` };
  }
  if (value <= 0) {
    return { error: `${label}は 0 より大きい数値を入力してください。` };
  }
  return { value };
}

/** 生の入力値を検証して、計算に使える値へ変換する */
export function validateShippingInput(raw: RawShippingInput): ValidationResult {
  const errors: ValidationErrors = {};

  const destination = findPrefectureByCode(
    (raw.destinationPrefectureCode ?? "").trim(),
  );
  if (!destination) {
    errors.destinationPrefectureCode = "お届け先の都道府県を選択してください。";
  }

  const length = validateNumericField(raw.lengthCm, { label: "縦" });
  if ("error" in length) errors.lengthCm = length.error;

  const width = validateNumericField(raw.widthCm, { label: "横" });
  if ("error" in width) errors.widthCm = width.error;

  const height = validateNumericField(raw.heightCm, { label: "高さ" });
  if ("error" in height) errors.heightCm = height.error;

  const weight = validateNumericField(raw.weightKg, { label: "重量" });
  if ("error" in weight) errors.weightKg = weight.error;

  const quantity = validateNumericField(raw.quantity, {
    label: "個数",
    allowDecimal: false,
  });
  if ("error" in quantity) {
    errors.quantity = quantity.error;
  } else if (quantity.value < MIN_QUANTITY || quantity.value > MAX_QUANTITY) {
    errors.quantity = `個数は ${MIN_QUANTITY} 〜 ${MAX_QUANTITY} の範囲で入力してください。`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      destination: destination as Prefecture,
      measurements: {
        lengthCm: (length as { value: number }).value,
        widthCm: (width as { value: number }).value,
        heightCm: (height as { value: number }).value,
        weightKg: (weight as { value: number }).value,
      },
      quantity: (quantity as { value: number }).value,
    },
  };
}

/** お米の量から計算する場合の生の入力値 */
export type RawRiceInput = {
  readonly destinationPrefectureCode: string;
  readonly productId: string;
  readonly quantity: string;
};

export type RiceField = keyof RawRiceInput;

export type RiceValidationErrors = Partial<Record<RiceField, string>>;

export type ValidatedRiceInput = {
  readonly destination: Prefecture;
  readonly product: RiceProduct;
  readonly quantity: number;
};

export type RiceValidationResult =
  | { readonly ok: true; readonly value: ValidatedRiceInput }
  | { readonly ok: false; readonly errors: RiceValidationErrors };

/** お米の量からの入力を検証する */
export function validateRiceInput(raw: RawRiceInput): RiceValidationResult {
  const errors: RiceValidationErrors = {};

  const destination = findPrefectureByCode(
    (raw.destinationPrefectureCode ?? "").trim(),
  );
  if (!destination) {
    errors.destinationPrefectureCode = "お届け先の都道府県を選択してください。";
  }

  const product = findRiceProduct((raw.productId ?? "").trim());
  if (!product) {
    errors.productId = "ご希望のお米の量を選択してください。";
  }

  const quantity = validateNumericField(raw.quantity, {
    label: "個数",
    allowDecimal: false,
  });
  if ("error" in quantity) {
    errors.quantity = quantity.error;
  } else if (quantity.value < MIN_QUANTITY || quantity.value > MAX_QUANTITY) {
    errors.quantity = `個数は ${MIN_QUANTITY} 〜 ${MAX_QUANTITY} の範囲で入力してください。`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      destination: destination as Prefecture,
      product: product as RiceProduct,
      quantity: (quantity as { value: number }).value,
    },
  };
}

/**
 * 入力内容の同一性を判定するための署名。
 * 計算結果に保存しておき、現在の入力と一致しなくなったら
 * 「再計算が必要」と扱う（古い結果をそのまま見せない）。
 *
 * 送料計算に使う項目のみを対象にすると、町名・建物名を変えただけで
 * 結果が消えてしまうため、フォーム上の入力すべてを渡せるようにしている。
 */
export function buildInputSignature(raw: Record<string, string>): string {
  return Object.keys(raw)
    .sort()
    .map((key) => `${key}=${normalizeNumericText(String(raw[key] ?? ""))}`)
    .join("&");
}
