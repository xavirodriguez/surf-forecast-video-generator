import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  degrees: number;
  size?: number;
  color?: string;
};

export const WindArrow: React.FC<Props> = ({ degrees, size = 40, color = "white" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const rotation = interpolate(entry, [0, 1], [0, degrees]);
  const scale = interpolate(entry, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </div>
  );
};
