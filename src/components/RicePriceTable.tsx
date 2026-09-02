import { RICE_PRODUCTS } from "@/data/rice-products";
import type { Prefecture } from "@/data/prefectures";
import { calculateRiceShipping } from "@/lib/fare";
import { formatYen } from "@/lib/format";

type Props = {
  readonly destination: Prefecture;
};

const CELL = "border border-navy-100 px-1.5 py-2 sm:px-3";

/** 選んだお届け先について、全ての量の「お米代金・送料・合計」を並べた一覧 */
export function RicePriceTable({ destination }: Props) {
  const rows = RICE_PRODUCTS.map((product) => ({
    product,
    quote: calculateRiceShipping({ destination, product, quantity: 1 }),
  }));

  return (
    <section
      aria-labelledby="price-table-heading"
      className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="price-table-heading" className="text-lg font-bold text-navy-900">
        {destination.name}へお届けの場合の料金一覧
      </h2>
      <p className="mt-1 text-sm text-navy-700">
        1 個あたりの金額です。どの量にするか比べるときにお使いください。
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <caption className="sr-only">
            お米の量ごとの、お米の代金・送料・合計金額
          </caption>
          <thead>
            <tr className="bg-navy-50 text-navy-900">
              <th scope="col" className={`${CELL} text-left`}>
                お米の量
                <span className="block text-[0.65rem] font-normal text-navy-700 sm:text-xs">
                  すべて箱込み
                </span>
              </th>
              <th scope="col" className={`${CELL} text-right`}>
                お米
              </th>
              <th scope="col" className={`${CELL} text-right`}>
                送料
              </th>
              <th scope="col" className={`${CELL} text-right`}>
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, quote }) => (
              <tr key={product.id}>
                <th scope="row" className={`${CELL} text-left font-bold`}>
                  <span className="whitespace-nowrap">
                    {product.label.replace("箱込み", "")}
                  </span>
                  {/* サイズは幅の狭い画面では省略（結果カードに表示される） */}
                  <span className="hidden text-xs font-normal whitespace-nowrap text-navy-700 sm:block">
                    {quote.status === "ok" ? `${quote.size} サイズ` : "—"}
                  </span>
                  {product.note && (
                    <span className="block text-[0.65rem] font-normal whitespace-nowrap text-navy-700 sm:text-xs">
                      ※{product.note}
                    </span>
                  )}
                </th>
                <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>
                  {formatYen(product.priceYen)}
                </td>
                <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>
                  {quote.status === "ok" ? formatYen(quote.unitFareYen) : "—"}
                </td>
                <td
                  className={`${CELL} text-right font-bold whitespace-nowrap tabular-nums`}
                >
                  {quote.status === "ok" && quote.grandTotalYen !== null
                    ? formatYen(quote.grandTotalYen)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-navy-700">
        送料は宅急便の基本運賃（発払い・現金・税込）による目安です。サイズ区分は箱込みの重量から
        判定しているため、箱が大きい場合は 1 つ上のサイズになることがあります。
      </p>
    </section>
  );
}
