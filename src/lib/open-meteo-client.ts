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

export type WindData = {
  hourly: {
    time: string[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    temperature_2m: number[];
  };
};

const fetchFromOpenMeteo = async (baseUrl: string, lat: number, lon: number, extraParams: Record<string, string>) => {
  const url = new URL(baseUrl);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");

  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch from Open Meteo: ${response.statusText}`);
  }
  return response.json();
};

export const fetchMarineData = async (lat: number, lon: number): Promise<MarineData> => {
  return fetchFromOpenMeteo("https://marine-api.open-meteo.com/v1/marine", lat, lon, {
    hourly: "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height",
  });
};

export const fetchWindData = async (lat: number, lon: number): Promise<WindData> => {
  return fetchFromOpenMeteo("https://api.open-meteo.com/v1/forecast", lat, lon, {
    hourly: "windspeed_10m,winddirection_10m,temperature_2m",
    wind_speed_unit: "mph",
  });
};
