import { fontStack, formatAddress, formatStats, statusBanner } from "./format";
import type { TemplateData } from "./types";

const WIDTH = 1080;
const HEIGHT = 1920;

export function InstagramStoryTemplate({ agent, listing, photos }: TemplateData) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
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

      {/* Top banner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 640,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0))",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 140,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: agent.primaryColor,
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: 4,
            padding: "24px 56px",
            borderRadius: 16,
          }}
        >
          {statusBanner(listing.status)}
        </div>
      </div>

      {/* Bottom stats + agent */}
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
          padding: "0 64px 96px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ color: "#ffffff", fontSize: 56, fontWeight: 700 }}>
          {formatAddress(listing)}
        </div>
        <div style={{ color: "#ffffff", fontSize: 36, opacity: 0.9, marginTop: 14 }}>
          {formatStats(listing)}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 48 }}>
          {agent.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- fixed-size social template, rendered by Puppeteer
            <img
              src={agent.logoUrl}
              alt=""
              style={{
                height: 80,
                width: 80,
                objectFit: "contain",
                background: "rgba(255,255,255,0.9)",
                borderRadius: 12,
                padding: 10,
                boxSizing: "border-box",
              }}
            />
          )}
          <div style={{ color: "#ffffff" }}>
            <div style={{ fontSize: 36, fontWeight: 600 }}>{agent.name ?? ""}</div>
            <div style={{ fontSize: 28, opacity: 0.85 }}>{agent.phone ?? ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
