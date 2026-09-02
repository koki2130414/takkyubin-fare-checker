import { describe, expect, it } from "vitest";

import { SIZE_SPECS, judgeSize, type PackageMeasurements } from "@/lib/size";

/** 3 辺合計が sum になる寸法を作る（1 辺が 170cm を超えないよう分散させる） */
function measurementsForSum(sum: number, weightKg: number): PackageMeasurements {
  const third = Math.round((sum / 3) * 100) / 100;
  return {
    lengthCm: third,
    widthCm: third,
    heightCm: Math.round((sum - third * 2) * 100) / 100,
    weightKg,
  };
}

describe("judgeSize：サイズ区分の境界値", () => {
  it.each(SIZE_SPECS.map((spec) => [spec.size, spec.maxDimensionSumCm, spec.maxWeightKg] as const))(
    "%i サイズ：3 辺合計 %icm ちょうど・重量 %ikg ちょうどは %i サイズ",
    (size, maxSum, maxWeight) => {
      const result = judgeSize(measurementsForSum(maxSum, maxWeight));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.size).toBe(size);
        expect(result.dimensionSumCm).toBeCloseTo(maxSum, 2);
      }
    },
  );

  it.each([
    [60.1, 80],
    [80.1, 100],
    [100.1, 120],
    [120.1, 140],
    [140.1, 160],
    [160.1, 180],
    [180.1, 200],
  ] as const)("3 辺合計 %fcm（軽量）は %i サイズ", (sum, expected) => {
    const result = judgeSize(measurementsForSum(sum, 1));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(expected);
  });

  it.each([
    [2.1, 80],
    [5.1, 100],
    [10.1, 120],
    [15.1, 140],
    [20.1, 160],
    [25.1, 180],
  ] as const)("3 辺合計 30cm・重量 %fkg は %i サイズ", (weight, expected) => {
    const result = judgeSize(measurementsForSum(30, weight));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(expected);
  });
});

describe("judgeSize：寸法と重量の大きい方を採用する", () => {
  it("3 辺合計 75cm・3kg は 80 サイズ（寸法側が大きい）", () => {
    const result = judgeSize({
      lengthCm: 30,
      widthCm: 25,
      heightCm: 20,
      weightKg: 3,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dimensionSumCm).toBe(75);
      expect(result.sizeByDimension).toBe(80);
      expect(result.sizeByWeight).toBe(80);
      expect(result.size).toBe(80);
    }
  });

  it("3 辺合計 75cm・7kg は 100 サイズ（重量側が大きい）", () => {
    const result = judgeSize({
      lengthCm: 30,
      widthCm: 25,
      heightCm: 20,
      weightKg: 7,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sizeByDimension).toBe(80);
      expect(result.sizeByWeight).toBe(100);
      expect(result.size).toBe(100);
    }
  });

  it("3 辺合計 150cm・1kg は 160 サイズ（寸法側が大きい）", () => {
    const result = judgeSize({
      lengthCm: 60,
      widthCm: 50,
      heightCm: 40,
      weightKg: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sizeByDimension).toBe(160);
      expect(result.sizeByWeight).toBe(60);
      expect(result.size).toBe(160);
    }
  });

  it("3 辺合計 50cm・30kg は 180 サイズ（重量側が大きい）", () => {
    const result = judgeSize({
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      weightKg: 30,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(180);
  });
});

describe("judgeSize：規格外", () => {
  it("3 辺合計が 200cm を超えると規格外", () => {
    const result = judgeSize({
      lengthCm: 70,
      widthCm: 70,
      heightCm: 60.1,
      weightKg: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("sumOver200");
      expect(result.dimensionSumCm).toBeCloseTo(200.1, 2);
    }
  });

  it("重量が 30kg を超えると規格外", () => {
    const result = judgeSize({
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      weightKg: 30.1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("weightOver30");
  });

  it("1 辺が 170cm を超えると規格外", () => {
    const result = judgeSize({
      lengthCm: 170.1,
      widthCm: 5,
      heightCm: 5,
      weightKg: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("sideOver170");
  });

  it("1 辺 170cm ちょうどは規格内", () => {
    const result = judgeSize({
      lengthCm: 170,
      widthCm: 5,
      heightCm: 5,
      weightKg: 5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.size).toBe(180);
  });

  it.each([
    ["0", { lengthCm: 0, widthCm: 20, heightCm: 20, weightKg: 3 }],
    ["負数", { lengthCm: -10, widthCm: 20, heightCm: 20, weightKg: 3 }],
    ["重量 0", { lengthCm: 10, widthCm: 20, heightCm: 20, weightKg: 0 }],
  ] as const)("%s は規格外（nonPositive）", (_label, measurements) => {
    const result = judgeSize(measurements);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("nonPositive");
  });

  it.each([
    ["NaN", { lengthCm: Number.NaN, widthCm: 20, heightCm: 20, weightKg: 3 }],
    [
      "Infinity",
      { lengthCm: Number.POSITIVE_INFINITY, widthCm: 20, heightCm: 20, weightKg: 3 },
    ],
  ] as const)("%s は規格外（invalidNumber）", (_label, measurements) => {
    const result = judgeSize(measurements);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalidNumber");
      expect(result.dimensionSumCm).toBeNull();
    }
  });
});
