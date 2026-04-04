/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbsoluteFill, useVideoConfig } from "remotion";
import React from "react";
import { WaveIcon } from "../ui/WaveIcon";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { ConditionBadge } from "../ui/ConditionBadge";
import { WindArrow } from "../ui/WindArrow";

type Rating = "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";

interface WaveDisplayProps {
  height: number;
  unit: string;
  period: number;
  direction: string;
  degrees: number;
  rating: Rating;
  primaryColor: string;
}

const WaveDisplay: React.FC<WaveDisplayProps> = ({ height: waveHeight, unit, period, direction, degrees, rating, primaryColor }) => {
  const { height: canvasHeight } = useVideoConfig();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <WaveIcon size={canvasHeight * 0.1} color={primaryColor} />
        <ConditionBadge rating={rating} fontSize={canvasHeight * 0.03} />
      </div>
      <div style={{ fontSize: canvasHeight * 0.15, fontWeight: 900, lineHeight: 1 }}>
        <AnimatedNumber value={waveHeight} suffix={unit} />
      </div>
      <div style={{ fontSize: canvasHeight * 0.04, opacity: 0.8, marginTop: 10 }}>
        {period}s {direction} ({degrees}°)
      </div>
    </div>
  );
};

interface WindDisplayProps {
  speed: number;
  direction: string;
  degrees: number;
  primaryColor: string;
}

const WindDisplay: React.FC<WindDisplayProps> = ({ speed, direction, degrees, primaryColor }) => {
  const { height: canvasHeight } = useVideoConfig();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: 40, borderRadius: 30, backdropFilter: "blur(10px)" }}>
        <h3 style={{ fontSize: canvasHeight * 0.03, marginBottom: 20, opacity: 0.6 }}>WIND</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <WindArrow degrees={degrees} size={canvasHeight * 0.08} color={primaryColor} />
          <div>
            <div style={{ fontSize: canvasHeight * 0.06, fontWeight: 700 }}>
              <AnimatedNumber value={speed} suffix="kts" />
            </div>
            <div style={{ fontSize: canvasHeight * 0.03, opacity: 0.8 }}>{direction}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

type Props = {
  currentWaveHeight: number;
  currentWaveHeightUnit: string;
  currentPeriod: number;
  currentDirection: string;
  currentDirectionDegrees: number;
  windSpeed: number;
  windDirection: string;
  windDirectionDegrees: number;
  overallRating: Rating;
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
  const { width, height } = useVideoConfig();
  const flexDirection = height > width ? "column" : "row";

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <div style={{ display: "flex", flexDirection, height: "100%", gap: 40 }}>
        <WaveDisplay
          height={currentWaveHeight}
          unit={currentWaveHeightUnit}
          period={currentPeriod}
          direction={currentDirection}
          degrees={currentDirectionDegrees}
          rating={overallRating}
          primaryColor={primaryColor}
        />
        <WindDisplay
          speed={windSpeed}
          direction={windDirection}
          degrees={windDirectionDegrees}
          primaryColor={primaryColor}
        />
      </div>
    </AbsoluteFill>
  );
};
