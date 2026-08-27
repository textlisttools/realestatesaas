import { fontStack } from "./format";

const WIDTH = 1080;
const HEIGHT = 1920;

export type TikTokSlideProps = {
  photoUrl: string | null;
  captionTitle: string;
  captionSubtitle?: string | null;
  primaryColor: string;
  logoUrl: string | null;
  fontChoice: string;
};

export function TikTokSlideTemplate({
  photoUrl,
  captionTitle,
  captionSubtitle,
  primaryColor,
  logoUrl,
  fontChoice,
}: TikTokSlideProps) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        position: "relative",
        background: "#000000",
        fontFamily: fontStack(fontChoice),
        overflow: "hidden",
      }}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- fixed-size social template, rendered by Puppeteer
        <img
          src={photoUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 64,
          left: 64,
          width: 72,
          height: 10,
          borderRadius: 5,
          background: primaryColor,
        }}
      />

      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- fixed-size social template, rendered by Puppeteer
        <img
          src={logoUrl}
          alt=""
          style={{
            position: "absolute",
            top: 56,
            right: 64,
            height: 96,
            width: 96,
            objectFit: "contain",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 16,
            padding: 12,
            boxSizing: "border-box",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 640,
          background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 72px 140px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: "#ffffff", fontSize: 68, fontWeight: 800, lineHeight: 1.15 }}>
          {captionTitle}
        </div>
        {captionSubtitle && (
          <div style={{ color: "#ffffff", fontSize: 40, opacity: 0.9, marginTop: 18 }}>
            {captionSubtitle}
          </div>
        )}
      </div>
    </div>
  );
}
