import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

type Props = {
  swellData: Array<{
    height: number;
    period: number;
    direction: string;
    directionDegrees: number;
  }>;
  primaryColor: string;
};

export const SwellChart: React.FC<Props> = ({ swellData, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <h2 style={{ fontSize: height * 0.05, marginBottom: 40, fontWeight: 800 }}>SWELL COMPONENTS</h2>
      
      <div style={{ display: "flex", gap: 30, height: "60%", alignItems: "flex-end", justifyContent: "space-around" }}>
        {swellData.map((swell, index) => {
          const barEntry = spring({
            frame: frame - index * 10,
            fps,
            config: { damping: 200 },
          });

          const barHeight = interpolate(barEntry, [0, 1], [0, swell.height * 40]);
          const opacity = interpolate(barEntry, [0, 1], [0, 1]);

          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1 }}>
              <div style={{ fontSize: height * 0.03, fontWeight: 700 }}>{swell.height}ft</div>
              <div
                style={{
                  width: "100%",
                  height: barHeight,
                  backgroundColor: primaryColor,
                  borderRadius: "15px 15px 0 0",
                  opacity,
                  boxShadow: `0 0 30px ${primaryColor}44`,
                }}
              />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: height * 0.025, fontWeight: 600 }}>{swell.period}s</div>
                <div style={{ fontSize: height * 0.02, opacity: 0.6 }}>{swell.direction}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
