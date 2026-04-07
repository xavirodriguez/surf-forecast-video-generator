/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp, formatDateToNoaaString } from "./noaa-tides-client";
import { transformToSurfProps, SpotMetadata, ForecastSource } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

export const fetchSurfData = async (
  lat: number,
  lon: number,
  spotMetadata: SpotMetadata
): Promise<SurfForecastProps> => {
  const now = new Date();

  console.log(`Fetching data for ${spotMetadata.spotName} (${lat}, ${lon})...`);

  const environmentalData = await fetchEnvironmentalData(lat, lon);
  const tideAndTempData = await fetchTideAndTempData(
    spotMetadata.noaaStationId,
    formatDateToNoaaString(now),
    environmentalData.windConditions.hourly.temperature_2m[0] ?? 18
  );

  return composeAndValidateProps({
    ...environmentalData,
    ...tideAndTempData,
    spotMetadata,
    targetDate: now.toISOString(),
  });
};

function composeAndValidateProps(forecastSource: ForecastSource): SurfForecastProps {
  const props = transformToSurfProps(forecastSource);
  return surfForecastSchema.parse(props);
}

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
