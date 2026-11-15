import type { NextConfig } from "next";

// Builds on its own, separate from the company website in the parent folder.
// (Vercel sets the file-tracing root itself; don't pin turbopack.root here.)
const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
