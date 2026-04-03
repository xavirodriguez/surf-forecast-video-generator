import React from "react";
import { AbsoluteFill } from "remotion";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { WaveIcon } from "./ui/WaveIcon";
import { ConditionBadge } from "./ui/ConditionBadge";

export const SurfThumbnail: React.FC<SurfForecastProps> = (props) => {
  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor, color: "white", padding: 60, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 20 }}>
          <WaveIcon size={120} color={props.primaryColor} />
          <ConditionBadge rating={props.overallRating} fontSize={40} />
        </div>
        
        <h1 style={{ fontSize: 120, fontWeight: 900, margin: 0, lineHeight: 1 }}>
          {props.spotName}
        </h1>
        <h2 style={{ fontSize: 60, color: props.primaryColor, margin: "10px 0", fontWeight: 700 }}>
          {props.currentWaveHeight}{props.currentWaveHeightUnit} FORECAST
        </h2>
        
        <div style={{ marginTop: 40, fontSize: 30, opacity: 0.8, letterSpacing: 2 }}>
          {props.brandName.toUpperCase()} • {props.date}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div style={{ 
        position: "absolute", 
        right: -100, 
        bottom: -100, 
        width: 500, 
        height: 500, 
        borderRadius: "50%", 
        background: `radial-gradient(circle, ${props.primaryColor}33 0%, transparent 70%)` 
      }} />
    </AbsoluteFill>
  );
};
