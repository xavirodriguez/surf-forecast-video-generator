/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarineData, WindData } from "./open-meteo-client";
import { TidePrediction } from "./noaa-tides-client";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { calculateSurfRating, WaveConditions } from "./rating-calculator";

export type SpotMetadata = {
  spotName: string;
  spotLocation: string;
  noaaStationId?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  brandName: string;
  logoUrl?: string;
  currentWaveHeightUnit: "ft" | "m";
  waterTempUnit: "C" | "F";
};

export interface ForecastSource {
  marineConditions: MarineData;
  windConditions: WindData;
  tidePredictions: TidePrediction[];
  waterTemperature: number | null;
  spotMetadata: SpotMetadata;
  targetDate: string;
}

export const transformToSurfProps = (source: ForecastSource): SurfForecastProps => {
  const { marineConditions, windConditions, spotMetadata, targetDate } = source;
  const targetMoment = new Date(targetDate);
  const safeIndex = resolveSafeTimeIndex(marineConditions, targetMoment);

  const averageConditions = calculateAverageConditions({ marineConditions, windConditions, safeIndex });

  return {
    ...mapMetadataToProps(spotMetadata, targetMoment),
    ...mapCurrentConditionsToProps({ source, averages: averageConditions, safeIndex }),
    overallRating: calculateSurfRating(averageConditions),
    hourlyForecast: mapToHourlyForecast(source, targetMoment),
    swellData: identifySwellComponents(marineConditions, spotMetadata.currentWaveHeightUnit, safeIndex),
    tides: resolveTidePredictions(source.tidePredictions),
    ...mapStyleToProps(spotMetadata),
  };
};

const resolveSafeTimeIndex = (marine: MarineData, date: Date): number => {
  const timeString = date.toISOString().substring(0, 13);
  const index = marine.hourly.time.findIndex((t) => t.startsWith(timeString));
  return index === -1 ? 0 : index;
};

const mapMetadataToProps = (metadata: SpotMetadata, date: Date) => ({
  spotName: metadata.spotName,
  spotLocation: metadata.spotLocation,
  date: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
});

const mapCurrentConditionsToProps = (params: {
  source: ForecastSource;
  averages: WaveConditions;
  safeIndex: number;
}) => {
  const { source, averages, safeIndex } = params;
  const { marineConditions, windConditions, spotMetadata, waterTemperature } = source;
  const currentWaterTemp = waterTemperature ?? windConditions.hourly.temperature_2m[safeIndex] ?? 18;

  return {
    currentWaveHeight: parseFloat(toUserWaveHeight(averages.heightInMeters, spotMetadata.currentWaveHeightUnit).toFixed(1)),
    currentWaveHeightUnit: spotMetadata.currentWaveHeightUnit,
    currentPeriod: Math.round(averages.periodInSeconds),
    currentDirection: degreesToCardinal(marineConditions.hourly.wave_direction[safeIndex]),
    currentDirectionDegrees: marineConditions.hourly.wave_direction[safeIndex],
    waterTemp: Math.round(toUserWaterTemperature(currentWaterTemp, spotMetadata.waterTempUnit)),
    waterTempUnit: spotMetadata.waterTempUnit,
    windSpeed: Math.round(averages.windSpeedInMph),
    windDirection: degreesToCardinal(windConditions.hourly.winddirection_10m[safeIndex]),
    windDirectionDegrees: windConditions.hourly.winddirection_10m[safeIndex],
  };
};

const mapStyleToProps = (metadata: SpotMetadata) => ({
  primaryColor: metadata.primaryColor,
  secondaryColor: metadata.secondaryColor,
  backgroundColor: metadata.backgroundColor,
  brandName: metadata.brandName,
  logoUrl: metadata.logoUrl,
});

export const degreesToCardinal = (degrees: number): string => {
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return cardinals[index];
};

function toUserWaveHeight(heightInMeters: number, unit: "ft" | "m"): number {
  return unit === "ft" ? heightInMeters * 3.28084 : heightInMeters;
}

function toUserWaterTemperature(tempInCelsius: number, unit: "C" | "F"): number {
  return unit === "F" ? (tempInCelsius * 9) / 5 + 32 : tempInCelsius;
}

function calculateAverageConditions(params: { marineConditions: MarineData; windConditions: WindData; safeIndex: number }): WaveConditions {
  const { marineConditions, windConditions, safeIndex } = params;
  const nextIndices = [safeIndex, safeIndex + 1].filter((i) => i < marineConditions.hourly.time.length);
  return {
    heightInMeters: nextIndices.reduce((acc, i) => acc + marineConditions.hourly.wave_height[i], 0) / nextIndices.length,
    periodInSeconds: nextIndices.reduce((acc, i) => acc + marineConditions.hourly.wave_period[i], 0) / nextIndices.length,
    windSpeedInMph: nextIndices.reduce((acc, i) => acc + windConditions.hourly.windspeed_10m[i], 0) / nextIndices.length,
  };
}

function mapToHourlyForecast(source: ForecastSource, date: Date): SurfForecastProps["hourlyForecast"] {
  const { marineConditions, spotMetadata } = source;
  const targetDayStr = date.toISOString().split("T")[0];
  const startHour = Math.max(date.getHours(), 6);
  const hourlyIndices = findHourlyIndices(marineConditions, targetDayStr, startHour);

  return hourlyIndices.map((index) => mapSingleHour(source, index));
}

function mapSingleHour(source: ForecastSource, index: number) {
  const { marineConditions, windConditions, spotMetadata } = source;
  const height = marineConditions.hourly.wave_height[index];
  const period = marineConditions.hourly.wave_period[index];
  const windSpeed = windConditions.hourly.windspeed_10m[index];
  return {
    hour: marineConditions.hourly.time[index].split("T")[1].substring(0, 5),
    waveHeight: parseFloat(toUserWaveHeight(height, spotMetadata.currentWaveHeightUnit).toFixed(1)),
    period: Math.round(period),
    windSpeed: Math.round(windSpeed),
    windDirection: degreesToCardinal(windConditions.hourly.winddirection_10m[index]),
    rating: calculateSurfRating({ heightInMeters: height, periodInSeconds: period, windSpeedInMph: windSpeed }),
  };
}

function findHourlyIndices(marine: MarineData, dayStr: string, startHour: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 8; i++) {
    const targetHour = startHour + i;
    const timeStr = `${dayStr}T${targetHour.toString().padStart(2, "0")}:00`;
    const index = marine.hourly.time.findIndex((t) => t.startsWith(timeStr));
    if (index !== -1) indices.push(index);
  }
  return indices;
}

function identifySwellComponents(marine: MarineData, unit: "ft" | "m", index: number): SurfForecastProps["swellData"] {
  const primarySwell = {
    height: parseFloat(toUserWaveHeight(marine.hourly.swell_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.swell_wave_period[index]),
    direction: degreesToCardinal(marine.hourly.swell_wave_direction[index]),
    directionDegrees: marine.hourly.swell_wave_direction[index],
  };

  const windWave = {
    height: parseFloat(toUserWaveHeight(marine.hourly.wind_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.wave_period[index] * 0.8),
    direction: degreesToCardinal(marine.hourly.wave_direction[index]),
    directionDegrees: marine.hourly.wave_direction[index],
  };

  return [primarySwell, windWave].filter((swell) => swell.height > 0);
}

function resolveTidePredictions(predictions: TidePrediction[]): SurfForecastProps["tides"] {
  if (predictions.length > 0) {
    return predictions.slice(0, 4);
  }
  return [
    { time: "06:00", height: 1.2, type: "high" },
    { time: "12:00", height: 0.4, type: "low" },
    { time: "18:00", height: 1.1, type: "high" },
    { time: "23:30", height: 0.5, type: "low" },
  ];
}
