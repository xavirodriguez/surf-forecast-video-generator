/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const METERS_TO_FEET = 3.28084;

export const convertMetersToUserUnit = (heightInMeters: number, unit: "ft" | "m"): number => {
  return unit === "ft" ? heightInMeters * METERS_TO_FEET : heightInMeters;
};

export const convertCelsiusToUserUnit = (tempInCelsius: number, unit: "C" | "F"): number => {
  return unit === "F" ? (tempInCelsius * 9) / 5 + 32 : tempInCelsius;
};
