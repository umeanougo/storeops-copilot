import { ImageResponse } from "next/og";

export const alt = "StoreOps Copilot multi-merchant fulfilment workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f7f2",
          color: "#142218",
          padding: "64px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "#1f5c42",
                color: "#ffffff",
                fontSize: 25,
                fontWeight: 800,
                letterSpacing: "-1px",
              }}
            >
              SO
            </div>
            <div style={{ display: "flex", fontSize: 29, fontWeight: 750 }}>StoreOps Copilot</div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              border: "1px solid #b8c8bc",
              borderRadius: 999,
              color: "#405346",
              fontSize: 17,
              fontWeight: 650,
            }}
          >
            Independent portfolio prototype
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
          <div
            style={{
              display: "flex",
              marginBottom: 20,
              color: "#1f5c42",
              fontSize: 20,
              fontWeight: 750,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Multi-merchant fulfilment operations
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 65,
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: "-3px",
            }}
          >
            See what needs attention across every store.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              color: "#536257",
              fontSize: 25,
              lineHeight: 1.35,
            }}
          >
            Explainable priorities, scoped records, and evidence-linked answers.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 15, color: "#405346", fontSize: 18 }}>
          <div style={{ display: "flex", width: 9, height: 9, borderRadius: 99, background: "#2e7d58" }} />
          Synthetic data · Read-only · Built for Shopify product thinking
        </div>
      </div>
    ),
    size,
  );
}
