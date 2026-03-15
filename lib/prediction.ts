// lib/prediction.ts

/**
 * Predicts the next value in a sequence using a 3-Month Weighted Moving Average (WMA).
 * Formula: E_pred = (E1*w1 + E2*w2 + E3*w3)
 * Where w3 is the most recent month (highest weight: 50%), and w1 is the oldest (20%).
 * * @param data Array of historical values (e.g. [12000, 13500, 12800])
 * Assumes the last element in the array is the most recent month.
 * @returns The predicted next value
 */
export function predictNextBill(data: number[]): number {
  const n = data.length;

  // 1. Handle Less Than 1 Month (No historical data)
  if (n === 0) return 0;

  // 2. Handle 1 or 2 Months (Not enough data for 3-Month WMA)
  // Simply return the most recent month's bill as the prediction
  if (n < 3) return Math.max(0, data[n - 1]);

  // 3. Handle 3 or More Months (Execute the WMA Algorithm)
  // Extract only the last 3 months of data: [Oldest, Middle, Newest]
  const recentData = data.slice(-3);

  // Weights: 20% to oldest, 30% to middle, 50% to newest (Matches MATLAB Simulation)
  const weights = [0.2, 0.3, 0.5];

  let weightedSum = 0;

  for (let i = 0; i < 3; i++) {
    weightedSum += recentData[i] * weights[i];
  }

  // Because weights sum to 1.0, weightedSum is our final prediction
  return Math.max(0, weightedSum);
}
