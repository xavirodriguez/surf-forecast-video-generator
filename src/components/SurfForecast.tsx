import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { IntroScene } from "./scenes/IntroScene";
import { CurrentConditions } from "./scenes/CurrentConditions";
import { HourlyForecast } from "./scenes/HourlyForecast";
import { SwellChart } from "./scenes/SwellChart";
import { WindMap } from "./scenes/WindMap";
import { TideChart } from "./scenes/TideChart";
import { OutroScene } from "./scenes/OutroScene";

export const SurfForecast: React.FC<SurfForecastProps> = (props) => {
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;

  const sceneDuration = 3 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor, fontFamily: "system-ui, sans-serif" }}>
      {/* Background Gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 50%, ${props.secondaryColor}44 0%, transparent 70%)`,
      }} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <IntroScene 
            spotName={props.spotName}
            spotLocation={props.spotLocation}
            brandName={props.brandName}
            logoUrl={props.logoUrl}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <CurrentConditions 
            currentWaveHeight={props.currentWaveHeight}
            currentWaveHeightUnit={props.currentWaveHeightUnit}
            currentPeriod={props.currentPeriod}
            currentDirection={props.currentDirection}
            currentDirectionDegrees={props.currentDirectionDegrees}
            windSpeed={props.windSpeed}
            windDirection={props.windDirection}
            windDirectionDegrees={props.windDirectionDegrees}
            overallRating={props.overallRating}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <HourlyForecast 
            hourlyForecast={props.hourlyForecast}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <SwellChart 
            swellData={props.swellData}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-top" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <WindMap 
            windSpeed={props.windSpeed}
            windDirection={props.windDirection}
            windDirectionDegrees={props.windDirectionDegrees}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <TideChart 
            tides={props.tides}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={sceneDuration}>
          <OutroScene 
            brandName={props.brandName}
            primaryColor={props.primaryColor}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

