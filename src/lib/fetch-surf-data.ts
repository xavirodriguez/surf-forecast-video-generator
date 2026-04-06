/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp } from "./noaa-tides-client";
import { transformToSurfProps, SpotMetadata } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

export const fetchSurfData = async (
  lat: number,
  lon: number,
  spotMetadata: SpotMetadata
): Promise<SurfForecastProps> => {
  const now = new Date();
  const noaaDateStr = formatDateToNoaaString(now);

  console.log(`Fetching data for ${spotMetadata.spotName} (${lat}, ${lon})...`);

  const environmentalData = await fetchEnvironmentalData(lat, lon);
  const tideAndTempData = await fetchTideAndTempData(
    spotMetadata.noaaStationId,
    noaaDateStr,
    environmentalData.windConditions.hourly.temperature_2m[0] ?? 18
  );

  const props = transformToSurfProps({
    ...environmentalData,
    ...tideAndTempData,
    spotMetadata,
    targetDate: now.toISOString(),
  });

  return surfForecastSchema.parse(props);
};

const formatDateToNoaaString = (date: Date): string => {
  return date.toISOString().split("T")[0].replace(/-/g, "");
};

const fetchEnvironmentalData = async (lat: number, lon: number) => {
  const [marineConditions, windConditions] = await Promise.all([
    fetchMarineData(lat, lon),
    fetchWindData(lat, lon),
  ]);
  return { marineConditions, windConditions };
};

const fetchTideAndTempData = async (
  noaaStationId: string | undefined,
  dateStr: string,
  fallbackWaterTemp: number
) => {
  if (!noaaStationId) {
    return { tidePredictions: [], waterTemperature: fallbackWaterTemp };
  }

  const [tidePredictions, waterTemperature] = await Promise.all([
    fetchTides(noaaStationId, dateStr),
    fetchWaterTemp(noaaStationId),
  ]);

  return { tidePredictions, waterTemperature: waterTemperature ?? fallbackWaterTemp };
};
