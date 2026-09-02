import { FareCalculator } from "@/components/FareCalculator";
import { Disclaimer, PrivacyNote, SizeGuide } from "@/components/Notices";
import { SiteHeader } from "@/components/SiteHeader";
import { FARE_TABLE_META } from "@/data/fare-table";
import { formatDateJa } from "@/lib/format";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="space-y-6">
          <FareCalculator />
          <SizeGuide />
          <Disclaimer />
          <PrivacyNote />
        </div>
      </main>
      <footer className="mt-8 border-t border-navy-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-xs leading-relaxed text-navy-700">
          <p className="font-bold text-navy-900">
            かんたん宅急便送料チェック（非公式）
          </p>
          <p className="mt-1">
            {"ヤマト運輸株式会社の公式サイトではありません。表示される金額は目安であり、確定料金ではありません。"}
          </p>
          <p className="mt-1">
            料金データ 適用開始日：{formatDateJa(FARE_TABLE_META.effectiveFrom)}／
            確認日：{formatDateJa(FARE_TABLE_META.checkedOn)}
          </p>
        </div>
      </footer>
    </>
  );
}
