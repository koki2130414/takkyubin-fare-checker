import type { NextConfig } from "next";

/**
 * GitHub Pages のようにサブパス配信する場合は、ビルド時に
 * NEXT_PUBLIC_BASE_PATH="/リポジトリ名" を指定する。
 * 未指定ならルート配信（ローカル開発・Vercel）として動作する。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // 送料計算はすべてブラウザ側で完結するため、静的サイトとして出力する。
  // Vercel でも GitHub Pages でもそのまま配信できる。
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
