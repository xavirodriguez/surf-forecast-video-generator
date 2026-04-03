import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

type Props = {
  rating: "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";
  fontSize?: number;
};

const ratingColors = {
  flat: "#999999",
  poor: "#e74c3c",
  "poor-fair": "#e67e22",
  fair: "#f39c12",
  "fair-good": "#f1c40f",
  good: "#2ecc71",
  epic: "#9b59b6",
};

export const ConditionBadge: React.FC<Props> = ({ rating, fontSize = 24 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const scale = interpolate(entry, [0, 1], [0.5, 1]);
  const opacity = interpolate(entry, [0, 1], [0, 1]);

  return (
    <div
      style={{
        backgroundColor: ratingColors[rating],
        color: "white",
        padding: "8px 16px",
        borderRadius: "99px",
        fontSize,
        fontWeight: "bold",
        textTransform: "uppercase",
        display: "inline-block",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {rating.replace("-", " ")}
    </div>
  );
};
