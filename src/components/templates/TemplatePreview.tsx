/**
 * Scales a fixed-pixel template down for on-screen viewing without
 * affecting the template's own DOM dimensions — Puppeteer (step 6) will
 * render the template components directly, unscaled.
 */
export function TemplatePreview({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: width * scale,
        height: height * scale,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
