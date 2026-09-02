import type { ReactNode } from "react";

import { ORIGIN } from "@/data/origin";
import type { ShippingQuote } from "@/lib/fare";
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

  return (
    <div className="overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
      <h3 className="bg-navy-800 px-4 py-3 text-base font-bold text-white">
        送料の目安
      </h3>

      <div className="border-b-4 border-accent-400 bg-navy-50 px-4 py-5 text-center">
        <p className="text-sm text-navy-700">税込送料合計（{quote.quantity} 個）</p>
        <p className="mt-1 text-4xl leading-tight font-extrabold tracking-tight text-navy-900 tabular-nums sm:text-5xl">
          {formatYen(quote.totalFareYen)}
        </p>
        <p className="mt-2 text-sm text-navy-700">
          1 個あたり {formatYen(quote.unitFareYen)} × {quote.quantity} 個
        </p>
      </div>

      <dl className="px-4 py-2">
        <Row label="発送元" value={ORIGIN.label} />
        <Row
          label="お届け先"
          value={`${quote.destination.name}（${quote.destinationRegionLabel}）`}
        />
        <Row label="宅急便サイズ" value={`${quote.size} サイズ`} />
        <Row
          label="3 辺合計"
          value={`${formatNumber(quote.dimensionSumCm, 2)} cm`}
        />
        <Row label="入力重量" value={`${formatNumber(quote.weightKg, 3)} kg`} />
        <Row label="1 個あたりの税込送料" value={formatYen(quote.unitFareYen)} />
        <Row label="個数" value={`${quote.quantity} 個`} />
        <Row label="税込送料合計" value={formatYen(quote.totalFareYen)} />
        <Row
          label="料金データ適用開始日"
          value={formatDateJa(quote.meta.effectiveFrom)}
        />
        <Row label="料金データ確認日" value={formatDateJa(quote.meta.checkedOn)} />
      </dl>

      <div className="space-y-2 border-t border-navy-100 bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-700">
        <p className="font-bold">これは基本運賃による目安です。</p>
        <p>
          複数個の場合は、すべて同じサイズ・同じ配送先として「1 個あたりの送料 ×
          個数」で計算しています。
        </p>
        <p>
          {`上下逆さまにできないなど輸送状態に定めがある荷物は、1 辺 ${RESTRICTED_ORIENTATION_MAX_SIDE_CM}cm 以内となります。`}
        </p>
        <p>
          {"離島など、お届け先によっては別途条件が加わる場合があります。確定料金ではありません。"}
        </p>
      </div>
    </div>
  );
}
