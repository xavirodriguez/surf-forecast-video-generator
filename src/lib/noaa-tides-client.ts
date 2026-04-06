/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TidePrediction = {
  time: string;
  height: number;
  type: "high" | "low";
};

const NOAA_API_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

function buildNoaaUrl(params: Record<string, string>): URL {
  const url = new URL(NOAA_API_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set("application", "surf_forecast");
  url.searchParams.set("format", "json");
  return url;
}

async function fetchFromNoaa(url: URL) {
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NOAA API request failed with status: ${response.status}`);
  }
  return response.json();
}

function calculateEndDate(dateStr: string): string {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));

  const date = new Date(year, month, day);
  date.setDate(date.getDate() + 2);

  return date.toISOString().split("T")[0].replace(/-/g, "");
}

export const fetchTides = async (stationId: string, date: string): Promise<TidePrediction[]> => {
  const endDate = calculateEndDate(date);
  const url = buildNoaaUrl({
    begin_date: date,
    end_date: endDate,
    station: stationId,
    product: "predictions",
    datum: "MLLW",
    time_zone: "lst_ldt",
    interval: "hilo",
    units: "metric",
  });

  const data = await fetchFromNoaa(url);

  if (!data.predictions) {
    throw new Error(`No tide predictions found for station ${stationId}`);
  }

  return data.predictions.map((prediction: any) => ({
    time: prediction.t,
    height: parseFloat(prediction.v),
    type: prediction.type === "H" ? "high" : "low",
  }));
};

export const fetchWaterTemp = async (stationId: string): Promise<number> => {
  const url = buildNoaaUrl({
    range: "24",
    station: stationId,
    product: "water_temperature",
    datum: "MLLW",
    time_zone: "lst_ldt",
    units: "metric",
  });

  const data = await fetchFromNoaa(url);

  if (!data.data || data.data.length === 0) {
    throw new Error(`No water temperature data found for station ${stationId}`);
  }

  const latestObservation = data.data[data.data.length - 1];
  return parseFloat(latestObservation.v);
};
