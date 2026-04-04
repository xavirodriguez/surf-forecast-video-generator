/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp } from "./noaa-tides-client";
import { transformToSurfProps, SpotMeta } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

async function fetchNoaaData(noaaStationId: string, dateStr: string) {
  return Promise.all([
    fetchTides(noaaStationId, dateStr),
    fetchWaterTemp(noaaStationId),
  ]);
}

export const fetchSurfData = async (lat: number, lon: number, spotMeta: SpotMeta): Promise<SurfForecastProps> => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

  console.log(`Fetching data for ${spotMeta.spotName} (${lat}, ${lon})...`);

  const [marineData, windData] = await Promise.all([
    fetchMarineData(lat, lon),
    fetchWindData(lat, lon),
  ]);

  let tidesData: any[] = [];
  let waterTemp: number | null = null;

  if (spotMeta.noaaStationId) {
    [tidesData, waterTemp] = await fetchNoaaData(spotMeta.noaaStationId, dateStr);
  }

  const props = transformToSurfProps({
    marineData,
    windData,
    tidesData,
    waterTemp,
    spotMeta,
    targetDate: now.toISOString(),
  });

  return surfForecastSchema.parse(props);
};
