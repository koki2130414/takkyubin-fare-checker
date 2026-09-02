/**
 * 宅急便のサイズ判定（純粋関数）。
 * UI からは独立しており、DOM にもネットワークにも依存しません。
 *
 * 規格の出典:
 * https://www.kuronekoyamato.co.jp/ytc/customer/send/search/payment/size/
 */

import { TAKKYUBIN_SIZES, type TakkyubinSize } from "@/data/fare-table";

export type SizeSpec = {
  readonly size: TakkyubinSize;
  /** 3 辺合計の上限（cm） */
  readonly maxDimensionSumCm: number;
  /** 実重量の上限（kg） */
  readonly maxWeightKg: number;
};

/** サイズ区分の規格（小さい順） */
export const SIZE_SPECS: readonly SizeSpec[] = [
  { size: 60, maxDimensionSumCm: 60, maxWeightKg: 2 },
  { size: 80, maxDimensionSumCm: 80, maxWeightKg: 5 },
  { size: 100, maxDimensionSumCm: 100, maxWeightKg: 10 },
  { size: 120, maxDimensionSumCm: 120, maxWeightKg: 15 },
  { size: 140, maxDimensionSumCm: 140, maxWeightKg: 20 },
  { size: 160, maxDimensionSumCm: 160, maxWeightKg: 25 },
  { size: 180, maxDimensionSumCm: 180, maxWeightKg: 30 },
  { size: 200, maxDimensionSumCm: 200, maxWeightKg: 30 },
];

/** 宅急便で扱える 3 辺合計の上限（cm） */
export const MAX_DIMENSION_SUM_CM = 200;
/** 宅急便で扱える重量の上限（kg） */
export const MAX_WEIGHT_KG = 30;
/** 1 辺の長さの上限（cm） */
export const MAX_SINGLE_SIDE_CM = 170;
/** 上下逆さまにできないなど輸送状態に定めがある荷物の 1 辺の上限（cm） */
export const RESTRICTED_ORIENTATION_MAX_SIDE_CM = 100;

export type PackageMeasurements = {
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly weightKg: number;
};

/** 宅急便の規格外となる理由 */
export type OutOfSpecReason =
  | "invalidNumber"
  | "nonPositive"
  | "sideOver170"
  | "sumOver200"
  | "weightOver30";

/** 規格外理由の日本語メッセージ */
export const OUT_OF_SPEC_MESSAGES: Readonly<Record<OutOfSpecReason, string>> = {
  invalidNumber:
    "寸法・重量に数値として正しくない値が入力されています。半角数字で入力してください。",
  nonPositive: "寸法・重量には 0 より大きい数値を入力してください。",
  sideOver170: `1 辺が ${MAX_SINGLE_SIDE_CM}cm を超えているため、宅急便の規格外です。`,
  sumOver200: `3 辺合計が ${MAX_DIMENSION_SUM_CM}cm を超えているため、宅急便の規格外です。`,
  weightOver30: `重量が ${MAX_WEIGHT_KG}kg を超えているため、宅急便の規格外です。`,
};

export type SizeJudgement =
  | {
      readonly ok: true;
      /** 適用されるサイズ区分 */
      readonly size: TakkyubinSize;
      readonly dimensionSumCm: number;
      /** 3 辺合計だけで決まるサイズ区分 */
      readonly sizeByDimension: TakkyubinSize;
      /** 重量だけで決まるサイズ区分 */
      readonly sizeByWeight: TakkyubinSize;
    }
  | {
      readonly ok: false;
      readonly reason: OutOfSpecReason;
      readonly message: string;
      readonly dimensionSumCm: number | null;
    };

/** 浮動小数点の誤差で境界値がずれないよう、小数第 2 位に丸める */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isUsableNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/** 3 辺合計（cm）。数値として不正な場合は null。 */
export function dimensionSum(m: PackageMeasurements): number | null {
  if (
    !isUsableNumber(m.lengthCm) ||
    !isUsableNumber(m.widthCm) ||
    !isUsableNumber(m.heightCm)
  ) {
    return null;
  }
  return round2(m.lengthCm + m.widthCm + m.heightCm);
}

/** 3 辺合計から決まるサイズ区分。上限超過なら null。 */
export function sizeByDimensionSum(sumCm: number): TakkyubinSize | null {
  const spec = SIZE_SPECS.find((s) => sumCm <= s.maxDimensionSumCm);
  return spec ? spec.size : null;
}

/** 実重量から決まるサイズ区分。上限超過なら null。 */
export function sizeByWeight(weightKg: number): TakkyubinSize | null {
  const spec = SIZE_SPECS.find((s) => weightKg <= s.maxWeightKg);
  return spec ? spec.size : null;
}

/**
 * 3 辺合計と実重量を比較し、より大きいサイズ区分を適用する。
 * 規格外の場合は理由を返す。
 */
export function judgeSize(m: PackageMeasurements): SizeJudgement {
  const values = [m.lengthCm, m.widthCm, m.heightCm, m.weightKg];

  if (!values.every(isUsableNumber)) {
    return {
      ok: false,
      reason: "invalidNumber",
      message: OUT_OF_SPEC_MESSAGES.invalidNumber,
      dimensionSumCm: null,
    };
  }

  if (!values.every((v) => v > 0)) {
    return {
      ok: false,
      reason: "nonPositive",
      message: OUT_OF_SPEC_MESSAGES.nonPositive,
      dimensionSumCm: null,
    };
  }

  const sides = [m.lengthCm, m.widthCm, m.heightCm];
  if (sides.some((side) => round2(side) > MAX_SINGLE_SIDE_CM)) {
    return {
      ok: false,
      reason: "sideOver170",
      message: OUT_OF_SPEC_MESSAGES.sideOver170,
      dimensionSumCm: dimensionSum(m),
    };
  }

  const sumCm = dimensionSum(m) as number;
  if (sumCm > MAX_DIMENSION_SUM_CM) {
    return {
      ok: false,
      reason: "sumOver200",
      message: OUT_OF_SPEC_MESSAGES.sumOver200,
      dimensionSumCm: sumCm,
    };
  }

  const weight = round2(m.weightKg);
  if (weight > MAX_WEIGHT_KG) {
    return {
      ok: false,
      reason: "weightOver30",
      message: OUT_OF_SPEC_MESSAGES.weightOver30,
      dimensionSumCm: sumCm,
    };
  }

  const bySum = sizeByDimensionSum(sumCm);
  const byWeight = sizeByWeight(weight);

  // 直前のガードにより両方とも null にはならないが、型のために防御的に扱う。
  if (bySum === null || byWeight === null) {
    return {
      ok: false,
      reason: bySum === null ? "sumOver200" : "weightOver30",
      message:
        bySum === null
          ? OUT_OF_SPEC_MESSAGES.sumOver200
          : OUT_OF_SPEC_MESSAGES.weightOver30,
      dimensionSumCm: sumCm,
    };
  }

  const applied = (bySum >= byWeight ? bySum : byWeight) as TakkyubinSize;

  return {
    ok: true,
    size: applied,
    dimensionSumCm: sumCm,
    sizeByDimension: bySum,
    sizeByWeight: byWeight,
  };
}

export type WeightSizeJudgement =
  | {
      readonly ok: true;
      readonly size: TakkyubinSize;
      readonly weightKg: number;
    }
  | {
      readonly ok: false;
      readonly reason: OutOfSpecReason;
      readonly message: string;
    };

/**
 * 実重量だけからサイズ区分を判定する。
 *
 * 箱の寸法が分かっている場合は judgeSize を使うこと。
 * こちらは「箱込み○キロ」のように重量しか分からない場合の判定で、
 * 箱が大きいときは実際にはもう 1 つ上のサイズ区分になることがある。
 */
export function judgeSizeByWeight(weightKg: number): WeightSizeJudgement {
  if (!isUsableNumber(weightKg)) {
    return {
      ok: false,
      reason: "invalidNumber",
      message: OUT_OF_SPEC_MESSAGES.invalidNumber,
    };
  }
  if (weightKg <= 0) {
    return {
      ok: false,
      reason: "nonPositive",
      message: OUT_OF_SPEC_MESSAGES.nonPositive,
    };
  }

  const weight = round2(weightKg);
  const size = sizeByWeight(weight);
  if (size === null) {
    return {
      ok: false,
      reason: "weightOver30",
      message: OUT_OF_SPEC_MESSAGES.weightOver30,
    };
  }

  return { ok: true, size, weightKg: weight };
}

/** 型ガード用（テストや UI で利用） */
export function isTakkyubinSize(value: number): value is TakkyubinSize {
  return (TAKKYUBIN_SIZES as readonly number[]).includes(value);
}
