import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

type Props = {
  tides: Array<{
    time: string;
    height: number;
    type: "high" | "low";
  }>;
  primaryColor: string;
};

export const TideChart: React.FC<Props> = ({ tides, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <h2 style={{ fontSize: height * 0.05, marginBottom: 40, fontWeight: 800 }}>TIDE CHART</h2>
      
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "60%" }}>
        {tides.map((tide, index) => {
          const entry = spring({
            frame: frame - index * 15,
            fps,
            config: { damping: 200 },
          });

          const scale = interpolate(entry, [0, 1], [0, 1]);
          const opacity = interpolate(entry, [0, 1], [0, 1]);

          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                transform: `scale(${scale})`,
                opacity,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: `4px solid ${tide.type === "high" ? primaryColor : "#555"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: height * 0.03,
                  fontWeight: 800,
                  backgroundColor: tide.type === "high" ? `${primaryColor}22` : "transparent",
                }}
              >
                {tide.height}m
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: height * 0.03, fontWeight: 700, textTransform: "uppercase" }}>{tide.type}</div>
                <div style={{ fontSize: height * 0.025, opacity: 0.6 }}>{tide.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
