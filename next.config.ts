import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 送料計算はすべてブラウザ側で完結するため、静的サイトとして出力する。
  // Vercel でもそのままデプロイできる。
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
