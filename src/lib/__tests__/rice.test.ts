import { describe, expect, it } from "vitest";

import { COMPACT_FARE_META, COMPACT_FARE_TABLE } from "@/data/compact-fare-table";
import { SAME_PREFECTURE_FARES } from "@/data/fare-table";
import { ORIGIN } from "@/data/origin";
import { PREFECTURES, findPrefectureByName } from "@/data/prefectures";
import {
  RICE_PRODUCTS,
  RICE_VARIETIES,
  findRiceProduct,
  productsOfVariety,
} from "@/data/rice-products";
import { calculateRiceShipping, quoteRiceShipping } from "@/lib/fare";

function raw(overrides: Record<string, string> = {}) {
  return {
    destinationPrefectureCode: "13", // 東京都
    productId: "koshihikari-4_5kg",
    quantity: "1",
    ...overrides,
  };
}

describe("お米の選択肢データ", () => {
  it("品種は コシヒカリ と あさひの夢 の 2 つ", () => {
    expect(RICE_VARIETIES.map((v) => v.label)).toEqual([
      "コシヒカリ",
      "あさひの夢",
    ]);
  });

  it("コシヒカリは配送できる 6 種類", () => {
    expect(productsOfVariety("koshihikari").map((p) => p.label)).toEqual([
      "1キロ",
      "3キロ",
      "4.5キロ",
      "9.5キロ",
      "精米26キロ",
      "玄米30キロ",
    ]);
  });

  it("あさひの夢は配送できる 3 種類（精米26キロ・玄米30キロは配送不可）", () => {
    expect(productsOfVariety("asahinoyume").map((p) => p.label)).toEqual([
      "3キロ",
      "4.5キロ",
      "9.5キロ",
    ]);
  });

  /** 出典: https://213nouen.com/prices */
  it.each([
    ["koshihikari-1kg", 800, "compact", null],
    ["koshihikari-3kg", 1800, "takkyubin", 80],
    ["koshihikari-4_5kg", 2700, "takkyubin", 80],
    ["koshihikari-9_5kg", 5400, "takkyubin", 100],
    ["koshihikari-seimai26kg", 14000, "takkyubin", 180],
    ["koshihikari-genmai30kg", 13500, "takkyubin", 180],
    ["asahinoyume-3kg", 1380, "takkyubin", 80],
    ["asahinoyume-4_5kg", 2070, "takkyubin", 80],
    ["asahinoyume-9_5kg", 4200, "takkyubin", 100],
  ] as const)("%s は %d 円・%s・サイズ %s", (id, price, kind, size) => {
    const product = findRiceProduct(id);
    expect(product).not.toBeNull();
    expect(product!.priceYen).toBe(price);
    expect(product!.shipping.kind).toBe(kind);
    if (product!.shipping.kind === "takkyubin") {
      expect(product!.shipping.size).toBe(size);
    }
  });

  it("id はすべて一意", () => {
    const ids = RICE_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("存在しない id は null", () => {
    expect(findRiceProduct("koshihikari-999kg")).toBeNull();
  });
});

/**
 * 期待値は公式運賃（関東発・税込・現金）と にいみ農園の値段一覧の組み合わせ。
 * https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 * https://213nouen.com/prices
 */
describe("コシヒカリ：東京都宛て（関東）", () => {
  it.each([
    ["koshihikari-1kg", 650, 800, 1520],
    ["koshihikari-3kg", 1230, 1800, 3030],
    ["koshihikari-4_5kg", 1230, 2700, 3930],
    ["koshihikari-9_5kg", 1530, 5400, 6930],
    ["koshihikari-seimai26kg", 3680, 14000, 17680],
    ["koshihikari-genmai30kg", 3680, 13500, 17180],
  ] as const)(
    "%s は送料 %d 円・お米 %d 円・合計 %d 円",
    (productId, fare, price, total) => {
      const result = quoteRiceShipping(raw({ productId }));
      expect(result.status).toBe("ok");
      if (result.status !== "ok") return;
      expect(result.unitFareYen).toBe(fare);
      expect(result.productSubtotalYen).toBe(price);
      expect(result.grandTotalYen).toBe(total);
    },
  );
});

describe("あさひの夢：東京都宛て（関東）", () => {
  it.each([
    ["asahinoyume-3kg", 1230, 1380, 2610],
    ["asahinoyume-4_5kg", 1230, 2070, 3300],
    ["asahinoyume-9_5kg", 1530, 4200, 5730],
  ] as const)(
    "%s は送料 %d 円・お米 %d 円・合計 %d 円",
    (productId, fare, price, total) => {
      const result = quoteRiceShipping(raw({ productId }));
      expect(result.status).toBe("ok");
      if (result.status !== "ok") return;
      expect(result.unitFareYen).toBe(fare);
      expect(result.productSubtotalYen).toBe(price);
      expect(result.grandTotalYen).toBe(total);
    },
  );
});

describe("同一都道府県内運賃（栃木県宛て）", () => {
  it("発送元は栃木県に固定されている", () => {
    expect(ORIGIN.prefecture.name).toBe("栃木県");
  });

  it.each([
    ["koshihikari-3kg", 1090],
    ["koshihikari-4_5kg", 1090],
    ["koshihikari-9_5kg", 1410],
    ["koshihikari-seimai26kg", 3030],
    ["koshihikari-genmai30kg", 3030],
  ] as const)("%s は県内運賃 %d 円", (productId, fare) => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: "09", productId }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.samePrefecture).toBe(true);
    expect(result.unitFareYen).toBe(fare);
  });

  it("県内のほうが関東（他県）より安い", () => {
    const inside = quoteRiceShipping(raw({ destinationPrefectureCode: "09" }));
    const outside = quoteRiceShipping(raw({ destinationPrefectureCode: "13" }));
    expect(inside.status).toBe("ok");
    expect(outside.status).toBe("ok");
    if (inside.status !== "ok" || outside.status !== "ok") return;
    expect(inside.unitFareYen).toBeLessThan(outside.unitFareYen);
  });

  it("宅急便コンパクトには県内割引がない（県内も関東も 650 円）", () => {
    const inside = quoteRiceShipping(
      raw({ destinationPrefectureCode: "09", productId: "koshihikari-1kg" }),
    );
    const outside = quoteRiceShipping(
      raw({ destinationPrefectureCode: "13", productId: "koshihikari-1kg" }),
    );
    expect(inside.status).toBe("ok");
    expect(outside.status).toBe("ok");
    if (inside.status !== "ok" || outside.status !== "ok") return;
    expect(inside.unitFareYen).toBe(650);
    expect(outside.unitFareYen).toBe(650);
    expect(inside.samePrefecture).toBe(false);
  });

  it("同一都道府県内運賃は公式の値と一致する", () => {
    expect(SAME_PREFECTURE_FARES).toEqual({
      60: 790,
      80: 1090,
      100: 1410,
      120: 1730,
      140: 2090,
      160: 2410,
      180: 3030,
      200: 3690,
    });
  });
});

/** にいみ農園の値段一覧ページに載っている計算例と一致すること */
describe("値段一覧ページの計算例との照合", () => {
  it("コシヒカリ4.5キロを栃木県内へ＝3,790円", () => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: "09", productId: "koshihikari-4_5kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.grandTotalYen).toBe(3790);
  });

  it("コシヒカリ1キロを関東へ＝1,520円（送料650＋箱代70）", () => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: "13", productId: "koshihikari-1kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unitFareYen).toBe(650);
    expect(result.unitBoxYen).toBe(70);
    expect(result.grandTotalYen).toBe(1520);
  });
});

describe("宅急便コンパクト（1キロ）", () => {
  it.each([
    ["13", "東京都", 650],
    ["01", "北海道", 870],
    ["27", "大阪府", 710],
    ["34", "広島県", 760],
    ["47", "沖縄県", 870],
  ] as const)("%s（%s）宛ては送料 %d 円", (code, _name, fare) => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: code, productId: "koshihikari-1kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unitFareYen).toBe(fare);
    expect(result.grandTotalYen).toBe(800 + fare + 70);
  });

  it("サイズ区分を持たず、箱代がかかる", () => {
    const result = quoteRiceShipping(raw({ productId: "koshihikari-1kg" }));
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.size).toBeNull();
    expect(result.basis).toBe("none");
    expect(result.unitBoxYen).toBe(COMPACT_FARE_META.boxPriceYen);
  });

  it("全 47 都道府県ぶんのコンパクト運賃が登録されている", () => {
    for (const prefecture of PREFECTURES) {
      expect(COMPACT_FARE_TABLE.kanto?.[prefecture.region]).toBeTypeOf("number");
    }
  });
});

describe("宅急便の選択肢：他地域", () => {
  it("北海道宛て 精米26キロ は 180 サイズ・送料 5,220 円", () => {
    const result = quoteRiceShipping(
      raw({
        destinationPrefectureCode: "01",
        productId: "koshihikari-seimai26kg",
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.size).toBe(180);
    expect(result.unitFareYen).toBe(5220);
    expect(result.grandTotalYen).toBe(14000 + 5220);
  });

  it("沖縄県宛て 玄米30キロ は 180 サイズ・送料 7,210 円", () => {
    const result = quoteRiceShipping(
      raw({
        destinationPrefectureCode: "47",
        productId: "koshihikari-genmai30kg",
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unitFareYen).toBe(7210);
    expect(result.grandTotalYen).toBe(13500 + 7210);
  });

  it("玄米30キロは重量が 30kg を超えても規格外にならない（箱の大きさで判定）", () => {
    const result = quoteRiceShipping(
      raw({ productId: "koshihikari-genmai30kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.size).toBe(180);
    expect(result.basis).toBe("product");
  });
});

describe("個数", () => {
  it("3 個ならお米代金も送料も 3 倍になる", () => {
    const result = quoteRiceShipping(raw({ quantity: "3" }));
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.productSubtotalYen).toBe(2700 * 3);
    expect(result.totalFareYen).toBe(1230 * 3);
    expect(result.grandTotalYen).toBe(2700 * 3 + 1230 * 3);
  });

  it("コンパクトは箱代も個数ぶんかかる", () => {
    const result = quoteRiceShipping(
      raw({ productId: "koshihikari-1kg", quantity: "5" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.totalBoxYen).toBe(70 * 5);
    expect(result.grandTotalYen).toBe(800 * 5 + 650 * 5 + 70 * 5);
  });

  it("個数 0・101・小数はエラー", () => {
    for (const quantity of ["0", "101", "1.5"]) {
      expect(quoteRiceShipping(raw({ quantity })).status).toBe("invalidInput");
    }
  });
});

describe("入力エラー", () => {
  it("お米の量が未選択ならエラー", () => {
    const result = quoteRiceShipping(raw({ productId: "" }));
    expect(result.status).toBe("invalidInput");
    if (result.status === "invalidInput") {
      expect(result.errors.productId).toBeTruthy();
    }
  });

  it("配送できない選択肢の id はエラー（あさひの夢の精米26キロなど）", () => {
    for (const productId of [
      "asahinoyume-seimai26kg",
      "asahinoyume-genmai30kg",
      "5kg",
      "10kg",
    ]) {
      expect(quoteRiceShipping(raw({ productId })).status).toBe("invalidInput");
    }
  });

  it("都道府県が未選択ならエラー", () => {
    const result = quoteRiceShipping(raw({ destinationPrefectureCode: "" }));
    expect(result.status).toBe("invalidInput");
  });
});

describe("料金データが存在しない場合", () => {
  it("宅急便：金額を捏造せず fareUnavailable を返す", () => {
    const destination = findPrefectureByName("東京都")!;
    const product = findRiceProduct("koshihikari-4_5kg")!;
    const result = calculateRiceShipping(
      { destination, product, quantity: 1 },
      { table: {}, samePrefectureFares: null },
    );
    expect(result.status).toBe("fareUnavailable");
    if (result.status === "fareUnavailable") expect(result.size).toBe(80);
  });

  it("コンパクト：金額を捏造せず fareUnavailable を返す", () => {
    const destination = findPrefectureByName("東京都")!;
    const product = findRiceProduct("koshihikari-1kg")!;
    const result = calculateRiceShipping(
      { destination, product, quantity: 1 },
      { compactTable: {} },
    );
    expect(result.status).toBe("fareUnavailable");
    if (result.status === "fareUnavailable") {
      expect(result.size).toBeNull();
      expect(result.serviceLabel).toBe("宅急便コンパクト");
    }
  });
});
