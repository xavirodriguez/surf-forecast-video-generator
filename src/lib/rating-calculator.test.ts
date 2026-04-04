/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ratingFromWaveData, Rating } from "./rating-calculator";

const assertEqual = (actual: any, expected: any, message: string) => {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`PASS: ${message}`);
};

const runTests = () => {
  console.log("Running rating-calculator tests...");

  // Given: No wave height
  // When: ratingFromWaveData(0, 10, 5)
  // Then: Returns "flat"
  assertEqual(ratingFromWaveData(0, 10, 5), "flat", "Should return flat for zero wave height");

  // Given: Epic conditions
  // When: ratingFromWaveData(1.9, 15, 8)
  // Then: Returns "epic"
  assertEqual(ratingFromWaveData(1.9, 15, 8), "epic", "Should return epic for 1.9m height, 15s period, and low wind");

  // Given: Good conditions
  // When: ratingFromWaveData(1.3, 13, 10)
  // Then: Returns "good"
  assertEqual(ratingFromWaveData(1.3, 13, 10), "good", "Should return good for 1.3m height and 13s period");

  // Given: Poor conditions (short period)
  // When: ratingFromWaveData(0.5, 4, 10)
  // Then: Returns "poor-fair" (it matches the height but period is low, and since we match top-down in the refactor...)
  // Wait, let's re-verify the rules in our refactored code.
  // { minHeight: 0.3, minPeriod: 0, maxWind: Infinity, rating: "poor-fair" }
  assertEqual(ratingFromWaveData(0.5, 4, 10), "poor-fair", "Should return poor-fair for small wave with any period");

  // Given: Very small waves
  // When: ratingFromWaveData(0.2, 10, 5)
  // Then: Returns "poor" (no rule matches)
  assertEqual(ratingFromWaveData(0.2, 10, 5), "poor", "Should return poor for very small waves that don't match any rule");

  console.log("All rating-calculator tests passed!");
};

runTests();
