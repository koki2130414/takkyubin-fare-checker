import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_NAME = "かんたん宅急便送料チェック";
const SITE_DESCRIPTION =
  "栃木県下野市から発送する場合の、ヤマト運輸の宅急便（発払い・現金）の基本運賃の目安を、荷物のサイズと重量・お届け先の都道府県から確認できる非公式の計算ツールです。";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME}｜栃木県下野市発の送料目安（非公式）`,
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: `${SITE_NAME}｜栃木県下野市発の送料目安（非公式）`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME}｜栃木県下野市発の送料目安（非公式）`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16305c",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-navy-800 focus:px-4 focus:py-2 focus:text-white"
        >
          本文へスキップ
        </a>
        {children}
      </body>
    </html>
  );
}
