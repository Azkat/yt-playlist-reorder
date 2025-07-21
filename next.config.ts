import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'i.ytimg.com',       // YouTube サムネイル (API経由)
      'yt3.ggpht.com',     // YouTube プロフィール画像
      'img.youtube.com',   // YouTube 直接サムネイルURL
    ],
  },
};

export default nextConfig;
