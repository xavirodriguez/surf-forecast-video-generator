/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarineForecastResponse, WindForecastResponse } from "./open-meteo-client";
import { TidePrediction } from "./noaa-tides-client";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { calculateSurfRating, WaveConditions } from "./rating-calculator";
import { convertCelsiusToUserUnit, convertMetersToUserUnit } from "./conversions";
import { averageArray } from "./math-utils";
import { degreesToCardinal } from "./geo-utils";

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

export interface RawForecastData {
  marineConditions: MarineForecastResponse;
  windConditions: WindForecastResponse;
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

export const transformToSurfProps = (rawForecastData: RawForecastData): SurfForecastProps => {
  const { marineConditions, windConditions, spotMetadata, targetDate } = rawForecastData;
  const targetMoment = new Date(targetDate);
  const targetTimeIndex = resolveTargetTimeIndex(marineConditions, targetMoment);

  const averageConditions = calculateAverageConditions({ marineConditions, windConditions, targetTimeIndex });

  return {
    ...mapMetadataToProps(spotMetadata, targetMoment),
    ...mapCurrentConditionsToProps({ rawForecastData, averages: averageConditions, targetTimeIndex }),
    overallRating: calculateSurfRating(averageConditions),
    hourlyForecast: mapHourlyForecast(rawForecastData, targetMoment),
    swellData: identifySwellComponents({ marine: marineConditions, unit: spotMetadata.currentWaveHeightUnit, index: targetTimeIndex }),
    tides: resolveTidePredictions(rawForecastData.tidePredictions),
    ...mapStyleToProps(spotMetadata),
  };
};

const resolveTargetTimeIndex = (marine: MarineForecastResponse, date: Date): number => {
  const timeString = date.toISOString().substring(0, 13);
  const index = marine.hourly.time.findIndex((t) => t.startsWith(timeString));
  return index === -1 ? 0 : index;
};

const calculateAverageConditions = (context: {
  marineConditions: MarineForecastResponse;
  windConditions: WindForecastResponse;
  targetTimeIndex: number;
}): WaveConditions => {
  const { marineConditions, windConditions, targetTimeIndex } = context;
  const indices = [targetTimeIndex, targetTimeIndex + 1]
    .filter((i) => i < marineConditions.hourly.time.length);

  return {
    heightInMeters: averageArray(indices.map((i) => marineConditions.hourly.wave_height[i])),
    periodInSeconds: averageArray(indices.map((i) => marineConditions.hourly.wave_period[i])),
    windSpeedInMph: averageArray(indices.map((i) => windConditions.hourly.windspeed_10m[i])),
  };
};

const mapMetadataToProps = (metadata: SpotMetadata, date: Date) => ({
  spotName: metadata.spotName,
  spotLocation: metadata.spotLocation,
  date: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
});

const mapCurrentConditionsToProps = (context: {
  rawForecastData: RawForecastData;
  averages: WaveConditions;
  targetTimeIndex: number;
}) => {
  const { rawForecastData, averages, targetTimeIndex } = context;
  const { marineConditions, windConditions, spotMetadata } = rawForecastData;
  const { currentWaveHeightUnit, waterTempUnit } = spotMetadata;

  return {
    ...mapWaveConditions({ averages, unit: currentWaveHeightUnit, targetTimeIndex, marineConditions }),
    ...mapWaterConditions(rawForecastData.waterTemperature, waterTempUnit),
    ...mapWindConditions({ averages, targetTimeIndex, windConditions }),
  };
};

const mapWaveConditions = (context: {
  averages: WaveConditions;
  unit: "ft" | "m";
  targetTimeIndex: number;
  marineConditions: MarineForecastResponse;
}) => {
  const { averages, unit, targetTimeIndex, marineConditions } = context;
  const waveDirection = marineConditions.hourly.wave_direction[targetTimeIndex];
  const convertedHeight = convertMetersToUserUnit(averages.heightInMeters, unit);

  return {
    currentWaveHeight: parseFloat(convertedHeight.toFixed(1)),
    currentWaveHeightUnit: unit,
    currentPeriod: Math.round(averages.periodInSeconds),
    currentDirection: degreesToCardinal(waveDirection),
    currentDirectionDegrees: waveDirection,
  };
};

const mapWaterConditions = (waterTemperature: number, unit: "C" | "F") => ({
  waterTemp: Math.round(convertCelsiusToUserUnit(waterTemperature, unit)),
  waterTempUnit: unit,
});

const mapWindConditions = (context: {
  averages: WaveConditions;
  targetTimeIndex: number;
  windConditions: WindForecastResponse;
}) => {
  const { averages, targetTimeIndex, windConditions } = context;
  const windDirection = windConditions.hourly.winddirection_10m[targetTimeIndex];

  return {
    windSpeed: Math.round(averages.windSpeedInMph),
    windDirection: degreesToCardinal(windDirection),
    windDirectionDegrees: windDirection,
  };
};

const mapHourlyForecast = (rawForecastData: RawForecastData, date: Date): SurfForecastProps["hourlyForecast"] => {
  const targetDayStr = date.toISOString().split("T")[0];
  const startHour = Math.max(date.getHours(), 6);
  const hourlyIndices = findHourlyIndices({
    marine: rawForecastData.marineConditions,
    dayStr: targetDayStr,
    startHour,
  });

  return hourlyIndices.map((index) => mapSingleHour(rawForecastData, index));
};

const mapSingleHour = (rawForecastData: RawForecastData, index: number) => {
  const { marineConditions, windConditions, spotMetadata } = rawForecastData;
  const height = marineConditions.hourly.wave_height[index];
  const period = marineConditions.hourly.wave_period[index];
  const windSpeed = windConditions.hourly.windspeed_10m[index];
  const windDirection = windConditions.hourly.winddirection_10m[index];

  return {
    hour: marineConditions.hourly.time[index].split("T")[1].substring(0, 5),
    waveHeight: parseFloat(convertMetersToUserUnit(height, spotMetadata.currentWaveHeightUnit).toFixed(1)),
    period: Math.round(period),
    windSpeed: Math.round(windSpeed),
    windDirection: degreesToCardinal(windDirection),
    rating: calculateSurfRating({ heightInMeters: height, periodInSeconds: period, windSpeedInMph: windSpeed }),
  };
};

const findHourlyIndices = (context: {
  marine: MarineForecastResponse;
  dayStr: string;
  startHour: number;
}): number[] => {
  const { marine, dayStr, startHour } = context;
  const indices: number[] = [];
  for (let i = 0; i < 8; i++) {
    const targetHour = startHour + i;
    const timeStr = `${dayStr}T${targetHour.toString().padStart(2, "0")}:00`;
    const index = marine.hourly.time.findIndex((t) => t.startsWith(timeStr));
    if (index !== -1) indices.push(index);
  }
  return indices;
};

const identifySwellComponents = (context: {
  marine: MarineForecastResponse;
  unit: "ft" | "m";
  index: number;
}): SurfForecastProps["swellData"] => {
  const { marine, unit, index } = context;
  const swellComponents = [
    mapPrimarySwell({ marine, unit, index }),
    mapWindWave({ marine, unit, index }),
  ];
  return swellComponents.filter((swell) => swell.height > 0);
};

const mapPrimarySwell = (context: { marine: MarineForecastResponse; unit: "ft" | "m"; index: number }) => {
  const { marine, unit, index } = context;
  return {
    height: parseFloat(convertMetersToUserUnit(marine.hourly.swell_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.swell_wave_period[index]),
    direction: degreesToCardinal(marine.hourly.swell_wave_direction[index]),
    directionDegrees: marine.hourly.swell_wave_direction[index],
  };
};

const mapWindWave = (context: { marine: MarineForecastResponse; unit: "ft" | "m"; index: number }) => {
  const { marine, unit, index } = context;
  return {
    height: parseFloat(convertMetersToUserUnit(marine.hourly.wind_wave_height[index], unit).toFixed(1)),
    period: Math.round(marine.hourly.wave_period[index] * 0.8),
    direction: degreesToCardinal(marine.hourly.wave_direction[index]),
    directionDegrees: marine.hourly.wave_direction[index],
  };
};

const resolveTidePredictions = (predictions: TidePrediction[]): SurfForecastProps["tides"] => {
  if (predictions.length > 0) {
    return predictions.slice(0, 4);
  }
  return FALLBACK_TIDE_PREDICTIONS;
};

const mapStyleToProps = (metadata: SpotMetadata) => ({
  primaryColor: metadata.primaryColor,
  secondaryColor: metadata.secondaryColor,
  backgroundColor: metadata.backgroundColor,
  brandName: metadata.brandName,
  logoUrl: metadata.logoUrl,
});
