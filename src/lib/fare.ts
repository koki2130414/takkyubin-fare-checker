/**
 * 送料計算（純粋関数）。
 * 料金データ・サイズ判定・バリデーションを組み合わせるだけで、
 * UI や DOM、ネットワークには一切依存しません。
 */

import {
  FARE_TABLE,
  FARE_TABLE_META,
  type FareTable,
  type FareTableMeta,
  type TakkyubinSize,
} from "@/data/fare-table";
import { ORIGIN } from "@/data/origin";
import { REGION_LABELS, type Prefecture, type RegionCode } from "@/data/prefectures";
import {
  judgeSize,
  type OutOfSpecReason,
  type PackageMeasurements,
} from "./size";
import {
  validateShippingInput,
  type RawShippingInput,
  type ValidationErrors,
} from "./validation";

/**
 * 発送地域 × 配送先地域 × サイズ で税込運賃を引く。
 * 料金データが未設定の場合は null を返す（推測値は返さない）。
 */
export function lookupFare(
  originRegion: RegionCode,
  destinationRegion: RegionCode,
  size: TakkyubinSize,
  table: FareTable = FARE_TABLE,
): number | null {
  const fare = table[originRegion]?.[destinationRegion]?.[size];
  return typeof fare === "number" && Number.isFinite(fare) ? fare : null;
}

export type ShippingQuote =
  | {
      readonly status: "ok";
      readonly originLabel: string;
      readonly originRegion: RegionCode;
      readonly originRegionLabel: string;
      readonly destination: Prefecture;
      readonly destinationRegionLabel: string;
      readonly size: TakkyubinSize;
      readonly dimensionSumCm: number;
      readonly weightKg: number;
      readonly sizeByDimension: TakkyubinSize;
      readonly sizeByWeight: TakkyubinSize;
      readonly unitFareYen: number;
      readonly quantity: number;
      readonly totalFareYen: number;
      readonly meta: FareTableMeta;
    }
  | {
      readonly status: "invalidInput";
      readonly errors: ValidationErrors;
    }
  | {
      readonly status: "outOfSpec";
      readonly reason: OutOfSpecReason;
      readonly message: string;
      readonly dimensionSumCm: number | null;
    }
  | {
      readonly status: "fareUnavailable";
      readonly destination: Prefecture;
      readonly size: TakkyubinSize;
      readonly dimensionSumCm: number;
      readonly originRegion: RegionCode;
      readonly meta: FareTableMeta;
    };

export type QuoteOptions = {
  readonly originRegion?: RegionCode;
  readonly originLabel?: string;
  readonly table?: FareTable;
  readonly meta?: FareTableMeta;
};

/**
 * 検証済みの値から送料を計算する。
 * すべての口数は「同一サイズ・同一配送先」として単価 × 個数で算出する。
 */
export function calculateShipping(
  params: {
    readonly destination: Prefecture;
    readonly measurements: PackageMeasurements;
    readonly quantity: number;
  },
  options: QuoteOptions = {},
): ShippingQuote {
  const originRegion = options.originRegion ?? ORIGIN.region;
  const originLabel = options.originLabel ?? ORIGIN.label;
  const table = options.table ?? FARE_TABLE;
  const meta = options.meta ?? FARE_TABLE_META;

  const judgement = judgeSize(params.measurements);
  if (!judgement.ok) {
    return {
      status: "outOfSpec",
      reason: judgement.reason,
      message: judgement.message,
      dimensionSumCm: judgement.dimensionSumCm,
    };
  }

  const unitFareYen = lookupFare(
    originRegion,
    params.destination.region,
    judgement.size,
    table,
  );

  if (unitFareYen === null) {
    return {
      status: "fareUnavailable",
      destination: params.destination,
      size: judgement.size,
      dimensionSumCm: judgement.dimensionSumCm,
      originRegion,
      meta,
    };
  }

  return {
    status: "ok",
    originLabel,
    originRegion,
    originRegionLabel: REGION_LABELS[originRegion],
    destination: params.destination,
    destinationRegionLabel: REGION_LABELS[params.destination.region],
    size: judgement.size,
    dimensionSumCm: judgement.dimensionSumCm,
    weightKg: params.measurements.weightKg,
    sizeByDimension: judgement.sizeByDimension,
    sizeByWeight: judgement.sizeByWeight,
    unitFareYen,
    quantity: params.quantity,
    totalFareYen: unitFareYen * params.quantity,
    meta,
  };
}

/** フォームの生入力から、検証 → 計算までを一気に行う */
export function quoteShipping(
  raw: RawShippingInput,
  options: QuoteOptions = {},
): ShippingQuote {
  const validation = validateShippingInput(raw);
  if (!validation.ok) {
    return { status: "invalidInput", errors: validation.errors };
  }
  return calculateShipping(validation.value, options);
}
