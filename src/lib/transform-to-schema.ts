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
      rating: ratingFromWaveData({ height, period, windSpeed }),
    };
  });
}

function extractSwellData(params: TransformParams, currentTimeIndex: number): SurfForecastProps["swellData"] {
  const { marineData, spotMeta } = params;
  const unit = spotMeta.currentWaveHeightUnit;

  const swell = {
    height: parseFloat(convertWaveHeight(marineData.hourly.swell_wave_height[currentTimeIndex], unit).toFixed(1)),
    period: Math.round(marineData.hourly.swell_wave_period[currentTimeIndex]),
    direction: degreesToCardinal(marineData.hourly.swell_wave_direction[currentTimeIndex]),
    directionDegrees: marineData.hourly.swell_wave_direction[currentTimeIndex],
  };

  const windWave = {
    height: parseFloat(convertWaveHeight(marineData.hourly.wind_wave_height[currentTimeIndex], unit).toFixed(1)),
    period: Math.round(marineData.hourly.wave_period[currentTimeIndex] * 0.8),
    direction: degreesToCardinal(marineData.hourly.wave_direction[currentTimeIndex]),
    directionDegrees: marineData.hourly.wave_direction[currentTimeIndex],
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

function getCurrentTimeIndex(times: string[], targetDate: string): number {
  const timePrefix = targetDate.substring(0, 13);
  const index = times.findIndex((t) => t.startsWith(timePrefix));
  return index === -1 ? 0 : index;
}

function calculateCurrentAverages(marineData: MarineData, windData: WindData, currentIndex: number) {
  const indices = [currentIndex, currentIndex + 1].filter((i) => i < marineData.hourly.time.length);
  const sum = (arr: number[]) => indices.reduce((acc, i) => acc + arr[i], 0);
  return {
    avgHeight: sum(marineData.hourly.wave_height) / indices.length,
    avgPeriod: sum(marineData.hourly.wave_period) / indices.length,
    avgWind: sum(windData.hourly.windspeed_10m) / indices.length,
  };
}

function getEffectiveWaterTemp(waterTemp: number | null, windData: WindData, currentIndex: number): number {
  return waterTemp || windData.hourly.temperature_2m[currentIndex] || 18;
}

export const transformToSurfProps = (params: TransformParams): SurfForecastProps => {
  const { marineData, windData, tidesData, waterTemp, spotMeta, targetDate } = params;
  const now = new Date(targetDate);
  const startHour = Math.max(now.getHours(), 6);
  const hourlyIndices = getHourlyIndices(marineData, now.toISOString().split("T")[0], startHour);

  const currentTimeIndex = getCurrentTimeIndex(marineData.hourly.time, now.toISOString());
  const averages = calculateCurrentAverages(marineData, windData, currentTimeIndex);
  const currentWaterTemp = getEffectiveWaterTemp(waterTemp, windData, currentTimeIndex);

  return {
    spotName: spotMeta.spotName,
    spotLocation: spotMeta.spotLocation,
    date: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    currentWaveHeight: parseFloat(convertWaveHeight(averages.avgHeight, spotMeta.currentWaveHeightUnit).toFixed(1)),
    currentWaveHeightUnit: spotMeta.currentWaveHeightUnit,
    currentPeriod: Math.round(averages.avgPeriod),
    currentDirection: degreesToCardinal(marineData.hourly.wave_direction[currentTimeIndex]),
    currentDirectionDegrees: marineData.hourly.wave_direction[currentTimeIndex],
    waterTemp: Math.round(convertWaterTemp(currentWaterTemp, spotMeta.waterTempUnit)),
    waterTempUnit: spotMeta.waterTempUnit,
    windSpeed: Math.round(averages.avgWind),
    windDirection: degreesToCardinal(windData.hourly.winddirection_10m[currentTimeIndex]),
    windDirectionDegrees: windData.hourly.winddirection_10m[currentTimeIndex],
    overallRating: ratingFromWaveData({ height: averages.avgHeight, period: averages.avgPeriod, windSpeed: averages.avgWind }),
    hourlyForecast: formatHourlyForecast(params, hourlyIndices),
    swellData: extractSwellData(params, currentTimeIndex),
    tides: getTidesOrDefault(tidesData),
    primaryColor: spotMeta.primaryColor,
    secondaryColor: spotMeta.secondaryColor,
    backgroundColor: spotMeta.backgroundColor,
    brandName: spotMeta.brandName,
    logoUrl: spotMeta.logoUrl,
  };
};
