import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";

type Props = {
  value: number;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
};

export const AnimatedNumber: React.FC<Props> = ({ value, suffix = "", decimals = 1, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animation = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const displayValue = interpolate(animation, [0, 1], [0, value]);

  return (
    <span style={style}>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};
