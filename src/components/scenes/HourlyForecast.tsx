/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { ConditionBadge } from "../ui/ConditionBadge";

type Rating = "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";

interface ForecastItem {
  hour: string;
  waveHeight: number;
  period: number;
  windSpeed: number;
  windDirection: string;
  rating: Rating;
}

const ForecastRow: React.FC<{ item: ForecastItem; index: number; primaryColor: string }> = ({ item, index, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const animation = spring({
    frame: frame - index * 5,
    fps,
    config: { damping: 200 },
  });

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "20px 40px",
    borderRadius: 20,
    opacity: interpolate(animation, [0, 1], [0, 1]),
    transform: `translateX(${interpolate(animation, [0, 1], [-50, 0])}px)`,
  };

  return (
    <div style={rowStyle}>
      <div style={{ fontSize: height * 0.03, fontWeight: 700, width: "15%" }}>{item.hour}</div>
      <div style={{ fontSize: height * 0.035, fontWeight: 900, color: primaryColor, width: "20%" }}>{item.waveHeight}ft</div>
      <div style={{ fontSize: height * 0.025, opacity: 0.7, width: "15%" }}>{item.period}s</div>
      <div style={{ fontSize: height * 0.025, width: "20%" }}>{item.windSpeed}kts {item.windDirection}</div>
      <div style={{ width: "25%", textAlign: "right" }}>
        <ConditionBadge rating={item.rating} fontSize={height * 0.02} />
      </div>
    </div>
  );
};

type Props = {
  hourlyForecast: ForecastItem[];
  primaryColor: string;
};

export const HourlyForecast: React.FC<Props> = ({ hourlyForecast, primaryColor }) => {
  const { height } = useVideoConfig();
  const displayedForecast = hourlyForecast.slice(0, 6);

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <h2 style={{ fontSize: height * 0.05, marginBottom: 40, fontWeight: 800 }}>HOURLY FORECAST</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {displayedForecast.map((item, index) => (
          <ForecastRow key={item.hour} item={item} index={index} primaryColor={primaryColor} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
