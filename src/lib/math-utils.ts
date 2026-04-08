/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function averageArray(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
