import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This app builds on its own, separate from the company website in the parent folder.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
