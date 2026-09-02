import { ORIGIN } from "@/data/origin";

export function SiteHeader() {
  return (
    <header className="border-b-4 border-accent-400 bg-navy-800 text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7">
        <p className="text-xs font-bold tracking-wider text-accent-200">
          非公式の送料目安ツール
        </p>
        <h1 className="mt-1 text-2xl leading-tight font-extrabold sm:text-3xl">
          かんたん宅急便送料チェック
        </h1>
        <p className="mt-2 text-sm text-navy-100 sm:text-base">
          栃木県下野市から発送する場合の送料目安を確認できます
        </p>
        <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
          <span className="rounded bg-accent-400 px-2 py-0.5 text-xs font-bold text-navy-900">
            発送元 固定
          </span>
          <span className="font-bold">{ORIGIN.label}</span>
          <span className="text-navy-100">（運賃区分：関東発）</span>
        </p>
      </div>
    </header>
  );
}
