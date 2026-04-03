export type TidePrediction = {
  time: string;
  height: number;
  type: "high" | "low";
};

export const fetchTides = async (stationId: string, date: string): Promise<TidePrediction[]> => {
  // date format: YYYYMMDD
  const endDate = new Date(
    parseInt(date.substring(0, 4)),
    parseInt(date.substring(4, 6)) - 1,
    parseInt(date.substring(6, 8)) + 2
  )
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "");

  const url = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
  url.searchParams.set("begin_date", date);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("station", stationId);
  url.searchParams.set("product", "predictions");
  url.searchParams.set("datum", "MLLW");
  url.searchParams.set("time_zone", "lst_ldt");
  url.searchParams.set("interval", "hilo");
  url.searchParams.set("units", "metric");
  url.searchParams.set("application", "surf_forecast");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.predictions) return [];

    return data.predictions.map((p: any) => ({
      time: p.t,
      height: parseFloat(p.v),
      type: p.type === "H" ? "high" : "low",
    }));
  } catch (e) {
    console.error("Error fetching tides from NOAA:", e);
    return [];
  }
};

export const fetchWaterTemp = async (stationId: string): Promise<number | null> => {
  const url = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
  url.searchParams.set("range", "24");
  url.searchParams.set("station", stationId);
  url.searchParams.set("product", "water_temperature");
  url.searchParams.set("datum", "MLLW");
  url.searchParams.set("time_zone", "lst_ldt");
  url.searchParams.set("units", "metric");
  url.searchParams.set("application", "surf_forecast");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    // Get the most recent value
    const latest = data.data[data.data.length - 1];
    return parseFloat(latest.v);
  } catch (e) {
    console.error("Error fetching water temp from NOAA:", e);
    return null;
  }
};
