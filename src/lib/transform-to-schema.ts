import { MarineData, WindData } from "./open-meteo-client";
import { TidePrediction } from "./noaa-tides-client";
import { SurfForecastProps } from "../schemas/surf-forecast";
import { ratingFromWaveData } from "./rating-calculator";

export type SpotMeta = {
  spotName: string;
  spotLocation: string;
  noaaStationId?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  brandName: string;
  logoUrl?: string;
  currentWaveHeightUnit: "ft" | "m";
  waterTempUnit: "C" | "F";
};

export const degreesToCardinal = (degrees: number): string => {
  const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return cardinals[index];
};

export const transformToSurfProps = (
  marineData: MarineData,
  windData: WindData,
  tidesData: TidePrediction[],
  waterTemp: number | null,
  spotMeta: SpotMeta,
  targetDate: string // ISO string
): SurfForecastProps => {
  const now = new Date(targetDate);
  const targetDayStr = now.toISOString().split("T")[0];

  // Find relevant indices for hourly forecast
  // We want 8 hours starting from now or 06:00 if now is earlier
  let startHour = now.getHours();
  if (startHour < 6) startHour = 6;

  const hourlyIndices: number[] = [];
  for (let i = 0; i < 8; i++) {
    const targetHour = startHour + i;
    const timeStr = `${targetDayStr}T${targetHour.toString().padStart(2, "0")}:00`;
    const index = marineData.hourly.time.findIndex((t) => t.startsWith(timeStr));
    if (index !== -1) hourlyIndices.push(index);
  }

  // Current conditions (average of next 2 hours)
  const currentIndex = marineData.hourly.time.findIndex((t) => t.startsWith(now.toISOString().substring(0, 13)));
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndices = [safeCurrentIndex, safeCurrentIndex + 1].filter((i) => i < marineData.hourly.time.length);

  const avgWaveHeight = nextIndices.reduce((acc, i) => acc + marineData.hourly.wave_height[i], 0) / nextIndices.length;
  const avgPeriod = nextIndices.reduce((acc, i) => acc + marineData.hourly.wave_period[i], 0) / nextIndices.length;
  const avgWindSpeed = nextIndices.reduce((acc, i) => acc + windData.hourly.windspeed_10m[i], 0) / nextIndices.length;

  const currentWaveHeight = spotMeta.currentWaveHeightUnit === "ft" ? avgWaveHeight * 3.28084 : avgWaveHeight;
  const currentWaterTemp = waterTemp || windData.hourly.temperature_2m[safeCurrentIndex] || 18;
  const finalWaterTemp = spotMeta.waterTempUnit === "F" ? (currentWaterTemp * 9) / 5 + 32 : currentWaterTemp;

  const hourlyForecast = hourlyIndices.map((i) => {
    const h = marineData.hourly.wave_height[i];
    const p = marineData.hourly.wave_period[i];
    const w = windData.hourly.windspeed_10m[i];
    return {
      hour: marineData.hourly.time[i].split("T")[1].substring(0, 5),
      waveHeight: parseFloat((spotMeta.currentWaveHeightUnit === "ft" ? h * 3.28084 : h).toFixed(1)),
      period: Math.round(p),
      windSpeed: Math.round(w),
      windDirection: degreesToCardinal(windData.hourly.winddirection_10m[i]),
      rating: ratingFromWaveData(h, p, w),
    };
  });

  // Swell components (up to 3)
  const swellData = [
    {
      height: parseFloat((spotMeta.currentWaveHeightUnit === "ft" ? marineData.hourly.swell_wave_height[safeCurrentIndex] * 3.28084 : marineData.hourly.swell_wave_height[safeCurrentIndex]).toFixed(1)),
      period: Math.round(marineData.hourly.swell_wave_period[safeCurrentIndex]),
      direction: degreesToCardinal(marineData.hourly.swell_wave_direction[safeCurrentIndex]),
      directionDegrees: marineData.hourly.swell_wave_direction[safeCurrentIndex],
    },
    {
      height: parseFloat((spotMeta.currentWaveHeightUnit === "ft" ? marineData.hourly.wind_wave_height[safeCurrentIndex] * 3.28084 : marineData.hourly.wind_wave_height[safeCurrentIndex]).toFixed(1)),
      period: Math.round(marineData.hourly.wave_period[safeCurrentIndex] * 0.8), // Approximation for wind wave period
      direction: degreesToCardinal(marineData.hourly.wave_direction[safeCurrentIndex]),
      directionDegrees: marineData.hourly.wave_direction[safeCurrentIndex],
    }
  ].filter(s => s.height > 0);

  return {
    spotName: spotMeta.spotName,
    spotLocation: spotMeta.spotLocation,
    date: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    currentWaveHeight: parseFloat(currentWaveHeight.toFixed(1)),
    currentWaveHeightUnit: spotMeta.currentWaveHeightUnit,
    currentPeriod: Math.round(avgPeriod),
    currentDirection: degreesToCardinal(marineData.hourly.wave_direction[safeCurrentIndex]),
    currentDirectionDegrees: marineData.hourly.wave_direction[safeCurrentIndex],
    waterTemp: Math.round(finalWaterTemp),
    waterTempUnit: spotMeta.waterTempUnit,
    windSpeed: Math.round(avgWindSpeed),
    windDirection: degreesToCardinal(windData.hourly.winddirection_10m[safeCurrentIndex]),
    windDirectionDegrees: windData.hourly.winddirection_10m[safeCurrentIndex],
    overallRating: ratingFromWaveData(avgWaveHeight, avgPeriod, avgWindSpeed),
    hourlyForecast,
    swellData,
    tides: tidesData.length > 0 ? tidesData.slice(0, 4) : [
      { time: "06:00", height: 1.2, type: "high" },
      { time: "12:00", height: 0.4, type: "low" },
      { time: "18:00", height: 1.1, type: "high" },
      { time: "23:30", height: 0.5, type: "low" },
    ],
    primaryColor: spotMeta.primaryColor,
    secondaryColor: spotMeta.secondaryColor,
    backgroundColor: spotMeta.backgroundColor,
    brandName: spotMeta.brandName,
    logoUrl: spotMeta.logoUrl,
  };
};
