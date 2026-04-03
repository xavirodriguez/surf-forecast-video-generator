import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import React from "react";
import { WindArrow } from "../ui/WindArrow";
import { AnimatedNumber } from "../ui/AnimatedNumber";

type Props = {
  windSpeed: number;
  windDirection: string;
  windDirectionDegrees: number;
  primaryColor: string;
};

export const WindMap: React.FC<Props> = ({ windSpeed, windDirection, windDirectionDegrees, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const entry = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill style={{ padding: 60, color: "white" }}>
      <h2 style={{ fontSize: height * 0.05, marginBottom: 40, fontWeight: 800 }}>WIND CONDITIONS</h2>
      
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Mock Map Background */}
        <div style={{ 
          width: "80%", 
          height: "80%", 
          backgroundColor: "#1a2a3a", 
          borderRadius: 40, 
          border: "2px solid rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Animated Wind Particles */}
          {Array.from({ length: 20 }).map((_, i) => {
            const particleAnim = (frame + i * 20) % 100;
            const x = (i * 15) % 100;
            const y = interpolate(particleAnim, [0, 100], [0, 100]);
            
            return (
              <div key={i} style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: 2,
                height: 20,
                backgroundColor: primaryColor,
                opacity: 0.3,
                transform: `rotate(${windDirectionDegrees}deg)`
              }} />
            );
          })}
          
          <div style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)",
            textAlign: "center"
          }}>
            <WindArrow degrees={windDirectionDegrees} size={height * 0.15} color={primaryColor} />
            <div style={{ fontSize: height * 0.06, fontWeight: 900, marginTop: 20 }}>
              <AnimatedNumber value={windSpeed} suffix="kts" />
            </div>
            <div style={{ fontSize: height * 0.03, opacity: 0.7 }}>{windDirection}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
