import { fontStack, formatAddress, formatPrice, formatStats } from "./format";
import type { TemplateData } from "./types";

const SIZE = 1080;

export function InstagramPostTemplate({ agent, listing, photos }: TemplateData) {
  return (
    <div
      style={{
        width: SIZE,
        height: SIZE,
        position: "relative",
        background: "#d4d4d8",
        fontFamily: fontStack(agent.fontChoice),
        overflow: "hidden",
      }}
    >
      {photos.hero && (
        // eslint-disable-next-line @next/next/no-img-element -- fixed-size social template, rendered by Puppeteer
        <img
          src={photos.hero}
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

      {/* Price badge */}
      <div
        style={{
          position: "absolute",
          top: 48,
          right: 48,
          background: agent.secondaryColor,
          color: "#ffffff",
          fontSize: 44,
          fontWeight: 700,
          padding: "18px 36px",
          borderRadius: 999,
        }}
      >
        {formatPrice(listing.price)}
      </div>

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 340,
          background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 56px 48px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: "#ffffff", fontSize: 52, fontWeight: 700 }}>
          {formatAddress(listing)}
        </div>
        <div style={{ color: "#ffffff", fontSize: 32, opacity: 0.9, marginTop: 10 }}>
          {formatStats(listing)}
        </div>
      </div>

      {/* Agent logo */}
      {agent.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- fixed-size social template, rendered by Puppeteer
        <img
          src={agent.logoUrl}
          alt=""
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            height: 90,
            width: 90,
            objectFit: "contain",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            padding: 10,
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
