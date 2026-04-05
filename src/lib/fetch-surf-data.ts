/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp } from "./noaa-tides-client";
import { transformToSurfProps, SpotMetadata } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

async function fetchNoaaData(noaaStationId: string, dateStr: string) {
  return Promise.all([
    fetchTides(noaaStationId, dateStr),
    fetchWaterTemp(noaaStationId),
  ]);
}

export const fetchSurfData = async (lat: number, lon: number, spotMetadata: SpotMetadata): Promise<SurfForecastProps> => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

  console.log(`Fetching data for ${spotMetadata.spotName} (${lat}, ${lon})...`);

  const [marineConditions, windConditions] = await Promise.all([
    fetchMarineData(lat, lon),
    fetchWindData(lat, lon),
  ]);

  let tidePredictions: any[] = [];
  let waterTemperature: number | null = null;

  if (spotMetadata.noaaStationId) {
    [tidePredictions, waterTemperature] = await fetchNoaaData(spotMetadata.noaaStationId, dateStr);
  }

  const props = transformToSurfProps({
    marineConditions,
    windConditions,
    tidePredictions,
    waterTemperature,
    spotMetadata,
    targetDate: now.toISOString(),
  });

  return surfForecastSchema.parse(props);
};
