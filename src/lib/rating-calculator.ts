/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SurfRating = "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";

export interface WaveConditions {
  heightInMeters: number;
  periodInSeconds: number;
  windSpeedInMph: number;
}

interface SurfRatingThreshold {
  minHeightInMeters: number;
  minPeriodInSeconds: number;
  maxWindSpeedInMph: number;
  rating: SurfRating;
}

const SURF_RATING_THRESHOLDS: SurfRatingThreshold[] = [
  { minHeightInMeters: 1.8, minPeriodInSeconds: 14, maxWindSpeedInMph: 10, rating: "epic" },
  { minHeightInMeters: 1.2, minPeriodInSeconds: 12, maxWindSpeedInMph: 15, rating: "good" },
  { minHeightInMeters: 0.9, minPeriodInSeconds: 10, maxWindSpeedInMph: Infinity, rating: "fair-good" },
  { minHeightInMeters: 0.6, minPeriodInSeconds: 8, maxWindSpeedInMph: Infinity, rating: "fair" },
  { minHeightInMeters: 0.3, minPeriodInSeconds: 0, maxWindSpeedInMph: Infinity, rating: "poor-fair" },
];

export const calculateSurfRating = (conditions: WaveConditions): SurfRating => {
  if (conditions.heightInMeters === 0) {
    return "flat";
  }

  const matchingThreshold = SURF_RATING_THRESHOLDS.find((threshold) =>
    isConditionMatchingThreshold(conditions, threshold)
  );

  return matchingThreshold?.rating ?? "poor";
};

const isConditionMatchingThreshold = (
  conditions: WaveConditions,
  threshold: SurfRatingThreshold
): boolean => {
  const hasMinHeight = conditions.heightInMeters >= threshold.minHeightInMeters;
  const hasMinPeriod = conditions.periodInSeconds >= threshold.minPeriodInSeconds;
  const hasMaxWind = conditions.windSpeedInMph < threshold.maxWindSpeedInMph;

  return hasMinHeight && hasMinPeriod && hasMaxWind;
};
