import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": [
      "./data/merchants.sqlite",
      "./node_modules/sql.js/dist/sql-wasm.wasm",
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
