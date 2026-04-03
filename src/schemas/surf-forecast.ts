import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const surfForecastSchema = z.object({
  // Metadata
  spotName: z.string(),
  spotLocation: z.string(),
  date: z.string(),
  
  // Condiciones actuales
  currentWaveHeight: z.number().min(0).max(20),
  currentWaveHeightUnit: z.enum(["ft", "m"]),
  currentPeriod: z.number().min(0).max(25),
  currentDirection: z.string(),
  currentDirectionDegrees: z.number().min(0).max(360),
  waterTemp: z.number(),
  waterTempUnit: z.enum(["C", "F"]),
  windSpeed: z.number().min(0),
  windDirection: z.string(),
  windDirectionDegrees: z.number().min(0).max(360),
  
  // Rating general
  overallRating: z.enum(["flat", "poor", "poor-fair", "fair", "fair-good", "good", "epic"]),
  
  // Pronóstico por horas (array)
  hourlyForecast: z.array(z.object({
    hour: z.string(),
    waveHeight: z.number(),
    period: z.number(),
    windSpeed: z.number(),
    windDirection: z.string(),
    rating: z.enum(["flat", "poor", "poor-fair", "fair", "fair-good", "good", "epic"]),
  })),
  
  // Datos de swell
  swellData: z.array(z.object({
    height: z.number(),
    period: z.number(),
    direction: z.string(),
    directionDegrees: z.number(),
  })),
  
  // Mareas
  tides: z.array(z.object({
    time: z.string(),
    height: z.number(),
    type: z.enum(["high", "low"]),
  })),
  
  // Estilo visual
  primaryColor: zColor(),
  secondaryColor: zColor(),
  backgroundColor: zColor(),
  
  // Branding
  logoUrl: z.string().optional(),
  brandName: z.string(),
});

export type SurfForecastProps = z.infer<typeof surfForecastSchema>;
