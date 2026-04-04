/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Composition, Folder, Still, CalculateMetadataFunction } from "remotion";
import { SurfForecast } from "./components/SurfForecast";
import { surfForecastSchema, SurfForecastProps } from "./schemas/surf-forecast";
import { SurfThumbnail } from "./components/SurfThumbnail";

const defaultSurfData: SurfForecastProps = {
  spotName: "Pipeline",
  spotLocation: "North Shore, Oahu",
  date: "Friday, April 3rd",
  currentWaveHeight: 8,
  currentWaveHeightUnit: "ft",
  currentPeriod: 14,
  currentDirection: "NW",
  currentDirectionDegrees: 315,
  waterTemp: 24,
  waterTempUnit: "C",
  windSpeed: 12,
  windDirection: "SE",
  windDirectionDegrees: 135,
  overallRating: "good",
  hourlyForecast: [
    { hour: "6AM", waveHeight: 6, period: 12, windSpeed: 5, windDirection: "E", rating: "fair" },
    { hour: "9AM", waveHeight: 8, period: 14, windSpeed: 8, windDirection: "SE", rating: "good" },
    { hour: "12PM", waveHeight: 10, period: 15, windSpeed: 12, windDirection: "S", rating: "epic" },
    { hour: "3PM", waveHeight: 9, period: 14, windSpeed: 15, windDirection: "SW", rating: "good" },
    { hour: "6PM", waveHeight: 7, period: 13, windSpeed: 10, windDirection: "W", rating: "fair" },
    { hour: "9PM", waveHeight: 6, period: 12, windSpeed: 5, windDirection: "NW", rating: "poor" },
  ],
  swellData: [
    { height: 8, period: 14, direction: "NW", directionDegrees: 315 },
    { height: 3, period: 10, direction: "W", directionDegrees: 270 },
    { height: 2, period: 18, direction: "NNW", directionDegrees: 340 },
  ],
  tides: [
    { time: "4:12 AM", height: 0.2, type: "low" },
    { time: "10:45 AM", height: 1.8, type: "high" },
    { time: "5:20 PM", height: 0.4, type: "low" },
    { time: "11:30 PM", height: 1.6, type: "high" },
  ],
  primaryColor: "#00d2ff",
  secondaryColor: "#3a7bd5",
  backgroundColor: "#0f172a",
  brandName: "SurfLine Pro",
  logoUrl: "https://picsum.photos/seed/surf/200/200",
};

const calculateSurfMetadata: CalculateMetadataFunction<SurfForecastProps> = async ({ props }) => {
  const sceneCount = 7; // Intro, Current, Hourly, Swell, Wind, Tide, Outro
  const fps = 30;
  const sceneDuration = 3 * fps;
  const transitionDuration = 15; // frames
  
  const totalDuration = (sceneCount * sceneDuration) - ((sceneCount - 1) * transitionDuration);

  return {
    durationInFrames: Math.floor(totalDuration),
    props: {
      ...props,
    },
  };
};

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="surf-forecast">
        <Composition
          id="surf-forecast-landscape"
          component={SurfForecast}
          schema={surfForecastSchema}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={600} // Placeholder, will be overridden by calculateMetadata
          defaultProps={defaultSurfData}
          calculateMetadata={calculateSurfMetadata}
        />
        <Composition
          id="surf-forecast-portrait"
          component={SurfForecast}
          schema={surfForecastSchema}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={600}
          defaultProps={defaultSurfData}
          calculateMetadata={calculateSurfMetadata}
        />
        <Composition
          id="surf-forecast-square"
          component={SurfForecast}
          schema={surfForecastSchema}
          width={1080}
          height={1080}
          fps={30}
          durationInFrames={600}
          defaultProps={defaultSurfData}
          calculateMetadata={calculateSurfMetadata}
        />
        <Composition
          id="surf-forecast-shorts"
          component={SurfForecast}
          schema={surfForecastSchema}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={600}
          defaultProps={defaultSurfData}
          calculateMetadata={calculateSurfMetadata}
        />
        <Composition
          id="surf-forecast-tiktok"
          component={SurfForecast}
          schema={surfForecastSchema}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={600}
          defaultProps={defaultSurfData}
          calculateMetadata={calculateSurfMetadata}
        />
      </Folder>
      <Folder name="thumbnails">
        <Still
          id="surf-forecast-thumbnail"
          component={SurfThumbnail}
          schema={surfForecastSchema}
          width={1280}
          height={720}
          defaultProps={defaultSurfData}
        />
      </Folder>
    </>
  );
};
