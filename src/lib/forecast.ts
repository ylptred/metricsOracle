import type { ForecastResult } from "@/types";

export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  const xs = values.map((_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  const ssXX = xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  const ssXY = xs.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

export function forecastMetric(
  name: string,
  values: number[],
  periodsAhead = 3
): ForecastResult {
  const { slope, intercept } = linearRegression(values);
  const n = values.length;

  const trendLine = values.map((_, i) => intercept + slope * i);

  const direction = slope > 0 ? "рост" : slope < 0 ? "снижение" : "стабильность";
  const prediction = `Ожидается ${direction} (наклон: ${slope.toFixed(3)})`;

  const futureValues = Array.from({ length: periodsAhead }, (_, i) =>
    intercept + slope * (n + i)
  );

  const lastValue = values[values.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / n;
  let periodsUntilZoneChange: number | null = null;

  if (Math.abs(slope) > 0.01 * avg) {
    for (let i = 0; i < futureValues.length; i++) {
      if (Math.abs(futureValues[i] - lastValue) > 0.2 * avg) {
        periodsUntilZoneChange = i + 1;
        break;
      }
    }
  }

  return { metricName: name, slope, intercept, trendLine, prediction, periodsUntilZoneChange };
}
