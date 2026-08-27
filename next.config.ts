import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium's binary (node_modules/@sparticuz/chromium/bin/*.br)
  // and ffmpeg-static's prebuilt ffmpeg binary are both loaded at runtime via
  // dynamic path resolution, not a static require(), so Vercel's build-time
  // file tracer doesn't detect them as dependencies and leaves them out of
  // the serverless function bundle by default -- the render routes then
  // crash at runtime trying to read them.
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./node_modules/ffmpeg-static/**/*",
    ],
  },
};

export default nextConfig;
