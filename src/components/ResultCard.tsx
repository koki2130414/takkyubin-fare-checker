import type { ReactNode } from "react";

import { ORIGIN } from "@/data/origin";
import type { ShippingQuote, ShippingQuoteOk } from "@/lib/fare";
import { formatDateJa, formatNumber, formatYen } from "@/lib/format";
import { RESTRICTED_ORIENTATION_MAX_SIDE_CM } from "@/lib/size";

type Props = {
  readonly quote: ShippingQuote;
};

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-navy-100 py-2 last:border-b-0">
      <dt className="shrink-0 text-sm text-navy-700">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold break-words text-navy-900">
        {value}
      </dd>
    </div>
  );
}

/** お米代金・送料・総額を一目で比べられる内訳 */
function PriceBreakdown({ quote }: { readonly quote: ShippingQuoteOk }) {
  const hasProduct =
    quote.product !== null &&
    quote.productSubtotalYen !== null &&
    quote.grandTotalYen !== null;

  if (!hasProduct) {
    return (
      <div className="border-b-4 border-accent-400 bg-navy-50 px-4 py-5 text-center">
        <p className="text-sm text-navy-700">
          税込送料合計（{quote.quantity} 個）
        </p>
        <p className="mt-1 text-4xl leading-tight font-extrabold tracking-tight text-navy-900 tabular-nums sm:text-5xl">
          {formatYen(quote.totalFareYen)}
        </p>
        <p className="mt-2 text-sm text-navy-700">
          1 個あたり {formatYen(quote.unitFareYen)} × {quote.quantity} 個
        </p>
      </div>
    );
  }

  return (
    <div className="border-b-4 border-accent-400 bg-navy-50 px-4 py-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900">お米の代金</p>
            <p className="text-xs text-navy-700">
              {quote.product?.label} × {quote.quantity} 個
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold text-navy-900 tabular-nums sm:text-2xl">
            {formatYen(quote.productSubtotalYen as number)}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900">
              <span aria-hidden="true">＋ </span>送料
            </p>
            <p className="text-xs text-navy-700">
              {quote.size} サイズ {formatYen(quote.unitFareYen)} ×{" "}
              {quote.quantity} 個
            </p>
          </div>
          <p className="shrink-0 text-xl font-bold text-navy-900 tabular-nums sm:text-2xl">
            {formatYen(quote.totalFareYen)}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t-2 border-navy-200 pt-3 text-center">
        <p className="text-sm font-bold text-navy-700">
          お支払い総額の目安（税込）
        </p>
        <p className="mt-1 text-4xl leading-tight font-extrabold tracking-tight text-navy-900 tabular-nums sm:text-5xl">
          {formatYen(quote.grandTotalYen as number)}
        </p>
        <p className="mt-1 text-xs text-navy-700">
          {quote.destination.name}へお届けの場合
        </p>
      </div>
    </div>
  );
}

export function ResultCard({ quote }: Props) {
  if (quote.status === "invalidInput") {
    return (
      <div
        className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        role="alert"
      >
        <p className="font-bold">入力内容を確認してください</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {Object.entries(quote.errors).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (quote.status === "outOfSpec") {
    return (
      <div
        className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        role="alert"
      >
        <p className="text-base font-bold">宅急便の規格外です</p>
        <p className="mt-2">{quote.message}</p>
        {quote.dimensionSumCm !== null && (
          <p className="mt-1">
            入力された 3 辺合計：{formatNumber(quote.dimensionSumCm, 2)} cm
          </p>
        )}
        <p className="mt-2">
          {"宅急便で送れるのは 3 辺合計 200cm 以内・重量 30kg 以内・1 辺 170cm 以内の荷物です。規格を超える荷物は、別のサービスの対象となる場合がありますので、ヤマト運輸へご相談ください。"}
        </p>
      </div>
    );
  }

  if (quote.status === "fareUnavailable") {
    return (
      <div
        className="rounded-xl border border-amber-400 bg-accent-50 p-4 text-sm text-navy-900"
        role="alert"
      >
        <p className="text-base font-bold">料金データ未設定</p>
        <p className="mt-2">
          {quote.destination.name}宛て・{quote.size}
          サイズの運賃データがこのサイトに登録されていないため、送料を表示できません。
          正確な運賃はヤマト運輸公式サイトでご確認ください。
        </p>
      </div>
    );
  }

  const isRiceMode = quote.product !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
      <h3 className="bg-navy-800 px-4 py-3 text-base font-bold text-white">
        {isRiceMode ? "お米の代金と送料の目安" : "送料の目安"}
      </h3>

      <PriceBreakdown quote={quote} />

      <dl className="px-4 py-2">
        <Row label="発送元" value={ORIGIN.label} />
        <Row
          label="お届け先"
          value={`${quote.destination.name}（${quote.destinationRegionLabel}）`}
        />
        {quote.product && (
          <Row
            label="ご希望のお米の量"
            value={
              quote.product.note
                ? `${quote.product.label}（※${quote.product.note}）`
                : quote.product.label
            }
          />
        )}
        <Row label="宅急便サイズ" value={`${quote.size} サイズ`} />
        {quote.dimensionSumCm !== null && (
          <Row
            label="3 辺合計"
            value={`${formatNumber(quote.dimensionSumCm, 2)} cm`}
          />
        )}
        <Row
          label={isRiceMode ? "箱込みの重量" : "入力重量"}
          value={`${formatNumber(quote.weightKg, 3)} kg`}
        />
        {quote.product && (
          <Row
            label="お米の代金（1 個あたり）"
            value={formatYen(quote.product.priceYen)}
          />
        )}
        <Row label="1 個あたりの税込送料" value={formatYen(quote.unitFareYen)} />
        <Row label="個数" value={`${quote.quantity} 個`} />
        {quote.productSubtotalYen !== null && (
          <Row label="お米の代金 合計" value={formatYen(quote.productSubtotalYen)} />
        )}
        <Row label="税込送料合計" value={formatYen(quote.totalFareYen)} />
        {quote.grandTotalYen !== null && (
          <Row
            label="お支払い総額（お米＋送料）"
            value={formatYen(quote.grandTotalYen)}
          />
        )}
        <Row
          label="料金データ適用開始日"
          value={formatDateJa(quote.meta.effectiveFrom)}
        />
        <Row label="料金データ確認日" value={formatDateJa(quote.meta.checkedOn)} />
      </dl>

      <div className="space-y-2 border-t border-navy-100 bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-700">
        <p className="font-bold">送料は基本運賃による目安です。</p>
        {quote.basis === "weight" && (
          <p>
            サイズ区分は箱込みの重量から判定しています。箱が大きい場合は、実際には
            1 つ上のサイズ区分になり、送料が上がることがあります。
          </p>
        )}
        <p>
          複数個の場合は、すべて同じサイズ・同じ配送先として「1 個あたりの金額 ×
          個数」で計算しています。
        </p>
        <p>
          {`上下逆さまにできないなど輸送状態に定めがある荷物は、1 辺 ${RESTRICTED_ORIENTATION_MAX_SIDE_CM}cm 以内となります。`}
        </p>
        <p>
          離島など、お届け先によっては別途条件が加わる場合があります。確定料金ではありません。
        </p>
      </div>
    </div>
  );
}
