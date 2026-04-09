/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp, formatDateToNoaaString } from "./noaa-tides-client";
import { transformToSurfProps, SpotMetadata, RawForecastData } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

export const fetchSurfData = async (request: {
  lat: number;
  lon: number;
  spotMetadata: SpotMetadata;
}): Promise<SurfForecastProps> => {
  const { lat, lon, spotMetadata } = request;
  const now = new Date();

  const environmentalData = await fetchEnvironmentalData(lat, lon);
  const tideAndTempData = await fetchTideAndTempData({
    noaaStationId: spotMetadata.noaaStationId,
    dateStr: formatDateToNoaaString(now),
    fallbackWaterTemp: environmentalData.windConditions.hourly.temperature_2m[0] ?? 18
  });

  const rawForecastData: RawForecastData = {
    ...environmentalData,
    ...tideAndTempData,
    spotMetadata,
    targetDate: now.toISOString(),
  };

  return composeAndValidateProps(rawForecastData);
};

const composeAndValidateProps = (rawForecastData: RawForecastData): SurfForecastProps => {
  const props = transformToSurfProps(rawForecastData);
  return surfForecastSchema.parse(props);
};

const fetchEnvironmentalData = async (lat: number, lon: number) => {
  const [marineConditions, windConditions] = await Promise.all([
    fetchMarineData(lat, lon),
    fetchWindData(lat, lon),
  ]);
  return { marineConditions, windConditions };
};

const fetchTideAndTempData = async (params: {
  noaaStationId: string | undefined;
  dateStr: string;
  fallbackWaterTemp: number;
}) => {
  const { noaaStationId, dateStr, fallbackWaterTemp } = params;
  if (!noaaStationId) {
    return { tidePredictions: [], waterTemperature: fallbackWaterTemp };
  }

  const [tidePredictions, waterTemperature] = await Promise.all([
    fetchTides(noaaStationId, dateStr),
    fetchWaterTemp(noaaStationId),
  ]);

  return { tidePredictions, waterTemperature: waterTemperature ?? fallbackWaterTemp };
};
