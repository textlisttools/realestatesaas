import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Browser } from "puppeteer-core";
import { googleFontsHref } from "@/components/templates/format";

function wrapHtml(bodyHtml: string, fontChoice: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${googleFontsHref(fontChoice)}">
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{background:#fff;}img{display:block;}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

async function waitForImages(page: import("puppeteer-core").Page) {
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve());
              img.addEventListener("error", () => resolve());
            })
      )
    );
  });
}

// renderToStaticMarkup (the synchronous react-dom/server API) only works
// here because this module is imported exclusively from a Pages Router API
// route (src/pages/api/...), never from anything under src/app/. Next.js
// forces a "react-server" module resolution condition on everything
// reachable from the App Router, which breaks react-dom/server entirely
// (any subpath, any API) — Pages Router routes are a separate module graph
// and aren't subject to that.
export async function renderElementToPng(
  browser: Browser,
  element: ReactElement,
  width: number,
  height: number,
  fontChoice: string
): Promise<Buffer> {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const html = wrapHtml(renderToStaticMarkup(element), fontChoice);
    await page.setContent(html, { waitUntil: "load" });
    await waitForImages(page);
    const buffer = await page.screenshot({ type: "png" });
    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
}
