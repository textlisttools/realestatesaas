import { PDFDocument } from "pdf-lib";

const LETTER_WIDTH_PT = 612; // 8.5in at 72pt/in
const LETTER_HEIGHT_PT = 792; // 11in at 72pt/in

/**
 * Wraps a full-bleed PNG (rendered at 2550x3300px = 8.5x11in @300dpi) into
 * a single US-Letter PDF page. Puppeteer's own page.pdf() maps CSS px to
 * physical units at 96dpi regardless of viewport size, so it can't produce
 * a true 300dpi page directly from a 2550x3300 viewport — embedding the
 * pre-rendered raster at the correct physical page size sidesteps that.
 */
export async function pngToLetterPdf(pngBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([LETTER_WIDTH_PT, LETTER_HEIGHT_PT]);
  const png = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(png, { x: 0, y: 0, width: LETTER_WIDTH_PT, height: LETTER_HEIGHT_PT });
  return Buffer.from(await pdfDoc.save());
}
