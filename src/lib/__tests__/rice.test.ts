import { describe, expect, it } from "vitest";

import { findPrefectureByName } from "@/data/prefectures";
import { RICE_PRODUCTS, findRiceProduct } from "@/data/rice-products";
import { calculateRiceShipping, quoteRiceShipping } from "@/lib/fare";
import { judgeSizeByWeight } from "@/lib/size";

function raw(overrides: Record<string, string> = {}) {
  return {
    destinationPrefectureCode: "13",
    productId: "10kg",
    quantity: "1",
    ...overrides,
  };
}

describe("お米の選択肢データ", () => {
  it("注文フォームの配送対象（箱込み）4種類がある", () => {
    expect(RICE_PRODUCTS.map((p) => p.label)).toEqual([
      "箱込み5キロ",
      "箱込み10キロ",
      "箱込み30キロ",
      "箱込み玄米30キロ",
    ]);
  });

  it.each([
    ["5kg", 5, 2700],
    ["10kg", 10, 5400],
    ["30kg", 30, 16200],
    ["genmai30kg", 30, 13000],
  ] as const)("%s は %fkg・%d 円", (id, weight, price) => {
    const product = findRiceProduct(id);
    expect(product).not.toBeNull();
    expect(product!.grossWeightKg).toBe(weight);
    expect(product!.priceYen).toBe(price);
  });

  it("箱込み30キロには精米後の注記がある", () => {
    expect(findRiceProduct("30kg")!.note).toBe("精米すると26キロくらいになります");
  });

  it("存在しない id は null", () => {
    expect(findRiceProduct("999kg")).toBeNull();
  });

  it("箱込み重量はすべて宅急便の上限 30kg 以内", () => {
    for (const product of RICE_PRODUCTS) {
      expect(product.grossWeightKg).toBeGreaterThan(0);
      expect(product.grossWeightKg).toBeLessThanOrEqual(30);
    }
  });
});

describe("judgeSizeByWeight：箱込み重量からのサイズ判定", () => {
  it.each([
    [1.5, 60],
    [2, 60],
    [2.1, 80],
    [5, 80],
    [10, 100],
    [15, 120],
    [20, 140],
    [25, 160],
    [30, 180],
  ] as const)("%fkg は %i サイズ", (weight, expected) => {
    const result = judgeSizeByWeight(weight);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(expected);
  });

  it.each([
    [30.1, "weightOver30"],
    [0, "nonPositive"],
    [-1, "nonPositive"],
    [Number.NaN, "invalidNumber"],
  ] as const)("%p は規格外（%s）", (weight, reason) => {
    const result = judgeSizeByWeight(weight);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });
});

/**
 * 期待値は公式運賃（関東発・税込・現金）とフォームのお米代金の組み合わせ。
 * https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 */
describe("quoteRiceShipping：東京都宛て（関東）", () => {
  it.each([
    ["5kg", 80, 1230, 2700, 3930],
    ["10kg", 100, 1530, 5400, 6930],
    ["30kg", 180, 3680, 16200, 19880],
    ["genmai30kg", 180, 3680, 13000, 16680],
  ] as const)(
    "%s → %i サイズ・送料 %d 円・お米 %d 円・合計 %d 円",
    (productId, size, fare, price, total) => {
      const result = quoteRiceShipping(raw({ productId }));
      expect(result.status).toBe("ok");
      if (result.status !== "ok") return;
      expect(result.size).toBe(size);
      expect(result.basis).toBe("weight");
      expect(result.dimensionSumCm).toBeNull();
      expect(result.unitFareYen).toBe(fare);
      expect(result.productSubtotalYen).toBe(price);
      expect(result.totalFareYen).toBe(fare);
      expect(result.grandTotalYen).toBe(total);
    },
  );
});

describe("quoteRiceShipping：他地域", () => {
  it("北海道宛て 箱込み10キロ は 100 サイズ・送料 2,050 円・合計 7,450 円", () => {
    const result = quoteRiceShipping(raw({ destinationPrefectureCode: "01" }));
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.size).toBe(100);
    expect(result.unitFareYen).toBe(2050);
    expect(result.grandTotalYen).toBe(5400 + 2050);
  });

  it("沖縄県宛て 箱込み30キロ は 180 サイズ・送料 7,210 円・合計 23,410 円", () => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: "47", productId: "30kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.size).toBe(180);
    expect(result.unitFareYen).toBe(7210);
    expect(result.grandTotalYen).toBe(16200 + 7210);
  });

  it("栃木県内（同一地域）宛て 箱込み5キロ は 80 サイズ・送料 1,230 円", () => {
    const result = quoteRiceShipping(
      raw({ destinationPrefectureCode: "09", productId: "5kg" }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unitFareYen).toBe(1230);
    expect(result.grandTotalYen).toBe(2700 + 1230);
  });

  it("玄米30キロと白米30キロは送料が同じで、お米の代金だけが違う", () => {
    const hakumai = quoteRiceShipping(raw({ productId: "30kg" }));
    const genmai = quoteRiceShipping(raw({ productId: "genmai30kg" }));
    expect(hakumai.status).toBe("ok");
    expect(genmai.status).toBe("ok");
    if (hakumai.status !== "ok" || genmai.status !== "ok") return;
    expect(genmai.unitFareYen).toBe(hakumai.unitFareYen);
    expect(genmai.size).toBe(hakumai.size);
    expect(genmai.grandTotalYen).toBe(
      (hakumai.grandTotalYen as number) - (16200 - 13000),
    );
  });
});

describe("quoteRiceShipping：個数", () => {
  it("3 個ならお米代金も送料も 3 倍になる", () => {
    const result = quoteRiceShipping(raw({ quantity: "3" }));
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.quantity).toBe(3);
    expect(result.productSubtotalYen).toBe(5400 * 3);
    expect(result.totalFareYen).toBe(1530 * 3);
    expect(result.grandTotalYen).toBe(5400 * 3 + 1530 * 3);
  });

  it("個数 100（上限）まで計算できる", () => {
    const result = quoteRiceShipping(raw({ quantity: "100" }));
    expect(result.status).toBe("ok");
  });

  it("個数 0・101・小数はエラー", () => {
    for (const quantity of ["0", "101", "1.5"]) {
      const result = quoteRiceShipping(raw({ quantity }));
      expect(result.status).toBe("invalidInput");
    }
  });
});

describe("quoteRiceShipping：入力エラー", () => {
  it("お米の量が未選択ならエラー", () => {
    const result = quoteRiceShipping(raw({ productId: "" }));
    expect(result.status).toBe("invalidInput");
    if (result.status === "invalidInput") {
      expect(result.errors.productId).toBeTruthy();
    }
  });

  it("廃止された選択肢の id はエラー（直接受け取り・旧サイズ）", () => {
    for (const productId of ["1_5kg", "15kg", "20kg", "25kg"]) {
      const result = quoteRiceShipping(raw({ productId }));
      expect(result.status).toBe("invalidInput");
    }
  });

  it("都道府県が未選択ならエラー", () => {
    const result = quoteRiceShipping(raw({ destinationPrefectureCode: "" }));
    expect(result.status).toBe("invalidInput");
    if (result.status === "invalidInput") {
      expect(result.errors.destinationPrefectureCode).toBeTruthy();
    }
  });
});

describe("料金データが存在しない場合", () => {
  it("金額を捏造せず fareUnavailable を返す", () => {
    const destination = findPrefectureByName("東京都")!;
    const product = findRiceProduct("10kg")!;
    const result = calculateRiceShipping(
      { destination, product, quantity: 1 },
      { table: {} },
    );
    expect(result.status).toBe("fareUnavailable");
    if (result.status === "fareUnavailable") {
      expect(result.size).toBe(100);
    }
  });
});
