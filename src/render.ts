import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fetchSurfData } from "./lib/fetch-surf-data";
import { spotExamples } from "./lib/spot-examples";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const params: any = {};
  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=");
      params[key] = value || true;
    }
  });
  return params;
};

const start = async () => {
  const args = parseArgs();
  const isLive = args.live;

  let surfData: any;

  if (isLive) {
    const lat = parseFloat(args.lat) || 43.32;
    const lon = parseFloat(args.lon) || -1.98;
    const spotName = args.spot || "Custom Spot";
    const location = args.location || "Unknown Location";

    // Try to find if it matches an example to get better colors/meta
    const example = spotExamples.find(s => s.spotName.toLowerCase() === spotName.toLowerCase());

    const spotMeta = example ? { ...example } : {
      spotName,
      spotLocation: location,
      primaryColor: "#00d2ff",
      secondaryColor: "#3a7bd5",
      backgroundColor: "#0f172a",
      brandName: "Live Surf Forecast",
      currentWaveHeightUnit: (args.unit === "ft" ? "ft" : "m") as "ft" | "m",
      waterTempUnit: (args.temp === "F" ? "F" : "C") as "C" | "F",
    };

    surfData = await fetchSurfData(lat, lon, spotMeta);
  } else {
    // Default mock data
    surfData = {
      spotName: "Pipeline",
      spotLocation: "North Shore, Oahu",
      date: "Friday, April 3rd",
      currentWaveHeight: 8,
      currentWaveHeightUnit: "ft",
      currentPeriod: 14,
      currentDirection: "NW",
      currentDirectionDegrees: 315,
      waterTemp: 24,
      waterTempUnit: "C",
      windSpeed: 12,
      windDirection: "SE",
      windDirectionDegrees: 135,
      overallRating: "good",
      hourlyForecast: [
        { hour: "6AM", waveHeight: 6, period: 12, windSpeed: 5, windDirection: "E", rating: "fair" },
        { hour: "9AM", waveHeight: 8, period: 14, windSpeed: 8, windDirection: "SE", rating: "good" },
        { hour: "12PM", waveHeight: 10, period: 15, windSpeed: 12, windDirection: "S", rating: "epic" },
        { hour: "3PM", waveHeight: 9, period: 14, windSpeed: 15, windDirection: "SW", rating: "good" },
        { hour: "6PM", waveHeight: 7, period: 13, windSpeed: 10, windDirection: "W", rating: "fair" },
        { hour: "9PM", waveHeight: 6, period: 12, windSpeed: 5, windDirection: "NW", rating: "poor" },
      ],
      swellData: [
        { height: 8, period: 14, direction: "NW", directionDegrees: 315 },
        { height: 3, period: 10, direction: "W", directionDegrees: 270 },
        { height: 2, period: 18, direction: "NNW", directionDegrees: 340 },
      ],
      tides: [
        { time: "4:12 AM", height: 0.2, type: "low" },
        { time: "10:45 AM", height: 1.8, type: "high" },
        { time: "5:20 PM", height: 0.4, type: "low" },
        { time: "11:30 PM", height: 1.6, type: "high" },
      ],
      primaryColor: "#00d2ff",
      secondaryColor: "#3a7bd5",
      backgroundColor: "#0f172a",
      brandName: "SurfLine Pro",
      logoUrl: "https://picsum.photos/seed/surf/200/200",
    };
  }

  const formats = [
    { id: "surf-forecast-landscape", codec: "h264", ext: "mp4" },
    { id: "surf-forecast-portrait", codec: "h264", ext: "mp4" },
    { id: "surf-forecast-square", codec: "h264", ext: "mp4" },
  ];

  console.log("Bundling project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./src/index.ts"),
    webpackOverride: (config) => config,
  });

  for (const format of formats) {
    console.log(`Rendering ${format.id}...`);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: format.id,
      inputProps: surfData,
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: `out/${format.id}.${format.ext}`,
      inputProps: surfData,
    });
    console.log(`Finished rendering ${format.id}`);
  }
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

