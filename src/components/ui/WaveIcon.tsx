import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  size?: number;
  color?: string;
};

export const WaveIcon: React.FC<Props> = ({ size = 60, color = "white" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const waveAnim = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 60,
  });

  const offset = interpolate(Math.sin(frame / 10), [-1, 1], [-5, 5]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `translateY(${offset}px)` }}
    >
      <path d="M2 18c4-5 8-5 12 0s8 5 12 0" />
      <path d="M2 12c4-5 8-5 12 0s8 5 12 0" />
      <path d="M2 6c4-5 8-5 12 0s8 5 12 0" />
    </svg>
  );
};
