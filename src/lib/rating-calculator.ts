export type Rating = "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";

export const ratingFromWaveData = (height: number, period: number, windSpeed: number): Rating => {
  // height in meters, windSpeed in mph
  if (height === 0) return "flat";
  if (height >= 1.8 && period >= 14 && windSpeed < 10) return "epic"; // ~6ft
  if (height >= 1.2 && period >= 12 && windSpeed < 15) return "good"; // ~4ft
  if (height >= 0.9 && period >= 10) return "fair-good"; // ~3ft
  if (height >= 0.6 && period >= 8) return "fair"; // ~2ft
  if (height >= 0.3) return "poor-fair"; // ~1ft
  return "poor";
};
