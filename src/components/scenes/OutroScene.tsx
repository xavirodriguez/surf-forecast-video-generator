import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

type Props = {
  brandName: string;
  primaryColor: string;
};

export const OutroScene: React.FC<Props> = ({ brandName, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const scale = interpolate(entry, [0, 1], [0.8, 1]);
  const opacity = interpolate(entry, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "transparent" }}>
      <div style={{ textAlign: "center", transform: `scale(${scale})`, opacity }}>
        <h2 style={{ fontSize: height * 0.06, color: "white", fontWeight: 900, marginBottom: 20 }}>
          SEE YOU IN THE WATER
        </h2>
        <p style={{ fontSize: height * 0.03, color: primaryColor, fontWeight: 600, letterSpacing: 4 }}>
          {brandName.toUpperCase()}
        </p>
        
        <div style={{ marginTop: 60, padding: "20px 40px", border: `2px solid ${primaryColor}`, borderRadius: 15, display: "inline-block" }}>
          <span style={{ color: "white", fontSize: height * 0.025, fontWeight: 700 }}>CHECK THE FULL FORECAST ONLINE</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
