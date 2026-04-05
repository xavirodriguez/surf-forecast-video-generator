/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateSurfRating, WaveConditions } from "./rating-calculator";

const assertEqual = (actual: any, expected: any, description: string) => {
  if (actual !== expected) {
    throw new Error(`FAIL: ${description}. Expected ${expected}, but got ${actual}`);
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
  // Given
  const conditions: WaveConditions = { heightInMeters: 0, periodInSeconds: 10, windSpeedInMph: 5 };
  // When
  const rating = calculateSurfRating(conditions);
  // Then
  assertEqual(rating, "flat", "Should return flat for zero wave height");
};

const testEpicConditions = () => {
  // Given
  const conditions: WaveConditions = { heightInMeters: 1.9, periodInSeconds: 15, windSpeedInMph: 8 };
  // When
  const rating = calculateSurfRating(conditions);
  // Then
  assertEqual(rating, "epic", "Should return epic for large height, long period, and low wind");
};

const testGoodConditions = () => {
  // Given
  const conditions: WaveConditions = { heightInMeters: 1.3, periodInSeconds: 13, windSpeedInMph: 10 };
  // When
  const rating = calculateSurfRating(conditions);
  // Then
  assertEqual(rating, "good", "Should return good for moderate height and period");
};

const testPoorFairConditions = () => {
  // Given
  const conditions: WaveConditions = { heightInMeters: 0.5, periodInSeconds: 4, windSpeedInMph: 10 };
  // When
  const rating = calculateSurfRating(conditions);
  // Then
  assertEqual(rating, "poor-fair", "Should return poor-fair for small wave with short period");
};

const testPoorConditions = () => {
  // Given
  const conditions: WaveConditions = { heightInMeters: 0.2, periodInSeconds: 10, windSpeedInMph: 5 };
  // When
  const rating = calculateSurfRating(conditions);
  // Then
  assertEqual(rating, "poor", "Should return poor for very small waves that don't match thresholds");
};

runRatingTests();
