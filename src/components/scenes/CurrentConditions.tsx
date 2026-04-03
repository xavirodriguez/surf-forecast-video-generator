import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { WaveIcon } from "../ui/WaveIcon";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { ConditionBadge } from "../ui/ConditionBadge";
import { WindArrow } from "../ui/WindArrow";

type Props = {
  currentWaveHeight: number;
  currentWaveHeightUnit: string;
  currentPeriod: number;
  currentDirection: string;
  currentDirectionDegrees: number;
  windSpeed: number;
  windDirection: string;
  windDirectionDegrees: number;
  overallRating: "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";
  primaryColor: string;
};

export const CurrentConditions: React.FC<Props> = ({
  currentWaveHeight,
  currentWaveHeightUnit,
  currentPeriod,
  currentDirection,
  currentDirectionDegrees,
  windSpeed,
  windDirection,
  windDirectionDegrees,
  overallRating,
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const isPortrait = height > width;

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", height: "100%", gap: 40 }}>
        {/* Left/Top Section: Main Wave Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
            <WaveIcon size={height * 0.1} color={primaryColor} />
            <ConditionBadge rating={overallRating} fontSize={height * 0.03} />
          </div>
          
          <div style={{ fontSize: height * 0.15, fontWeight: 900, lineHeight: 1 }}>
            <AnimatedNumber value={currentWaveHeight} suffix={currentWaveHeightUnit} />
          </div>
          
          <div style={{ fontSize: height * 0.04, opacity: 0.8, marginTop: 10 }}>
            {currentPeriod}s {currentDirection} ({currentDirectionDegrees}°)
          </div>
        </div>

        {/* Right/Bottom Section: Wind & Other */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 40, borderRadius: 30, backdropFilter: "blur(10px)" }}>
            <h3 style={{ fontSize: height * 0.03, marginBottom: 20, opacity: 0.6 }}>WIND</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
              <WindArrow degrees={windDirectionDegrees} size={height * 0.08} color={primaryColor} />
              <div>
                <div style={{ fontSize: height * 0.06, fontWeight: 700 }}>
                  <AnimatedNumber value={windSpeed} suffix="kts" />
                </div>
                <div style={{ fontSize: height * 0.03, opacity: 0.8 }}>{windDirection}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
