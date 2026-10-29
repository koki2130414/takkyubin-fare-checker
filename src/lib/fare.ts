/**
 * 送料計算（純粋関数）。
 * 料金データ・サイズ判定・バリデーションを組み合わせるだけで、
 * UI や DOM、ネットワークには一切依存しません。
 */

import {
  COMPACT_FARE_META,
  COMPACT_FARE_TABLE,
  type CompactFareMeta,
  type CompactFareTable,
} from "@/data/compact-fare-table";
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
  SHIPPING_SERVICE_LABELS,
  type RiceProduct,
  type ShippingService,
} from "@/data/rice-products";
import {
  judgeSize,
  judgeSizeByWeight,
  type OutOfSpecReason,
  type PackageMeasurements,
} from "./size";
import {
  validateRiceInput,
  validateShippingInput,
  type RawRiceInput,
  type RawShippingInput,
  type RiceValidationErrors,
  type ValidationErrors,
} from "./validation";

/** 画面に出す料金データのメタ情報（宅急便・宅急便コンパクト共通で使える形） */
export type FareMeta = FareTableMeta | CompactFareMeta;

/**
 * 発送地域 × 配送先地域 × サイズ で宅急便の税込運賃を引く。
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

/**
 * 発送地域 × 配送先地域 で宅急便コンパクトの税込運賃を引く。
 * 宅急便コンパクトにサイズ区分はない。未設定なら null。
 */
export function lookupCompactFare(
  originRegion: RegionCode,
  destinationRegion: RegionCode,
  table: CompactFareTable = COMPACT_FARE_TABLE,
): number | null {
  const fare = table[originRegion]?.[destinationRegion];
  return typeof fare === "number" && Number.isFinite(fare) ? fare : null;
}

/** サイズ判定の根拠 */
export type SizeBasis = "dimensions" | "weight" | "none";

export type ShippingQuoteOk = {
  readonly status: "ok";
  readonly originLabel: string;
  readonly originRegion: RegionCode;
  readonly originRegionLabel: string;
  readonly destination: Prefecture;
  readonly destinationRegionLabel: string;
  /** 配送に使うサービス */
  readonly service: ShippingService;
  readonly serviceLabel: string;
  /** 宅急便のサイズ区分。宅急便コンパクトでは null。 */
  readonly size: TakkyubinSize | null;
  readonly basis: SizeBasis;
  /** 寸法から計算した場合のみ入る */
  readonly dimensionSumCm: number | null;
  readonly sizeByDimension: TakkyubinSize | null;
  readonly sizeByWeight: TakkyubinSize | null;
  readonly weightKg: number;
  readonly unitFareYen: number;
  readonly quantity: number;
  /** 送料の合計（＝ unitFareYen × quantity） */
  readonly totalFareYen: number;
  /** お米の選択肢から計算した場合のみ入る */
  readonly product: RiceProduct | null;
  /** 商品代金の合計。お米モード以外は null。 */
  readonly productSubtotalYen: number | null;
  /** 商品代金 ＋ 送料。お米モード以外は null。 */
  readonly grandTotalYen: number | null;
  readonly meta: FareMeta;
};

export type ShippingQuote =
  | ShippingQuoteOk
  | {
      readonly status: "invalidInput";
      readonly errors: ValidationErrors & RiceValidationErrors;
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
      readonly serviceLabel: string;
      readonly size: TakkyubinSize | null;
      readonly dimensionSumCm: number | null;
      readonly originRegion: RegionCode;
      readonly meta: FareMeta;
    };

export type QuoteOptions = {
  readonly originRegion?: RegionCode;
  readonly originLabel?: string;
  readonly table?: FareTable;
  readonly meta?: FareTableMeta;
  readonly compactTable?: CompactFareTable;
  readonly compactMeta?: CompactFareMeta;
};

function resolveOptions(options: QuoteOptions) {
  return {
    originRegion: options.originRegion ?? ORIGIN.region,
    originLabel: options.originLabel ?? ORIGIN.label,
    table: options.table ?? FARE_TABLE,
    meta: options.meta ?? FARE_TABLE_META,
    compactTable: options.compactTable ?? COMPACT_FARE_TABLE,
    compactMeta: options.compactMeta ?? COMPACT_FARE_META,
  };
}

/**
 * 寸法と重量から宅急便の送料を計算する。
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
  const { originRegion, originLabel, table, meta } = resolveOptions(options);

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
      serviceLabel: SHIPPING_SERVICE_LABELS.takkyubin,
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
    service: "takkyubin",
    serviceLabel: SHIPPING_SERVICE_LABELS.takkyubin,
    size: judgement.size,
    basis: "dimensions",
    dimensionSumCm: judgement.dimensionSumCm,
    sizeByDimension: judgement.sizeByDimension,
    sizeByWeight: judgement.sizeByWeight,
    weightKg: params.measurements.weightKg,
    unitFareYen,
    quantity: params.quantity,
    totalFareYen: unitFareYen * params.quantity,
    product: null,
    productSubtotalYen: null,
    grandTotalYen: null,
    meta,
  };
}

/**
 * お米の選択肢から送料と合計金額を計算する。
 *
 * - 宅急便の選択肢は、寸法が分からないため箱込み重量だけでサイズ区分を判定する。
 * - 宅急便コンパクトの選択肢は、専用BOXを使うためサイズ区分がなく、
 *   運賃は配送先の地域だけで決まる。
 */
export function calculateRiceShipping(
  params: {
    readonly destination: Prefecture;
    readonly product: RiceProduct;
    readonly quantity: number;
  },
  options: QuoteOptions = {},
): ShippingQuote {
  const {
    originRegion,
    originLabel,
    table,
    meta,
    compactTable,
    compactMeta,
  } = resolveOptions(options);

  const { product } = params;
  const serviceLabel = SHIPPING_SERVICE_LABELS[product.service];

  const common = {
    status: "ok" as const,
    originLabel,
    originRegion,
    originRegionLabel: REGION_LABELS[originRegion],
    destination: params.destination,
    destinationRegionLabel: REGION_LABELS[params.destination.region],
    service: product.service,
    serviceLabel,
    dimensionSumCm: null,
    sizeByDimension: null,
    quantity: params.quantity,
    product,
  };

  const productSubtotalYen = product.priceYen * params.quantity;

  if (product.service === "compact") {
    const unitFareYen = lookupCompactFare(
      originRegion,
      params.destination.region,
      compactTable,
    );

    if (unitFareYen === null) {
      return {
        status: "fareUnavailable",
        destination: params.destination,
        serviceLabel,
        size: null,
        dimensionSumCm: null,
        originRegion,
        meta: compactMeta,
      };
    }

    const totalFareYen = unitFareYen * params.quantity;
    return {
      ...common,
      size: null,
      basis: "none",
      sizeByWeight: null,
      weightKg: product.grossWeightKg,
      unitFareYen,
      totalFareYen,
      productSubtotalYen,
      grandTotalYen: productSubtotalYen + totalFareYen,
      meta: compactMeta,
    };
  }

  const judgement = judgeSizeByWeight(product.grossWeightKg);
  if (!judgement.ok) {
    return {
      status: "outOfSpec",
      reason: judgement.reason,
      message: judgement.message,
      dimensionSumCm: null,
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
      serviceLabel,
      size: judgement.size,
      dimensionSumCm: null,
      originRegion,
      meta,
    };
  }

  const totalFareYen = unitFareYen * params.quantity;
  return {
    ...common,
    size: judgement.size,
    basis: "weight",
    sizeByWeight: judgement.size,
    weightKg: judgement.weightKg,
    unitFareYen,
    totalFareYen,
    productSubtotalYen,
    grandTotalYen: productSubtotalYen + totalFareYen,
    meta,
  };
}

/** フォームの生入力（寸法モード）から、検証 → 計算までを一気に行う */
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

/** フォームの生入力（お米の量モード）から、検証 → 計算までを一気に行う */
export function quoteRiceShipping(
  raw: RawRiceInput,
  options: QuoteOptions = {},
): ShippingQuote {
  const validation = validateRiceInput(raw);
  if (!validation.ok) {
    return { status: "invalidInput", errors: validation.errors };
  }
  return calculateRiceShipping(validation.value, options);
}
