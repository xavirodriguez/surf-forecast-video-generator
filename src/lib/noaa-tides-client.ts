/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TidePrediction = {
  time: string;
  height: number;
  type: "high" | "low";
};

interface NoaaTidePrediction {
  t: string;
  v: string;
  type: "H" | "L";
}

interface NoaaWaterTempObservation {
  t: string;
  v: string;
}

const NOAA_API_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export const fetchTides = async (stationId: string, beginDate: string): Promise<TidePrediction[]> => {
  const url = buildNoaaUrl({
    begin_date: beginDate,
    end_date: calculateEndDate(beginDate),
    station: stationId,
    product: "predictions",
    datum: "MLLW",
    time_zone: "lst_ldt",
    interval: "hilo",
    units: "metric",
  });

  const noaaResponse = await fetchFromNoaa(url);
  return mapTidePredictions(noaaResponse.predictions, stationId);
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

  const noaaResponse = await fetchFromNoaa(url);
  return mapWaterTemperature(noaaResponse.data, stationId);
};

export const formatDateToNoaaString = (date: Date): string => {
  return date.toISOString().split("T")[0].replace(/-/g, "");
};

const buildNoaaUrl = (params: Record<string, string>): URL => {
  const url = new URL(NOAA_API_URL);
  const searchParams = new URLSearchParams({
    ...params,
    application: "surf_forecast",
    format: "json",
  });

  url.search = searchParams.toString();
  return url;
};

const fetchFromNoaa = async (url: URL) => {
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NOAA API request failed with status: ${response.status}`);
  }
  return response.json();
};

const parseNoaaDate = (dateStr: string): Date => {
  const formattedDate = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  return new Date(formattedDate);
};

const calculateEndDate = (dateStr: string): string => {
  const date = parseNoaaDate(dateStr);
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 2);

  return formatDateToNoaaString(endDate);
};

const mapTidePredictions = (
  predictions: NoaaTidePrediction[] | undefined,
  stationId: string
): TidePrediction[] => {
  if (!predictions) {
    throw new Error(`No tide predictions found for station ${stationId}`);
  }

  return predictions.map((prediction) => ({
    time: prediction.t,
    height: parseFloat(prediction.v),
    type: prediction.type === "H" ? "high" : "low",
  }));
};

const mapWaterTemperature = (
  observations: NoaaWaterTempObservation[] | undefined,
  stationId: string
): number => {
  if (!observations || observations.length === 0) {
    throw new Error(`No water temperature data found for station ${stationId}`);
  }

  const latestObservation = observations[observations.length - 1];
  return parseFloat(latestObservation.v);
};
