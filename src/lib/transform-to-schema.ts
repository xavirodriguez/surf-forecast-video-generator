/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarineData, WindData } from "./open-meteo-client";
import { TidePrediction } from "./noaa-tides-client";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { ratingFromWaveData } from "./rating-calculator";

export type SpotMeta = {
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

export interface TransformParams {
  marineData: MarineData;
  windData: WindData;
  tidesData: TidePrediction[];
  waterTemp: number | null;
  spotMeta: SpotMeta;
  targetDate: string;
}

export const degreesToCardinal = (degrees: number): string => {
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return cardinals[index];
};

function convertWaveHeight(height: number, unit: "ft" | "m"): number {
  return unit === "ft" ? height * 3.28084 : height;
}

function convertWaterTemp(temp: number, unit: "C" | "F"): number {
  return unit === "F" ? (temp * 9) / 5 + 32 : temp;
}

function getHourlyIndices(marineData: MarineData, targetDayStr: string, startHour: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 8; i++) {
    const targetHour = startHour + i;
    const timeStr = `${targetDayStr}T${targetHour.toString().padStart(2, "0")}:00`;
    const index = marineData.hourly.time.findIndex((t) => t.startsWith(timeStr));
    if (index !== -1) indices.push(index);
  }
  return indices;
}

function formatHourlyForecast(params: TransformParams, hourlyIndices: number[]): SurfForecastProps["hourlyForecast"] {
  const { marineData, windData, spotMeta } = params;
  return hourlyIndices.map((index) => {
    const height = marineData.hourly.wave_height[index];
    const period = marineData.hourly.wave_period[index];
    const windSpeed = windData.hourly.windspeed_10m[index];
    return {
      hour: marineData.hourly.time[index].split("T")[1].substring(0, 5),
      waveHeight: parseFloat(convertWaveHeight(height, spotMeta.currentWaveHeightUnit).toFixed(1)),
      period: Math.round(period),
      windSpeed: Math.round(windSpeed),
      windDirection: degreesToCardinal(windData.hourly.winddirection_10m[index]),
      rating: ratingFromWaveData(height, period, windSpeed),
    };
  });
}

function extractSwellData(params: TransformParams, safeIndex: number): SurfForecastProps["swellData"] {
  const { marineData, spotMeta } = params;
  const unit = spotMeta.currentWaveHeightUnit;

  const swell = {
    height: parseFloat(convertWaveHeight(marineData.hourly.swell_wave_height[safeIndex], unit).toFixed(1)),
    period: Math.round(marineData.hourly.swell_wave_period[safeIndex]),
    direction: degreesToCardinal(marineData.hourly.swell_wave_direction[safeIndex]),
    directionDegrees: marineData.hourly.swell_wave_direction[safeIndex],
  };

  const windWave = {
    height: parseFloat(convertWaveHeight(marineData.hourly.wind_wave_height[safeIndex], unit).toFixed(1)),
    period: Math.round(marineData.hourly.wave_period[safeIndex] * 0.8),
    direction: degreesToCardinal(marineData.hourly.wave_direction[safeIndex]),
    directionDegrees: marineData.hourly.wave_direction[safeIndex],
  };

  return [swell, windWave].filter((s) => s.height > 0);
}

function getTidesOrDefault(tidesData: TidePrediction[]): SurfForecastProps["tides"] {
  if (tidesData.length > 0) {
    return tidesData.slice(0, 4);
  }
  return [
    { time: "06:00", height: 1.2, type: "high" },
    { time: "12:00", height: 0.4, type: "low" },
    { time: "18:00", height: 1.1, type: "high" },
    { time: "23:30", height: 0.5, type: "low" },
  ];
}

export const transformToSurfProps = (params: TransformParams): SurfForecastProps => {
  const { marineData, windData, tidesData, waterTemp, spotMeta, targetDate } = params;
  const now = new Date(targetDate);
  const targetDayStr = now.toISOString().split("T")[0];
  const startHour = Math.max(now.getHours(), 6);

  const hourlyIndices = getHourlyIndices(marineData, targetDayStr, startHour);
  const currentIndex = marineData.hourly.time.findIndex((t) => t.startsWith(now.toISOString().substring(0, 13)));
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const nextIndices = [safeIndex, safeIndex + 1].filter((i) => i < marineData.hourly.time.length);
  const avgHeight = nextIndices.reduce((acc, i) => acc + marineData.hourly.wave_height[i], 0) / nextIndices.length;
  const avgPeriod = nextIndices.reduce((acc, i) => acc + marineData.hourly.wave_period[i], 0) / nextIndices.length;
  const avgWind = nextIndices.reduce((acc, i) => acc + windData.hourly.windspeed_10m[i], 0) / nextIndices.length;

  const currentWaterTemp = waterTemp || windData.hourly.temperature_2m[safeIndex] || 18;

  return {
    spotName: spotMeta.spotName,
    spotLocation: spotMeta.spotLocation,
    date: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    currentWaveHeight: parseFloat(convertWaveHeight(avgHeight, spotMeta.currentWaveHeightUnit).toFixed(1)),
    currentWaveHeightUnit: spotMeta.currentWaveHeightUnit,
    currentPeriod: Math.round(avgPeriod),
    currentDirection: degreesToCardinal(marineData.hourly.wave_direction[safeIndex]),
    currentDirectionDegrees: marineData.hourly.wave_direction[safeIndex],
    waterTemp: Math.round(convertWaterTemp(currentWaterTemp, spotMeta.waterTempUnit)),
    waterTempUnit: spotMeta.waterTempUnit,
    windSpeed: Math.round(avgWind),
    windDirection: degreesToCardinal(windData.hourly.winddirection_10m[safeIndex]),
    windDirectionDegrees: windData.hourly.winddirection_10m[safeIndex],
    overallRating: ratingFromWaveData(avgHeight, avgPeriod, avgWind),
    hourlyForecast: formatHourlyForecast(params, hourlyIndices),
    swellData: extractSwellData(params, safeIndex),
    tides: getTidesOrDefault(tidesData),
    primaryColor: spotMeta.primaryColor,
    secondaryColor: spotMeta.secondaryColor,
    backgroundColor: spotMeta.backgroundColor,
    brandName: spotMeta.brandName,
    logoUrl: spotMeta.logoUrl,
  };
};
