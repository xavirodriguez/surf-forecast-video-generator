import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

type Props = {
  spotName: string;
  spotLocation: string;
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
};

export const IntroScene: React.FC<Props> = ({ spotName, spotLocation, brandName, logoUrl, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const logoScale = interpolate(entry, [0, 1], [0, 1]);
  const textOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const textTranslateY = interpolate(entry, [0, 1], [50, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "transparent" }}>
      <div style={{ textAlign: "center" }}>
        {logoUrl && (
          <img
            src={logoUrl}
            style={{
              width: width * 0.2,
              height: width * 0.2,
              borderRadius: "50%",
              marginBottom: 40,
              transform: `scale(${logoScale})`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          />
        )}
        <div style={{ transform: `translateY(${textTranslateY}px)`, opacity: textOpacity }}>
          <h1 style={{ fontSize: height * 0.08, color: "white", margin: 0, fontWeight: 900, textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
            {spotName}
          </h1>
          <h2 style={{ fontSize: height * 0.04, color: primaryColor, margin: "10px 0", fontWeight: 600 }}>
            {spotLocation}
          </h2>
          <div style={{ height: 4, width: 100, backgroundColor: primaryColor, margin: "20px auto" }} />
          <p style={{ fontSize: height * 0.03, color: "white", opacity: 0.8 }}>{brandName}</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
