import { FARE_TABLE_META } from "@/data/fare-table";
import { formatDateJa } from "@/lib/format";
import {
  MAX_SINGLE_SIDE_CM,
  RESTRICTED_ORIENTATION_MAX_SIDE_CM,
  SIZE_SPECS,
} from "@/lib/size";

const OFFICIAL_SEARCH_URL =
  "https://www.kuronekoyamato.co.jp/ytc/search/payment/simulation.html";

export function SizeGuide() {
  return (
    <section
      aria-labelledby="size-guide-heading"
      className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="size-guide-heading" className="text-lg font-bold text-navy-900">
        宅急便のサイズ区分
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-sm">
          <caption className="sr-only">
            宅急便のサイズ区分ごとの3辺合計と重量の上限
          </caption>
          <thead>
            <tr className="bg-navy-50 text-navy-900">
              <th scope="col" className="border border-navy-100 px-2 py-2 text-left">
                サイズ
              </th>
              <th scope="col" className="border border-navy-100 px-2 py-2 text-left">
                3 辺合計
              </th>
              <th scope="col" className="border border-navy-100 px-2 py-2 text-left">
                重量
              </th>
            </tr>
          </thead>
          <tbody>
            {SIZE_SPECS.map((spec) => (
              <tr key={spec.size}>
                <th
                  scope="row"
                  className="border border-navy-100 px-2 py-2 text-left font-bold"
                >
                  {spec.size} サイズ
                </th>
                <td className="border border-navy-100 px-2 py-2">
                  {spec.maxDimensionSumCm}cm 以内
                </td>
                <td className="border border-navy-100 px-2 py-2">
                  {spec.maxWeightKg}kg 以内
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-navy-700">
        <li>1 辺の長さは {MAX_SINGLE_SIDE_CM}cm 以内です。</li>
        <li className="font-bold text-navy-900">
          {`上下逆さまにできないなど輸送状態に定めがあるお荷物は、1 辺 ${RESTRICTED_ORIENTATION_MAX_SIDE_CM}cm 以内となります。`}
        </li>
      </ul>
    </section>
  );
}

export function Disclaimer() {
  return (
    <section
      aria-labelledby="notice-heading"
      className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="notice-heading" className="text-lg font-bold text-navy-900">
        ご利用にあたっての注意事項
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy-800">
        <li>
          {"表示額は、宅急便の"}
          <strong>基本運賃（発払い・現金でのお支払い・税込）</strong>
          {"による目安です。"}
        </li>
        <li>
          実際の料金は、ヤマト運輸でお荷物を計測した際に確定します。
        </li>
        <li>
          {"割引、キャッシュレス決済運賃、持込割、クロネコメンバー割などの会員割引、クール宅急便、宅急便コンパクト、着払い、複数口減額などは計算に含めていません。"}
        </li>
        <li>
          荷物の種類、梱包状態、離島、受付場所などによって、利用条件や料金が異なる場合があります。
        </li>
        <li>
          最新の情報は、必ずヤマト運輸公式サイトでご確認ください。
        </li>
        <li className="font-bold">
          {"このサイトはヤマト運輸株式会社の公式サイトではありません。同社とは一切関係のない個人が作成した非公式ツールです。ヤマト運輸およびクロネコヤマトのロゴ・公式キャラクターは使用していません。"}
        </li>
      </ul>

      <div className="mt-4 space-y-2 rounded-lg bg-navy-50 p-3 text-sm text-navy-800">
        <p className="font-bold">料金データの出典</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a
              className="font-bold break-all text-navy-800 underline"
              href={FARE_TABLE_META.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              宅急便運賃一覧表：全国一覧（現金でのお支払い）
            </a>
          </li>
          <li>
            <a
              className="font-bold break-all text-navy-800 underline"
              href={FARE_TABLE_META.sizeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              宅急便のサイズについて
            </a>
          </li>
        </ul>
        <p>
          適用開始日：{formatDateJa(FARE_TABLE_META.effectiveFrom)} ／ 確認日：
          {formatDateJa(FARE_TABLE_META.checkedOn)}
        </p>
        <p>{FARE_TABLE_META.note}</p>
      </div>

      <a
        href={OFFICIAL_SEARCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-navy-800 px-4 py-3 text-center text-base font-bold text-navy-800 hover:bg-navy-50"
      >
        ヤマト運輸公式の料金検索ページを開く
      </a>
    </section>
  );
}

export function PrivacyNote() {
  return (
    <section
      aria-labelledby="privacy-heading"
      className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="privacy-heading" className="text-lg font-bold text-navy-900">
        個人情報の取り扱い
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy-800">
        <li>
          送料の計算はすべてお使いのブラウザ内で完結します。入力内容はサーバーへ送信しません。
        </li>
        <li>
          入力された住所を localStorage・Cookie・サーバー・分析サービスへ保存しません。
        </li>
        <li>広告、アクセス解析、トラッキングは一切実装していません。</li>
        <li>
          外部への通信は、郵便番号から住所を自動入力する操作を行ったときに、郵便番号
          7 桁のみを郵便番号検索 API（zipcloud）へ送信する場合に限られます。
        </li>
      </ul>
    </section>
  );
}
