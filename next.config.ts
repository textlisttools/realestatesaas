import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium's binary (node_modules/@sparticuz/chromium/bin/*.br)
  // is loaded at runtime via dynamic path resolution, not a static require(),
  // so Vercel's build-time file tracer doesn't detect it as a dependency and
  // leaves it out of the serverless function bundle by default -- the
  // Puppeteer render route then crashes at runtime trying to read it.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
