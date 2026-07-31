import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app renders images with plain <img> tags (string URLs), so the
  // next/image optimizer is not required. Nothing extra to configure.
  reactStrictMode: true,
};

export default nextConfig;
