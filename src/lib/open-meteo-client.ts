export type MarineData = {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_period: number[];
    wave_direction: number[];
    swell_wave_height: number[];
    swell_wave_period: number[];
    swell_wave_direction: number[];
    wind_wave_height: number[];
  };
};

export const fetchMarineData = async (lat: number, lon: number): Promise<MarineData> => {
  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set(
    "hourly",
    "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height"
  );
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch marine data: ${response.statusText}`);
  }
  return response.json();
};

export type WindData = {
  hourly: {
    time: string[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    temperature_2m: number[];
  };
};

export const fetchWindData = async (lat: number, lon: number): Promise<WindData> => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("hourly", "windspeed_10m,winddirection_10m,temperature_2m");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "mph");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch wind data: ${response.statusText}`);
  }
  return response.json();
};
