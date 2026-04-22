import type { ForecastResult, MetricAnalysis } from "@/types";
import { determineZone } from "@/lib/analytics";

export function linearRegression(values: number[]): {
  slope: number;
  intercept: number;
} {
  const n = values.length;
  const xs = values.map((_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  const ssXX = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const ssXY = xs.reduce(
    (sum, x, i) => sum + (x - xMean) * (values[i] - yMean),
    0
  );

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

  const direction =
    slope > 0 ? "рост" : slope < 0 ? "снижение" : "стабильность";
  const prediction = `Ожидается ${direction} (наклон: ${slope.toFixed(3)})`;

  const futureValues = Array.from(
    { length: periodsAhead },
    (_, i) => intercept + slope * (n + i)
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

  return {
    metricName: name,
    slope,
    intercept,
    trendLine,
    prediction,
    periodsUntilZoneChange,
  };
}

function zoneLabel(zone: "green" | "yellow" | "red"): string {
  return zone === "green" ? "зелёную" : zone === "yellow" ? "жёлтую" : "красную";
}

function periodWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "период";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "периода";
  return "периодов";
}

export function buildForecast(
  metricName: string,
  values: number[],
  analysis: MetricAnalysis,
  _periodLabel: string
): ForecastResult {
  const { slope, intercept } = linearRegression(values);
  const n = values.length;
  const trendLine = values.map((_, i) => intercept + slope * i);

  const currentZone = analysis.zone;
  let periodsUntilZoneChange: number | null = null;

  for (let i = 1; i <= 24; i++) {
    const futureValue = intercept + slope * (n + i - 1);
    let futureScore: number;

    if (
      analysis.method === "zscore" &&
      analysis.mean !== undefined &&
      analysis.std !== undefined
    ) {
      futureScore =
        analysis.std === 0
          ? 0
          : (futureValue - analysis.mean) / analysis.std;
    } else if (
      analysis.method === "iqr" &&
      analysis.q1 !== undefined &&
      analysis.q3 !== undefined
    ) {
      const { q1, q3 } = analysis;
      futureScore =
        futureValue < q1 ? futureValue - q1 : futureValue > q3 ? futureValue - q3 : 0;
    } else {
      break;
    }

    const futureZone = determineZone(futureScore, analysis.method);
    if (futureZone !== currentZone) {
      periodsUntilZoneChange = i;
      break;
    }
  }

  let prediction: string;
  if (periodsUntilZoneChange !== null) {
    prediction = `При текущем тренде метрика покинет ${zoneLabel(currentZone)} зону через ~${periodsUntilZoneChange} ${periodWord(periodsUntilZoneChange)}`;
  } else {
    prediction = "Метрика стабильна, зона не изменится в ближайшие 24 периода";
  }

  return {
    metricName,
    slope,
    intercept,
    trendLine,
    prediction,
    periodsUntilZoneChange,
  };
}
