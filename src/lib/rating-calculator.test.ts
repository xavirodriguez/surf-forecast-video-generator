/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateSurfRating, WaveConditions } from "./rating-calculator";

const assertEqual = (actual: any, expected: any, description: string) => {
  if (actual !== expected) {
    throw new Error(
      `FAIL: ${description}\n` +
      `  Expected: "${expected}"\n` +
      `  Actual:   "${actual}"`
    );
  }
  console.log(`PASS: ${description}`);
};

const runRatingTests = () => {
  console.log("Running rating-calculator tests...");

  testFlatConditions();
  testEpicConditions();
  testGoodConditions();
  testPoorFairConditions();
  testPoorConditions();

  console.log("All rating-calculator tests passed!");
};

const testFlatConditions = () => {
  // Given: No wave height
  const conditions: WaveConditions = { heightInMeters: 0, periodInSeconds: 10, windSpeedInMph: 5 };
  // When: calculateSurfRating is called
  const rating = calculateSurfRating(conditions);
  // Then: Returns "flat"
  assertEqual(rating, "flat", "Should return flat for zero wave height");
};

const testEpicConditions = () => {
  // Given: High waves, long period, low wind
  const conditions: WaveConditions = { heightInMeters: 1.9, periodInSeconds: 15, windSpeedInMph: 8 };
  // When: calculateSurfRating is called
  const rating = calculateSurfRating(conditions);
  // Then: Returns "epic"
  assertEqual(rating, "epic", "Should return epic for large height, long period, and low wind");
};

const testGoodConditions = () => {
  // Given: Moderate waves and long period
  const conditions: WaveConditions = { heightInMeters: 1.3, periodInSeconds: 13, windSpeedInMph: 10 };
  // When: calculateSurfRating is called
  const rating = calculateSurfRating(conditions);
  // Then: Returns "good"
  assertEqual(rating, "good", "Should return good for moderate height and period");
};

const testPoorFairConditions = () => {
  // Given: Small waves with short period
  const conditions: WaveConditions = { heightInMeters: 0.5, periodInSeconds: 4, windSpeedInMph: 10 };
  // When: calculateSurfRating is called
  const rating = calculateSurfRating(conditions);
  // Then: Returns "poor-fair"
  assertEqual(rating, "poor-fair", "Should return poor-fair for small wave with short period");
};

const testPoorConditions = () => {
  // Given: Very small waves not matching any rule
  const conditions: WaveConditions = { heightInMeters: 0.2, periodInSeconds: 10, windSpeedInMph: 5 };
  // When: calculateSurfRating is called
  const rating = calculateSurfRating(conditions);
  // Then: Returns "poor"
  assertEqual(rating, "poor", "Should return poor for very small waves that don't match thresholds");
};

runRatingTests();
