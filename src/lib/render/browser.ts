import puppeteer, { type Browser } from "puppeteer-core";

/**
 * Launches Chromium for rendering templates. On Vercel/serverless there's
 * no system Chrome, so @sparticuz/chromium ships a compatible binary —
 * that's the default path. Locally (or on any host with its own Chrome),
 * set PUPPETEER_EXECUTABLE_PATH to skip @sparticuz/chromium entirely.
 */
export async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (executablePath) {
    return puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true,
  });
}
