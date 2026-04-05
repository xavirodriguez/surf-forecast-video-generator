import { SpotMetadata } from "./transform-to-schema";

export type SpotExample = SpotMetadata & { lat: number; lon: number };

export const spotExamples: SpotExample[] = [
  {
    spotName: "Playa de Zurriola",
    spotLocation: "San Sebastián, España",
    lat: 43.32,
    lon: -1.98,
    primaryColor: "#00d2ff",
    secondaryColor: "#3a7bd5",
    backgroundColor: "#0f172a",
    brandName: "Zurriola Surf Report",
    currentWaveHeightUnit: "m",
    waterTempUnit: "C",
  },
  {
    spotName: "Supertubes",
    spotLocation: "Peniche, Portugal",
    lat: 39.35,
    lon: -9.38,
    primaryColor: "#ff9a9e",
    secondaryColor: "#fad0c4",
    backgroundColor: "#2d3436",
    brandName: "Peniche Forecast",
    currentWaveHeightUnit: "m",
    waterTempUnit: "C",
  },
  {
    spotName: "Pipeline",
    spotLocation: "North Shore, Oahu",
    lat: 21.66,
    lon: -158.05,
    noaaStationId: "1612340",
    primaryColor: "#a1c4fd",
    secondaryColor: "#c2e9fb",
    backgroundColor: "#1e3799",
    brandName: "North Shore Live",
    currentWaveHeightUnit: "ft",
    waterTempUnit: "F",
  },
];
