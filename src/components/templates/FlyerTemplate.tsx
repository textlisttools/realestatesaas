import {
  fontStack,
  formatAddress,
  formatCityStateZip,
  formatPrice,
  formatStats,
} from "./format";
import type { TemplateData } from "./types";

const WIDTH = 2550;
const HEIGHT = 3300;
const HERO_HEIGHT = 1500;
const STAT_ROW_HEIGHT = 220;
const GRID_HEIGHT = 1130;
const FOOTER_HEIGHT = HEIGHT - HERO_HEIGHT - STAT_ROW_HEIGHT - GRID_HEIGHT;

export function FlyerTemplate({ agent, listing, photos }: TemplateData) {
  const gridPhotos = photos.secondary.slice(0, 3);

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        position: "relative",
        background: "#ffffff",
        fontFamily: fontStack(agent.fontChoice),
        overflow: "hidden",
      }}
    >
      {/* Hero photo */}
      <div style={{ width: WIDTH, height: HERO_HEIGHT, position: "relative", background: "#d4d4d8" }}>
        {photos.hero && (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size print template, rendered by Puppeteer
          <img
            src={photos.hero}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Stat row */}
      <div
        style={{
          width: WIDTH,
          height: STAT_ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 100px",
          boxSizing: "border-box",
        }}
      >
        <div>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
            {formatAddress(listing)}
          </div>
          <div style={{ fontSize: 44, color: "#6b7280", marginTop: 10 }}>
            {formatCityStateZip(listing)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: agent.primaryColor, lineHeight: 1 }}>
            {formatPrice(listing.price)}
          </div>
          <div style={{ fontSize: 44, color: "#6b7280", marginTop: 10 }}>
            {formatStats(listing)}
          </div>
        </div>
      </div>

      {/* Secondary photos grid */}
      <div
        style={{
          width: WIDTH,
          height: GRID_HEIGHT,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(gridPhotos.length, 1)}, 1fr)`,
          gap: 20,
          padding: "0 20px",
          boxSizing: "border-box",
          background: "#f4f4f5",
        }}
      >
        {gridPhotos.length > 0 ? (
          gridPhotos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- fixed-size print template, rendered by Puppeteer
            <img
              key={i}
              src={url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ))
        ) : (
          <div />
        )}
      </div>

      {/* Footer bar */}
      <div
        style={{
          width: WIDTH,
          height: FOOTER_HEIGHT,
          background: agent.primaryColor,
          display: "flex",
          alignItems: "center",
          padding: "0 100px",
          boxSizing: "border-box",
          gap: 50,
        }}
      >
        {agent.headshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size print template, rendered by Puppeteer
          <img
            src={agent.headshotUrl}
            alt=""
            style={{
              width: 260,
              height: 260,
              borderRadius: "50%",
              objectFit: "cover",
              border: "6px solid rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ color: "#ffffff", flex: 1 }}>
          <div style={{ fontSize: 64, fontWeight: 700 }}>{agent.name ?? ""}</div>
          <div style={{ fontSize: 40, opacity: 0.85, marginTop: 8 }}>{agent.brokerage ?? ""}</div>
        </div>
        <div style={{ color: "#ffffff", textAlign: "right" }}>
          <div style={{ fontSize: 44 }}>{agent.phone ?? ""}</div>
          <div style={{ fontSize: 40, opacity: 0.85, marginTop: 8 }}>{agent.email ?? ""}</div>
        </div>
        {agent.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- fixed-size print template, rendered by Puppeteer
          <img
            src={agent.logoUrl}
            alt=""
            style={{ height: 180, width: 180, objectFit: "contain", flexShrink: 0 }}
          />
        )}
      </div>
    </div>
  );
}
