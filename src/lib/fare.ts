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
  SAME_PREFECTURE_FARES,
  type FareRow,
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
 * 発送地域 × 配送先地域 × サイズ で宅急便の税込運賃を引く（地帯別運賃）。
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

export type TakkyubinFareResult = {
  readonly fareYen: number;
  /** 同一都道府県内運賃が適用されたか */
  readonly samePrefecture: boolean;
};

/**
 * 発地の都道府県も見て宅急便の運賃を決める。
 * 発着が同じ都道府県なら、地帯別運賃より安い「同一都道府県内運賃」を使う。
 */
export function resolveTakkyubinFare(
  origin: Prefecture,
  destination: Prefecture,
  size: TakkyubinSize,
  table: FareTable = FARE_TABLE,
  samePrefectureFares: FareRow | null = SAME_PREFECTURE_FARES,
): TakkyubinFareResult | null {
  if (origin.code === destination.code && samePrefectureFares) {
    const fare = samePrefectureFares[size];
    if (typeof fare === "number" && Number.isFinite(fare)) {
      return { fareYen: fare, samePrefecture: true };
    }
  }
  const fare = lookupFare(origin.region, destination.region, size, table);
  return fare === null ? null : { fareYen: fare, samePrefecture: false };
}

/**
 * 発送地域 × 配送先地域 で宅急便コンパクトの税込運賃を引く。
 * 宅急便コンパクトにサイズ区分も同一都道府県内割引もない。未設定なら null。
 */
export function lookupCompactFare(
  originRegion: RegionCode,
  destinationRegion: RegionCode,
  table: CompactFareTable = COMPACT_FARE_TABLE,
): number | null {
  const fare = table[originRegion]?.[destinationRegion];
  return typeof fare === "number" && Number.isFinite(fare) ? fare : null;
}

/** サイズの決まり方 */
export type SizeBasis = "dimensions" | "product" | "none";

export type ShippingQuoteOk = {
  readonly status: "ok";
  readonly originLabel: string;
  readonly originPrefecture: Prefecture;
  readonly originRegion: RegionCode;
  readonly originRegionLabel: string;
  readonly destination: Prefecture;
  readonly destinationRegionLabel: string;
  /** 同一都道府県内運賃が適用されたか */
  readonly samePrefecture: boolean;
  readonly service: ShippingService;
  readonly serviceLabel: string;
  /** 宅急便のサイズ区分。宅急便コンパクトでは null。 */
  readonly size: TakkyubinSize | null;
  readonly basis: SizeBasis;
  /** 寸法モードのときのみ入る */
  readonly dimensionSumCm: number | null;
  readonly weightKg: number | null;
  readonly unitFareYen: number;
  readonly quantity: number;
  /** 送料の合計（＝ unitFareYen × quantity） */
  readonly totalFareYen: number;
  /** 1 個あたりの箱代（宅急便コンパクトの専用BOX）。かからなければ 0。 */
  readonly unitBoxYen: number;
  /** 箱代の合計 */
  readonly totalBoxYen: number;
  /** お米の選択肢から計算した場合のみ入る */
  readonly product: RiceProduct | null;
  /** 商品代金の合計。お米モード以外は null。 */
  readonly productSubtotalYen: number | null;
  /** 商品代金 ＋ 送料 ＋ 箱代。お米モード以外は null。 */
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
  readonly originPrefecture?: Prefecture;
  readonly originLabel?: string;
  readonly table?: FareTable;
  readonly meta?: FareTableMeta;
  readonly compactTable?: CompactFareTable;
  readonly compactMeta?: CompactFareMeta;
  /** null にすると同一都道府県内運賃を使わない（テスト用） */
  readonly samePrefectureFares?: FareRow | null;
};

function resolveOptions(options: QuoteOptions) {
  const originPrefecture = options.originPrefecture ?? ORIGIN.prefecture;
  return {
    originPrefecture,
    originRegion: originPrefecture.region,
    originLabel: options.originLabel ?? ORIGIN.label,
    table: options.table ?? FARE_TABLE,
    meta: options.meta ?? FARE_TABLE_META,
    compactTable: options.compactTable ?? COMPACT_FARE_TABLE,
    compactMeta: options.compactMeta ?? COMPACT_FARE_META,
    samePrefectureFares:
      options.samePrefectureFares === undefined
        ? SAME_PREFECTURE_FARES
        : options.samePrefectureFares,
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
  const {
    originPrefecture,
    originRegion,
    originLabel,
    table,
    meta,
    samePrefectureFares,
  } = resolveOptions(options);

  const judgement = judgeSize(params.measurements);
  if (!judgement.ok) {
    return {
      status: "outOfSpec",
      reason: judgement.reason,
      message: judgement.message,
      dimensionSumCm: judgement.dimensionSumCm,
    };
  }

  const fare = resolveTakkyubinFare(
    originPrefecture,
    params.destination,
    judgement.size,
    table,
    samePrefectureFares,
  );

  if (fare === null) {
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
    originPrefecture,
    originRegion,
    originRegionLabel: REGION_LABELS[originRegion],
    destination: params.destination,
    destinationRegionLabel: REGION_LABELS[params.destination.region],
    samePrefecture: fare.samePrefecture,
    service: "takkyubin",
    serviceLabel: SHIPPING_SERVICE_LABELS.takkyubin,
    size: judgement.size,
    basis: "dimensions",
    dimensionSumCm: judgement.dimensionSumCm,
    weightKg: params.measurements.weightKg,
    unitFareYen: fare.fareYen,
    quantity: params.quantity,
    totalFareYen: fare.fareYen * params.quantity,
    unitBoxYen: 0,
    totalBoxYen: 0,
    product: null,
    productSubtotalYen: null,
    grandTotalYen: null,
    meta,
  };
}

/**
 * お米の選択肢から送料と合計金額を計算する。
 *
 * サイズ区分は重量から推測せず、選択肢に設定された箱の大きさをそのまま使う。
 * 宅急便コンパクトは専用BOXを使うためサイズ区分がなく、運賃は地域だけで決まり、
 * 送料とは別に箱代がかかる。
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
    originPrefecture,
    originRegion,
    originLabel,
    table,
    meta,
    compactTable,
    compactMeta,
    samePrefectureFares,
  } = resolveOptions(options);

  const { product, quantity } = params;
  const serviceLabel = SHIPPING_SERVICE_LABELS[product.shipping.kind];
  const productSubtotalYen = product.priceYen * quantity;

  const common = {
    status: "ok" as const,
    originLabel,
    originPrefecture,
    originRegion,
    originRegionLabel: REGION_LABELS[originRegion],
    destination: params.destination,
    destinationRegionLabel: REGION_LABELS[params.destination.region],
    service: product.shipping.kind,
    serviceLabel,
    dimensionSumCm: null,
    weightKg: null,
    quantity,
    product,
    productSubtotalYen,
  };

  if (product.shipping.kind === "compact") {
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

    const totalFareYen = unitFareYen * quantity;
    const unitBoxYen = compactMeta.boxPriceYen;
    const totalBoxYen = unitBoxYen * quantity;

    return {
      ...common,
      samePrefecture: false,
      size: null,
      basis: "none",
      unitFareYen,
      totalFareYen,
      unitBoxYen,
      totalBoxYen,
      grandTotalYen: productSubtotalYen + totalFareYen + totalBoxYen,
      meta: compactMeta,
    };
  }

  const { size } = product.shipping;
  const fare = resolveTakkyubinFare(
    originPrefecture,
    params.destination,
    size,
    table,
    samePrefectureFares,
  );

  if (fare === null) {
    return {
      status: "fareUnavailable",
      destination: params.destination,
      serviceLabel,
      size,
      dimensionSumCm: null,
      originRegion,
      meta,
    };
  }

  const totalFareYen = fare.fareYen * quantity;
  return {
    ...common,
    samePrefecture: fare.samePrefecture,
    size,
    basis: "product",
    unitFareYen: fare.fareYen,
    totalFareYen,
    unitBoxYen: 0,
    totalBoxYen: 0,
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
