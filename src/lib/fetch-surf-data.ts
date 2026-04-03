import { fetchMarineData, fetchWindData } from "./open-meteo-client";
import { fetchTides, fetchWaterTemp } from "./noaa-tides-client";
import { transformToSurfProps, SpotMeta } from "./transform-to-schema";
import { SurfForecastProps, surfForecastSchema } from "../schemas/surf-forecast";

export const fetchSurfData = async (lat: number, lon: number, spotMeta: SpotMeta): Promise<SurfForecastProps> => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

  console.log(`Fetching data for ${spotMeta.spotName} (${lat}, ${lon})...`);

  const [marineData, windData, tidesData, waterTemp] = await Promise.all([
    fetchMarineData(lat, lon),
    fetchWindData(lat, lon),
    spotMeta.noaaStationId ? fetchTides(spotMeta.noaaStationId, dateStr) : Promise.resolve([]),
    spotMeta.noaaStationId ? fetchWaterTemp(spotMeta.noaaStationId) : Promise.resolve(null),
  ]);

  const props = transformToSurfProps(marineData, windData, tidesData, waterTemp, spotMeta, now.toISOString());

  try {
    return surfForecastSchema.parse(props);
  } catch (e: any) {
    console.error("Validation failed for SurfForecastProps:", e.errors);
    throw new Error(`Invalid surf data generated: ${JSON.stringify(e.errors)}`);
  }
};
