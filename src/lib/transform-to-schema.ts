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
  const { marineConditions, spotMetadata, targetDate } = rawForecastData;
  const targetMoment = new Date(targetDate);
  const targetTimeIndex = resolveTargetTimeIndex(marineConditions, targetMoment);
  const averageConditions = calculateAverageConditions(rawForecastData, targetTimeIndex);

  return {
    ...mapMetadataToProps(spotMetadata, targetMoment),
    ...mapCurrentConditionsToProps({ rawForecastData, averageConditions, targetTimeIndex }),
    overallRating: calculateSurfRating(averageConditions),
    hourlyForecast: mapHourlyForecast(rawForecastData, targetMoment),
    swellData: identifySwellComponents({ marineConditions, unit: spotMetadata.currentWaveHeightUnit, targetTimeIndex }),
    tides: resolveTidePredictions(rawForecastData.tidePredictions),
    ...mapStyleToProps(spotMetadata),
  };
};

const resolveTargetTimeIndex = (marine: MarineForecastResponse, date: Date): number => {
  const timeString = date.toISOString().substring(0, 13);
  const index = marine.hourly.time.findIndex((t) => t.startsWith(timeString));
  return index === -1 ? 0 : index;
};

const calculateAverageConditions = (
  rawForecastData: RawForecastData,
  targetTimeIndex: number
): WaveConditions => {
  const { marineConditions, windConditions } = rawForecastData;
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

interface CurrentConditionsMappingSource {
  rawForecastData: RawForecastData;
  averageConditions: WaveConditions;
  targetTimeIndex: number;
}

const mapCurrentConditionsToProps = (source: CurrentConditionsMappingSource) => {
  const { rawForecastData, averageConditions, targetTimeIndex } = source;
  const { currentWaveHeightUnit, waterTempUnit } = rawForecastData.spotMetadata;

  return {
    ...mapWaveConditions({ rawForecastData, averageConditions, targetTimeIndex }),
    ...mapWaterConditions(rawForecastData.waterTemperature, waterTempUnit),
    ...mapWindConditions({ rawForecastData, averageConditions, targetTimeIndex }),
  };
};

const mapWaveConditions = (source: CurrentConditionsMappingSource) => {
  const { rawForecastData, averageConditions, targetTimeIndex } = source;
  const { marineConditions, spotMetadata } = rawForecastData;
  const waveDirection = marineConditions.hourly.wave_direction[targetTimeIndex];
  const convertedHeight = convertMetersToUserUnit(averageConditions.heightInMeters, spotMetadata.currentWaveHeightUnit);

  return {
    currentWaveHeight: parseFloat(convertedHeight.toFixed(1)),
    currentWaveHeightUnit: spotMetadata.currentWaveHeightUnit,
    currentPeriod: Math.round(averageConditions.periodInSeconds),
    currentDirection: degreesToCardinal(waveDirection),
    currentDirectionDegrees: waveDirection,
  };
};

const mapWaterConditions = (waterTemperature: number, unit: "C" | "F") => ({
  waterTemp: Math.round(convertCelsiusToUserUnit(waterTemperature, unit)),
  waterTempUnit: unit,
});

const mapWindConditions = (source: CurrentConditionsMappingSource) => {
  const { rawForecastData, averageConditions, targetTimeIndex } = source;
  const windDirection = rawForecastData.windConditions.hourly.winddirection_10m[targetTimeIndex];

  return {
    windSpeed: Math.round(averageConditions.windSpeedInMph),
    windDirection: degreesToCardinal(windDirection),
    windDirectionDegrees: windDirection,
  };
};

const mapHourlyForecast = (rawForecastData: RawForecastData, date: Date): SurfForecastProps["hourlyForecast"] => {
  const targetDayStr = date.toISOString().split("T")[0];
  const startHour = Math.max(date.getHours(), 6);
  const hourlyIndices = findHourlyIndices({ marine: rawForecastData.marineConditions, dayStr: targetDayStr, startHour });

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

interface HourlyIndexLookupParams {
  marine: MarineForecastResponse;
  dayStr: string;
  startHour: number;
}

const findHourlyIndices = (params: HourlyIndexLookupParams): number[] => {
  const { marine, dayStr, startHour } = params;
  const indices: number[] = [];
  for (let i = 0; i < 8; i++) {
    const targetHour = startHour + i;
    const timeStr = `${dayStr}T${targetHour.toString().padStart(2, "0")}:00`;
    const index = marine.hourly.time.findIndex((t) => t.startsWith(timeStr));
    if (index !== -1) indices.push(index);
  }
  return indices;
};

interface SwellMappingSource {
  marineConditions: MarineForecastResponse;
  unit: "ft" | "m";
  targetTimeIndex: number;
}

const identifySwellComponents = (source: SwellMappingSource): SurfForecastProps["swellData"] => {
  const swellComponents = [
    mapPrimarySwell(source),
    mapWindWave(source),
  ];
  return swellComponents.filter((swell) => swell.height > 0);
};

const mapPrimarySwell = (source: SwellMappingSource) => {
  const { marineConditions, unit, targetTimeIndex } = source;
  const height = marineConditions.hourly.swell_wave_height[targetTimeIndex];
  const period = marineConditions.hourly.swell_wave_period[targetTimeIndex];
  const direction = marineConditions.hourly.swell_wave_direction[targetTimeIndex];

  return {
    height: parseFloat(convertMetersToUserUnit(height, unit).toFixed(1)),
    period: Math.round(period),
    direction: degreesToCardinal(direction),
    directionDegrees: direction,
  };
};

const mapWindWave = (source: SwellMappingSource) => {
  const { marineConditions, unit, targetTimeIndex } = source;
  const height = marineConditions.hourly.wind_wave_height[targetTimeIndex];
  const period = marineConditions.hourly.wave_period[targetTimeIndex] * 0.8;
  const direction = marineConditions.hourly.wave_direction[targetTimeIndex];

  return {
    height: parseFloat(convertMetersToUserUnit(height, unit).toFixed(1)),
    period: Math.round(period),
    direction: degreesToCardinal(direction),
    directionDegrees: direction,
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
