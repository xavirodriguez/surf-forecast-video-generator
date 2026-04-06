/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarineData, WindData } from "./open-meteo-client";
import { TidePrediction } from "./noaa-tides-client";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { calculateSurfRating, WaveConditions } from "./rating-calculator";
import { convertCelsiusToUserUnit, convertMetersToUserUnit } from "./conversions";

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
  waterTemperature: number;
  spotMetadata: SpotMetadata;
  targetDate: string;
}

const FALLBACK_TIDE_PREDICTIONS: SurfForecastProps["tides"] = [
  { time: "06:00", height: 1.2, type: "high" },
  { time: "12:00", height: 0.4, type: "low" },
  { time: "18:00", height: 1.1, type: "high" },
  { time: "23:30", height: 0.5, type: "low" },
];

export const transformToSurfProps = (forecastSource: ForecastSource): SurfForecastProps => {
  const { marineConditions, windConditions, spotMetadata, targetDate } = forecastSource;
  const targetMoment = new Date(targetDate);
  const targetTimeIndex = resolveTargetTimeIndex(marineConditions, targetMoment);

  const averageConditions = calculateAverageConditions({ marineConditions, windConditions, targetTimeIndex });

  return {
    ...mapMetadataToProps(spotMetadata, targetMoment),
    ...mapCurrentConditionsToProps({ forecastSource, averages: averageConditions, targetTimeIndex }),
    overallRating: calculateSurfRating(averageConditions),
    hourlyForecast: mapToHourlyForecast(forecastSource, targetMoment),
    swellData: identifySwellComponents(marineConditions, spotMetadata.currentWaveHeightUnit, targetTimeIndex),
    tides: resolveTidePredictions(forecastSource.tidePredictions),
    ...mapStyleToProps(spotMetadata),
  };
};

const resolveTargetTimeIndex = (marine: MarineData, date: Date): number => {
  const timeString = date.toISOString().substring(0, 13);
  const index = marine.hourly.time.findIndex((t) => t.startsWith(timeString));
  return index === -1 ? 0 : index;
};

const mapMetadataToProps = (metadata: SpotMetadata, date: Date) => ({
  spotName: metadata.spotName,
  spotLocation: metadata.spotLocation,
  date: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
});

const mapCurrentConditionsToProps = (mappingContext: {
  forecastSource: ForecastSource;
  averages: WaveConditions;
  targetTimeIndex: number;
}) => {
  const { forecastSource, averages, targetTimeIndex } = mappingContext;
  const { marineConditions, windConditions, spotMetadata } = forecastSource;

  return {
    ...mapWaveConditions(averages, spotMetadata.currentWaveHeightUnit, targetTimeIndex, marineConditions),
    ...mapWaterConditions(forecastSource, targetTimeIndex),
    ...mapWindConditions(averages, targetTimeIndex, windConditions),
  };
};

const mapWaveConditions = (
  averages: WaveConditions,
  unit: "ft" | "m",
  targetTimeIndex: number,
  marineConditions: MarineData
) => ({
  currentWaveHeight: parseFloat(convertMetersToUserUnit(averages.heightInMeters, unit).toFixed(1)),
  currentWaveHeightUnit: unit,
  currentPeriod: Math.round(averages.periodInSeconds),
  currentDirection: degreesToCardinal(marineConditions.hourly.wave_direction[targetTimeIndex]),
  currentDirectionDegrees: marineConditions.hourly.wave_direction[targetTimeIndex],
});

const mapWaterConditions = (forecastSource: ForecastSource, targetTimeIndex: number) => {
  const { waterTemperature, spotMetadata } = forecastSource;
  return {
    waterTemp: Math.round(convertCelsiusToUserUnit(waterTemperature, spotMetadata.waterTempUnit)),
    waterTempUnit: spotMetadata.waterTempUnit,
  };
};

const mapWindConditions = (averages: WaveConditions, targetTimeIndex: number, windConditions: WindData) => ({
  windSpeed: Math.round(averages.windSpeedInMph),
  windDirection: degreesToCardinal(windConditions.hourly.winddirection_10m[targetTimeIndex]),
  windDirectionDegrees: windConditions.hourly.winddirection_10m[targetTimeIndex],
});

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

function calculateAverageConditions(mappingContext: {
  marineConditions: MarineData;
  windConditions: WindData;
  targetTimeIndex: number;
}): WaveConditions {
  const { marineConditions, windConditions, targetTimeIndex } = mappingContext;
  const nextIndices = [targetTimeIndex, targetTimeIndex + 1].filter((i) => i < marineConditions.hourly.time.length);
  return {
    heightInMeters: nextIndices.reduce((acc, i) => acc + marineConditions.hourly.wave_height[i], 0) / nextIndices.length,
    periodInSeconds: nextIndices.reduce((acc, i) => acc + marineConditions.hourly.wave_period[i], 0) / nextIndices.length,
    windSpeedInMph: nextIndices.reduce((acc, i) => acc + windConditions.hourly.windspeed_10m[i], 0) / nextIndices.length,
  };
}

function mapToHourlyForecast(forecastSource: ForecastSource, date: Date): SurfForecastProps["hourlyForecast"] {
  const targetDayStr = date.toISOString().split("T")[0];
  const startHour = Math.max(date.getHours(), 6);
  const hourlyIndices = findHourlyIndices(forecastSource.marineConditions, targetDayStr, startHour);

  return hourlyIndices.map((index) => mapSingleHour(forecastSource, index));
}

function mapSingleHour(forecastSource: ForecastSource, index: number) {
  const { marineConditions, windConditions, spotMetadata } = forecastSource;
  const height = marineConditions.hourly.wave_height[index];
  const period = marineConditions.hourly.wave_period[index];
  const windSpeed = windConditions.hourly.windspeed_10m[index];
  return {
    hour: marineConditions.hourly.time[index].split("T")[1].substring(0, 5),
    waveHeight: parseFloat(convertMetersToUserUnit(height, spotMetadata.currentWaveHeightUnit).toFixed(1)),
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
  return [
    mapPrimarySwell(marine, unit, index),
    mapWindWave(marine, unit, index)
  ].filter((swell) => swell.height > 0);
}

function mapPrimarySwell(marine: MarineData, unit: "ft" | "m", index: number) {
  return {
    height: parseFloat(convertMetersToUserUnit(marine.hourly.swell_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.swell_wave_period[index]),
    direction: degreesToCardinal(marine.hourly.swell_wave_direction[index]),
    directionDegrees: marine.hourly.swell_wave_direction[index],
  };
}

function mapWindWave(marine: MarineData, unit: "ft" | "m", index: number) {
  return {
    height: parseFloat(convertMetersToUserUnit(marine.hourly.wind_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.wave_period[index] * 0.8),
    direction: degreesToCardinal(marine.hourly.wave_direction[index]),
    directionDegrees: marine.hourly.wave_direction[index],
  };
}

function resolveTidePredictions(predictions: TidePrediction[]): SurfForecastProps["tides"] {
  if (predictions.length > 0) {
    return predictions.slice(0, 4);
  }
  return FALLBACK_TIDE_PREDICTIONS;
}
