/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Rating = "flat" | "poor" | "poor-fair" | "fair" | "fair-good" | "good" | "epic";

export interface WaveConditions {
  height: number;
  period: number;
  windSpeed: number;
}

interface RatingRule {
  minHeight: number;
  minPeriod: number;
  maxWind: number;
  rating: Rating;
}

const RATING_RULES: RatingRule[] = [
  { minHeight: 1.8, minPeriod: 14, maxWind: 10, rating: "epic" },
  { minHeight: 1.2, minPeriod: 12, maxWind: 15, rating: "good" },
  { minHeight: 0.9, minPeriod: 10, maxWind: Infinity, rating: "fair-good" },
  { minHeight: 0.6, minPeriod: 8, maxWind: Infinity, rating: "fair" },
  { minHeight: 0.3, minPeriod: 0, maxWind: Infinity, rating: "poor-fair" },
];

const isMatchingRule = (rule: RatingRule, conditions: WaveConditions): boolean => {
  return (
    conditions.height >= rule.minHeight &&
    conditions.period >= rule.minPeriod &&
    conditions.windSpeed < rule.maxWind
  );
};

export const ratingFromWaveData = (conditions: WaveConditions): Rating => {
  if (conditions.height === 0) {
    return "flat";
  }

  const matchingRule = RATING_RULES.find((rule) => isMatchingRule(rule, conditions));

  return matchingRule ? matchingRule.rating : "poor";
};
