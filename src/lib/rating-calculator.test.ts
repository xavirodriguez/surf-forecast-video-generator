/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ratingFromWaveData } from "./rating-calculator";

const assertEqual = (actual: any, expected: any, message: string) => {
  if (actual !== expected) {
    throw new Error(
      `FAIL: ${message}\n` +
      `  Expected: "${expected}"\n` +
      `  Actual:   "${actual}"`
    );
  }
  console.log(`PASS: ${message}`);
};

const runTests = () => {
  console.log("Running rating-calculator tests...");

  // Flat condition
  // Given: No wave height
  // When: ratingFromWaveData is called
  // Then: Returns "flat"
  assertEqual(
    ratingFromWaveData({ height: 0, period: 10, windSpeed: 5 }),
    "flat",
    "Should return flat for zero wave height"
  );

  // Epic condition
  // Given: High waves, long period, low wind
  // When: ratingFromWaveData is called
  // Then: Returns "epic"
  assertEqual(
    ratingFromWaveData({ height: 1.9, period: 15, windSpeed: 8 }),
    "epic",
    "Should return epic for 1.9m height, 15s period, and low wind"
  );

  // Good condition
  // Given: Moderate waves and long period
  // When: ratingFromWaveData is called
  // Then: Returns "good"
  assertEqual(
    ratingFromWaveData({ height: 1.3, period: 13, windSpeed: 10 }),
    "good",
    "Should return good for 1.3m height and 13s period"
  );

  // Poor-Fair condition
  // Given: Small waves with short period
  // When: ratingFromWaveData is called
  // Then: Returns "poor-fair"
  assertEqual(
    ratingFromWaveData({ height: 0.5, period: 4, windSpeed: 10 }),
    "poor-fair",
    "Should return poor-fair for small wave with any period"
  );

  // Poor condition
  // Given: Very small waves not matching any rule
  // When: ratingFromWaveData is called
  // Then: Returns "poor"
  assertEqual(
    ratingFromWaveData({ height: 0.2, period: 10, windSpeed: 5 }),
    "poor",
    "Should return poor for very small waves that don't match any rule"
  );

  console.log("All rating-calculator tests passed!");
};

runTests();
