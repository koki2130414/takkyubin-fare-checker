"use client";

import { useId, useMemo, useRef, useState, type FormEvent } from "react";

import { ORIGIN } from "@/data/origin";
import { PREFECTURES } from "@/data/prefectures";
import { quoteShipping, type ShippingQuote } from "@/lib/fare";
import {
  POSTAL_API_DOC_URL,
  POSTAL_API_NAME,
  lookupPostalCode,
} from "@/lib/postal";
import { MAX_QUANTITY, MIN_QUANTITY, buildInputSignature } from "@/lib/validation";
import { ResultCard } from "./ResultCard";

type FormState = {
  postalCode: string;
  destinationPrefectureCode: string;
  city: string;
  town: string;
  building: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  quantity: string;
};

const INITIAL_STATE: FormState = {
  postalCode: "",
  destinationPrefectureCode: "",
  city: "",
  town: "",
  building: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  weightKg: "",
  quantity: "1",
};

type PostalStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const FIELD_CLASS =
  "w-full min-w-0 rounded-lg border border-navy-200 bg-white px-3 py-3 text-base text-navy-900 placeholder:text-navy-400 focus:border-navy-600";

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

export function FareCalculator() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteSignature, setQuoteSignature] = useState<string | null>(null);
  const [postalStatus, setPostalStatus] = useState<PostalStatus>({
    kind: "idle",
  });
  const abortRef = useRef<AbortController | null>(null);
  const ids = useId();

  const fieldId = (name: string) => `${ids}-${name}`;

  const currentSignature = useMemo(() => buildInputSignature(form), [form]);
  const isStale = quote !== null && quoteSignature !== currentSignature;

  const errors =
    quote && quote.status === "invalidInput" && !isStale ? quote.errors : {};

  const update = (name: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = quoteShipping({
      destinationPrefectureCode: form.destinationPrefectureCode,
      lengthCm: form.lengthCm,
      widthCm: form.widthCm,
      heightCm: form.heightCm,
      weightKg: form.weightKg,
      quantity: form.quantity,
    });
    setQuote(result);
    setQuoteSignature(currentSignature);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setForm(INITIAL_STATE);
    setQuote(null);
    setQuoteSignature(null);
    setPostalStatus({ kind: "idle" });
  };

  const handlePostalLookup = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPostalStatus({ kind: "loading" });

    const result = await lookupPostalCode(form.postalCode, {
      signal: controller.signal,
    });

    if (controller.signal.aborted && controller.signal.reason === "external") {
      return;
    }

    if (result.ok) {
      setForm((prev) => ({
        ...prev,
        destinationPrefectureCode: result.prefectureCode,
        city: result.city,
      }));
      setPostalStatus({
        kind: "done",
        message: `${result.prefectureName} ${result.city} を入力しました。`,
      });
    } else {
      setPostalStatus({ kind: "error", message: result.message });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* お届け先 */}
        <section
          aria-labelledby="destination-heading"
          className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2
            id="destination-heading"
            className="text-lg font-bold text-navy-900"
          >
            お届け先
          </h2>
          <p className="mt-1 text-sm text-navy-700">
            {"送料の計算に必要なのは"}
            <strong>都道府県</strong>
            {"だけです。郵便番号から自動入力もできます。"}
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor={fieldId("postal")}
                className="block text-sm font-bold text-navy-900"
              >
                郵便番号（任意）
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                <input
                  id={fieldId("postal")}
                  name="postalCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="例：3290492"
                  maxLength={8}
                  value={form.postalCode}
                  onChange={(e) => update("postalCode")(e.target.value)}
                  aria-describedby={fieldId("postal-help")}
                  className={`${FIELD_CLASS} flex-1 basis-40`}
                />
                <button
                  type="button"
                  onClick={handlePostalLookup}
                  disabled={postalStatus.kind === "loading"}
                  className="min-h-12 shrink-0 rounded-lg border border-navy-600 px-4 py-2 text-sm font-bold text-navy-800 hover:bg-navy-50 disabled:opacity-60"
                >
                  {postalStatus.kind === "loading" ? "検索中…" : "住所を自動入力"}
                </button>
              </div>
              <p
                id={fieldId("postal-help")}
                className="mt-1 text-xs text-navy-700"
              >
                ハイフンありでも入力できます。自動入力に失敗しても、下の都道府県を手動で選べます。
              </p>
              <p
                aria-live="polite"
                className={`mt-1 text-sm ${
                  postalStatus.kind === "error"
                    ? "font-medium text-red-700"
                    : "text-navy-700"
                }`}
              >
                {postalStatus.kind === "done" || postalStatus.kind === "error"
                  ? postalStatus.message
                  : ""}
              </p>
            </div>

            <div>
              <label
                htmlFor={fieldId("pref")}
                className="block text-sm font-bold text-navy-900"
              >
                都道府県
                <span className="ml-2 rounded bg-accent-200 px-1.5 py-0.5 text-xs font-bold text-accent-700">
                  必須
                </span>
              </label>
              <select
                id={fieldId("pref")}
                name="destinationPrefectureCode"
                value={form.destinationPrefectureCode}
                onChange={(e) =>
                  update("destinationPrefectureCode")(e.target.value)
                }
                aria-invalid={Boolean(errors.destinationPrefectureCode)}
                aria-describedby={
                  errors.destinationPrefectureCode
                    ? fieldId("pref-error")
                    : undefined
                }
                className={FIELD_CLASS}
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((prefecture) => (
                  <option key={prefecture.code} value={prefecture.code}>
                    {prefecture.name}
                  </option>
                ))}
              </select>
              <ErrorText
                id={fieldId("pref-error")}
                message={errors.destinationPrefectureCode}
              />
            </div>

            <div>
              <label
                htmlFor={fieldId("city")}
                className="block text-sm font-bold text-navy-900"
              >
                市区町村（任意）
              </label>
              <input
                id={fieldId("city")}
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder="例：下野市"
                value={form.city}
                onChange={(e) => update("city")(e.target.value)}
                className={`${FIELD_CLASS} mt-1`}
              />
            </div>

            <details className="rounded-lg border border-navy-100 bg-navy-50 p-3">
              <summary className="cursor-pointer text-sm font-bold text-navy-800">
                町名・番地、建物名を入力する（送料計算には不要）
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    htmlFor={fieldId("town")}
                    className="block text-sm font-bold text-navy-900"
                  >
                    町名・番地（任意）
                  </label>
                  <input
                    id={fieldId("town")}
                    name="town"
                    type="text"
                    autoComplete="address-line1"
                    placeholder="例：笹原26"
                    value={form.town}
                    onChange={(e) => update("town")(e.target.value)}
                    className={`${FIELD_CLASS} mt-1`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={fieldId("building")}
                    className="block text-sm font-bold text-navy-900"
                  >
                    建物名・部屋番号（任意）
                  </label>
                  <input
                    id={fieldId("building")}
                    name="building"
                    type="text"
                    autoComplete="address-line2"
                    placeholder="例：〇〇マンション101"
                    value={form.building}
                    onChange={(e) => update("building")(e.target.value)}
                    className={`${FIELD_CLASS} mt-1`}
                  />
                </div>
                <p className="text-xs text-navy-700">
                  ここに入力した内容は送料計算に使われず、外部にも送信されません。
                </p>
              </div>
            </details>
          </div>

          <p className="mt-4 rounded-lg bg-navy-50 p-3 text-xs leading-relaxed text-navy-700">
            入力された住所は保存されません（サーバー送信・Cookie・localStorage
            いずれも使用していません）。郵便番号から住所を自動入力する場合のみ、
            <a
              href={POSTAL_API_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-navy-800 underline"
            >
              {POSTAL_API_NAME}（郵便番号検索API）
            </a>
            へ郵便番号 7 桁だけを送信します。町名・番地・建物名は送信しません。
          </p>
        </section>

        {/* 荷物 */}
        <section
          aria-labelledby="package-heading"
          className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 id="package-heading" className="text-lg font-bold text-navy-900">
            荷物のサイズ・重量
          </h2>
          <p className="mt-1 text-sm text-navy-700">
            梱包後の外側の寸法（cm）と実重量（kg）を入力してください。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                { key: "lengthCm", label: "縦", unit: "cm", placeholder: "30" },
                { key: "widthCm", label: "横", unit: "cm", placeholder: "25" },
                { key: "heightCm", label: "高さ", unit: "cm", placeholder: "20" },
              ] as const
            ).map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={fieldId(field.key)}
                  className="block text-sm font-bold text-navy-900"
                >
                  {field.label}
                  <span className="ml-1 font-normal text-navy-700">
                    （{field.unit}）
                  </span>
                </label>
                <input
                  id={fieldId(field.key)}
                  name={field.key}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  placeholder={`例：${field.placeholder}`}
                  value={form[field.key]}
                  onChange={(e) => update(field.key)(e.target.value)}
                  aria-invalid={Boolean(errors[field.key])}
                  aria-describedby={
                    errors[field.key] ? fieldId(`${field.key}-error`) : undefined
                  }
                  className={`${FIELD_CLASS} mt-1`}
                />
                <ErrorText
                  id={fieldId(`${field.key}-error`)}
                  message={errors[field.key]}
                />
              </div>
            ))}

            <div>
              <label
                htmlFor={fieldId("weightKg")}
                className="block text-sm font-bold text-navy-900"
              >
                重量
                <span className="ml-1 font-normal text-navy-700">（kg）</span>
              </label>
              <input
                id={fieldId("weightKg")}
                name="weightKg"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="例：3"
                value={form.weightKg}
                onChange={(e) => update("weightKg")(e.target.value)}
                aria-invalid={Boolean(errors.weightKg)}
                aria-describedby={
                  errors.weightKg ? fieldId("weightKg-error") : undefined
                }
                className={`${FIELD_CLASS} mt-1`}
              />
              <ErrorText
                id={fieldId("weightKg-error")}
                message={errors.weightKg}
              />
            </div>

            <div>
              <label
                htmlFor={fieldId("quantity")}
                className="block text-sm font-bold text-navy-900"
              >
                個数
                <span className="ml-1 font-normal text-navy-700">（個）</span>
              </label>
              <input
                id={fieldId("quantity")}
                name="quantity"
                type="number"
                inputMode="numeric"
                min={MIN_QUANTITY}
                max={MAX_QUANTITY}
                step="1"
                placeholder="例：1"
                value={form.quantity}
                onChange={(e) => update("quantity")(e.target.value)}
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={fieldId("quantity-help")}
                className={`${FIELD_CLASS} mt-1`}
              />
              <p
                id={fieldId("quantity-help")}
                className="mt-1 text-xs text-navy-700"
              >
                {MIN_QUANTITY}〜{MAX_QUANTITY} 個
              </p>
              <ErrorText
                id={fieldId("quantity-error")}
                message={errors.quantity}
              />
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-accent-50 p-3 text-xs leading-relaxed text-navy-900">
            3 辺合計と実重量を比べて、大きい方のサイズ区分を適用します（例：3
            辺合計 75cm・3kg なら 80 サイズ、3 辺合計 75cm・7kg なら 100
            サイズ）。複数個の場合は、すべて同じサイズ・同じ配送先として計算します。
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="min-h-14 flex-1 rounded-xl bg-navy-800 px-6 text-lg font-bold text-white hover:bg-navy-700"
          >
            送料を計算する
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-14 rounded-xl border-2 border-navy-200 bg-white px-6 text-base font-bold text-navy-800 hover:bg-navy-50 sm:w-40"
          >
            リセット
          </button>
        </div>
      </form>

      <section aria-labelledby="result-heading" aria-live="polite">
        <h2 id="result-heading" className="sr-only">
          計算結果
        </h2>
        {quote === null ? (
          <p className="rounded-xl border border-dashed border-navy-200 bg-white p-4 text-sm text-navy-700">
            お届け先と荷物の情報を入力して「送料を計算する」を押してください。
          </p>
        ) : isStale ? (
          <p className="rounded-xl border border-amber-400 bg-accent-50 p-4 text-sm font-bold text-navy-900">
            入力内容が変更されました。「送料を計算する」を押して再計算してください。
          </p>
        ) : (
          <ResultCard quote={quote} />
        )}
      </section>

      <p className="text-xs text-navy-700">
        発送元は{ORIGIN.label}（運賃区分：関東発）に固定されています。
      </p>
    </div>
  );
}
