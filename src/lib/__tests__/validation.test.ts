import { describe, expect, it } from "vitest";

import { formatDateJa, formatNumber, formatYen } from "@/lib/format";
import { normalizePostalCode } from "@/lib/postal";
import {
  MAX_QUANTITY,
  buildInputSignature,
  parseNumericField,
  validateShippingInput,
  type RawShippingInput,
} from "@/lib/validation";

function raw(overrides: Partial<RawShippingInput> = {}): RawShippingInput {
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

describe("parseNumericField", () => {
  it.each([
    ["30", 30],
    ["3.5", 3.5],
    ["３０", 30],
    [" 30 ", 30],
    ["1,000", 1000],
  ] as const)("%s を %f として解釈する", (input, expected) => {
    expect(parseNumericField(input)).toBe(expected);
  });

  it.each(["", "abc", "1e3", "--5", "10cm"] as const)(
    "%s は NaN",
    (input) => {
      expect(Number.isNaN(parseNumericField(input))).toBe(true);
    },
  );
});

describe("validateShippingInput", () => {
  it("正しい入力は検証を通る", () => {
    const result = validateShippingInput(raw());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.destination.name).toBe("東京都");
      expect(result.value.measurements.weightKg).toBe(3);
      expect(result.value.quantity).toBe(1);
    }
  });

  it("空欄はエラーになる", () => {
    const result = validateShippingInput(
      raw({ lengthCm: "", weightKg: "", quantity: "" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.lengthCm).toBeTruthy();
      expect(result.errors.weightKg).toBeTruthy();
      expect(result.errors.quantity).toBeTruthy();
    }
  });

  it("0 と負数はエラーになる", () => {
    const result = validateShippingInput(raw({ widthCm: "0", heightCm: "-5" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.widthCm).toBeTruthy();
      expect(result.errors.heightCm).toBeTruthy();
    }
  });

  it("数値でない入力（NaN になる文字列）はエラーになる", () => {
    const result = validateShippingInput(raw({ lengthCm: "たて30" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lengthCm).toBeTruthy();
  });

  it("存在しない都道府県コードはエラーになる", () => {
    const result = validateShippingInput(raw({ destinationPrefectureCode: "99" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.destinationPrefectureCode).toBeTruthy();
  });

  it("個数は 1〜100 の整数のみ許可する", () => {
    expect(validateShippingInput(raw({ quantity: "0" })).ok).toBe(false);
    expect(validateShippingInput(raw({ quantity: "1.5" })).ok).toBe(false);
    expect(
      validateShippingInput(raw({ quantity: String(MAX_QUANTITY) })).ok,
    ).toBe(true);
    expect(
      validateShippingInput(raw({ quantity: String(MAX_QUANTITY + 1) })).ok,
    ).toBe(false);
  });
});

describe("buildInputSignature：入力変更後に古い結果を無効化する", () => {
  const form = {
    ...raw(),
    postalCode: "3290492",
    city: "下野市",
    town: "",
    building: "",
  };

  it("同じ入力なら同じ署名になる（結果は有効なまま）", () => {
    expect(buildInputSignature({ ...form })).toBe(buildInputSignature({ ...form }));
  });

  it.each([
    ["destinationPrefectureCode", "01"],
    ["lengthCm", "40"],
    ["weightKg", "9"],
    ["quantity", "2"],
    ["town", "笹原26"],
  ] as const)("%s を変更すると署名が変わる（再計算が必要）", (key, value) => {
    const before = buildInputSignature({ ...form });
    const after = buildInputSignature({ ...form, [key]: value });
    expect(after).not.toBe(before);
  });
});

describe("normalizePostalCode", () => {
  it.each([
    ["3290492", "3290492"],
    ["329-0492", "3290492"],
    ["３２９０４９２", "3290492"],
  ] as const)("%s は %s に正規化される", (input, expected) => {
    expect(normalizePostalCode(input)).toBe(expected);
  });

  it.each(["", "123", "12345678", "abcdefg"] as const)(
    "%s は不正な郵便番号",
    (input) => {
      expect(normalizePostalCode(input)).toBeNull();
    },
  );
});

describe("表示整形", () => {
  it("金額は 3 桁区切りで ¥ 付き", () => {
    expect(formatYen(1230)).toBe("¥1,230");
    expect(formatYen(123000)).toBe("¥123,000");
    expect(formatYen(940)).toBe("¥940");
  });

  it("数値の 3 桁区切り", () => {
    expect(formatNumber(1234.5, 2)).toBe("1,234.5");
  });

  it("日付は日本語表記", () => {
    expect(formatDateJa("2025-10-01")).toBe("2025年10月1日");
    expect(formatDateJa(null)).toBe("未設定");
  });
});
