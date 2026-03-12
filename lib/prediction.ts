// lib/prediction.ts

/**
 * Predicts the next value in a sequence using a 3-Month Weighted Moving Average (WMA).
 * Formula: E_pred = (E1*w1 + E2*w2 + E3*w3) / (w1 + w2 + w3)
 * Where w3 is the most recent month (highest weight), and w1 is the oldest.
 * * @param data Array of historical values (e.g. [12000, 13500, 12800])
 * Assumes the last element in the array is the most recent month.
 * @returns The predicted next value
 */
export function predictNextBill(data: number[]): number {
  const n = data.length;
  if (n === 0) return 0;
  if (n === 1) return Math.max(0, data[0]); // Only 1 month of history

  // Extract up to the last 3 months of data
  const recentData = data.slice(-3);

  // Define weights based on available history length
  let weights: number[] = [];

  if (recentData.length === 3) {
    // 3 Months of History: [Oldest, Middle, Newest]
    // Weights: 20% to oldest, 30% to middle, 50% to newest (Matches MATLAB Simulation)
    weights = [0.2, 0.3, 0.5];
  } else if (recentData.length === 2) {
    // 2 Months of History: [Oldest, Newest]
    // Weights: 40% to oldest, 60% to newest
    weights = [0.4, 0.6];
  }

  // Calculate the weighted sum
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < recentData.length; i++) {
    weightedSum += recentData[i] * weights[i];
    weightTotal += weights[i];
  }

  // Calculate prediction (divided by weightTotal to normalize, which is 1.0)
  const prediction = weightedSum / weightTotal;

  return Math.max(0, prediction); // Bill cannot be negative
}
