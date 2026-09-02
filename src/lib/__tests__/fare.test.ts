import { describe, expect, it } from "vitest";

import { FARE_TABLE, FARE_TABLE_META, TAKKYUBIN_SIZES } from "@/data/fare-table";
import { ORIGIN } from "@/data/origin";
import { PREFECTURES, findPrefectureByName } from "@/data/prefectures";
import { calculateShipping, lookupFare, quoteShipping } from "@/lib/fare";

/**
 * 期待値は公式の「宅急便運賃一覧表：全国一覧（現金でのお支払い）」関東発の行。
 * https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html
 * （適用開始日: 2025-10-01 / 確認日: 2026-09-01）
 */
const OFFICIAL_KANTO_ORIGIN_FARES = {
  栃木県: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  東京都: { 60: 940, 80: 1230, 100: 1530, 120: 2040, 140: 2630, 160: 3020, 180: 3680, 200: 4470 },
  北海道: { 60: 1460, 80: 1740, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
  大阪府: { 60: 1060, 80: 1350, 100: 1650, 120: 2170, 140: 2780, 160: 3160, 180: 4480, 200: 5410 },
  福岡県: { 60: 1460, 80: 1740, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
  沖縄県: { 60: 1460, 80: 2070, 100: 2710, 120: 3360, 140: 4030, 160: 4680, 180: 7210, 200: 8860 },
} as const;

function baseInput(overrides: Record<string, string> = {}) {
  return {
    destinationPrefectureCode: "13",
    lengthCm: "30",
    widthCm: "25",
    heightCm: "20",
    weightKg: "3",
    quantity: "1",
    ...overrides,
  };
}

describe("発送元", () => {
  it("栃木県下野市・関東発に固定されている", () => {
    expect(ORIGIN.prefecture.name).toBe("栃木県");
    expect(ORIGIN.city).toBe("下野市");
    expect(ORIGIN.region).toBe("kanto");
  });
});

describe("料金データ", () => {
  it("全 47 都道府県が地域区分に割り当てられている", () => {
    expect(PREFECTURES).toHaveLength(47);
    for (const prefecture of PREFECTURES) {
      expect(FARE_TABLE.kanto?.[prefecture.region]).toBeDefined();
    }
  });

  it("メタデータに出典 URL・確認日・適用開始日を持つ", () => {
    expect(FARE_TABLE_META.sourceUrl).toMatch(/^https:\/\/www\.kuronekoyamato\.co\.jp\//);
    expect(FARE_TABLE_META.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(FARE_TABLE_META.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("公式運賃との照合（関東発・税込・現金）", () => {
  for (const [prefectureName, fares] of Object.entries(
    OFFICIAL_KANTO_ORIGIN_FARES,
  )) {
    for (const size of TAKKYUBIN_SIZES) {
      it(`${prefectureName} 宛て ${size} サイズは ${fares[size]} 円`, () => {
        const prefecture = findPrefectureByName(prefectureName);
        expect(prefecture).not.toBeNull();
        expect(lookupFare(ORIGIN.region, prefecture!.region, size)).toBe(
          fares[size],
        );
      });
    }
  }
});

describe("quoteShipping", () => {
  it("栃木県内（同一地域）宛て 80 サイズは 940 円ではなく 1,230 円", () => {
    const result = quoteShipping(baseInput({ destinationPrefectureCode: "09" }));
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.destination.name).toBe("栃木県");
      expect(result.size).toBe(80);
      expect(result.unitFareYen).toBe(1230);
      expect(result.totalFareYen).toBe(1230);
    }
  });

  it("北海道宛て 80 サイズは 1,740 円", () => {
    const result = quoteShipping(baseInput({ destinationPrefectureCode: "01" }));
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.unitFareYen).toBe(1740);
  });

  it("沖縄県宛て 100 サイズは 2,710 円", () => {
    const result = quoteShipping(
      baseInput({ destinationPrefectureCode: "47", weightKg: "7" }),
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.size).toBe(100);
      expect(result.unitFareYen).toBe(2710);
    }
  });

  it("個数を掛けた合計を返す（同一サイズ・同一配送先）", () => {
    const result = quoteShipping(
      baseInput({ destinationPrefectureCode: "27", quantity: "7" }),
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.unitFareYen).toBe(1350);
      expect(result.quantity).toBe(7);
      expect(result.totalFareYen).toBe(9450);
    }
  });

  it("個数 100（上限）でも計算できる", () => {
    const result = quoteShipping(baseInput({ quantity: "100" }));
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.totalFareYen).toBe(123000);
  });

  it("個数 101 は入力エラー", () => {
    const result = quoteShipping(baseInput({ quantity: "101" }));
    expect(result.status).toBe("invalidInput");
    if (result.status === "invalidInput") {
      expect(result.errors.quantity).toBeTruthy();
    }
  });

  it("3 辺合計 200cm 超過は規格外", () => {
    const result = quoteShipping(
      baseInput({ lengthCm: "70", widthCm: "70", heightCm: "61" }),
    );
    expect(result.status).toBe("outOfSpec");
    if (result.status === "outOfSpec") expect(result.reason).toBe("sumOver200");
  });

  it("30kg 超過は規格外", () => {
    const result = quoteShipping(baseInput({ weightKg: "31" }));
    expect(result.status).toBe("outOfSpec");
    if (result.status === "outOfSpec") expect(result.reason).toBe("weightOver30");
  });

  it("1 辺 170cm 超過は規格外", () => {
    const result = quoteShipping(baseInput({ lengthCm: "171", widthCm: "5", heightCm: "5" }));
    expect(result.status).toBe("outOfSpec");
    if (result.status === "outOfSpec") expect(result.reason).toBe("sideOver170");
  });

  it("都道府県未選択は入力エラー", () => {
    const result = quoteShipping(baseInput({ destinationPrefectureCode: "" }));
    expect(result.status).toBe("invalidInput");
  });
});

describe("料金データが存在しない場合", () => {
  it("lookupFare は null を返す", () => {
    expect(lookupFare("kansai", "kanto", 60)).toBeNull();
    expect(lookupFare("kanto", "kanto", 999 as never)).toBeNull();
  });

  it("計算結果は fareUnavailable になり、金額を捏造しない", () => {
    const destination = findPrefectureByName("東京都")!;
    const result = calculateShipping(
      {
        destination,
        measurements: { lengthCm: 30, widthCm: 25, heightCm: 20, weightKg: 3 },
        quantity: 1,
      },
      { table: {} },
    );
    expect(result.status).toBe("fareUnavailable");
    if (result.status === "fareUnavailable") {
      expect(result.size).toBe(80);
      expect(result).not.toHaveProperty("unitFareYen");
    }
  });
});
