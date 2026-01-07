// lib/prediction.ts

/**
 * Predicts the next value in a sequence using Simple Linear Regression (Least Squares).
 * Formula: y = mx + c
 * @param data Array of historical values (e.g. [12000, 13500, 12800])
 * @returns The predicted next value
 */
export function predictNextBill(data: number[]): number {
  const n = data.length;
  if (n < 2) return data[0] || 0; // Not enough data

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  // Calculate Slope (m)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Calculate Intercept (c)
  const intercept = (sumY - slope * sumX) / n;

  // Predict next value (x = n)
  const nextX = n;
  const prediction = slope * nextX + intercept;

  return Math.max(0, prediction); // Bill cannot be negative
}
