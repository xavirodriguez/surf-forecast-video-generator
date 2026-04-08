/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CARDINAL_POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export const degreesToCardinal = (degrees: number): string => {
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalizedDegrees / 22.5) % 16;
  return CARDINAL_POINTS[index];
};
