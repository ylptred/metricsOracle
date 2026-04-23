import type { ForecastResult, MetricAnalysis } from "@/types";
import { determineZone } from "@/lib/analytics";

export function linearRegression(values: number[]): {
  slope: number;
  intercept: number;
} {
  const n = values.length;
  const x0 = n - 2;
  const x1 = n - 1;
  const y0 = values[x0];
  const y1 = values[x1];
  const slope = y1 - y0;
  const intercept = y1 - slope * x1;
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

function scoreLastValue(value: number, analysis: MetricAnalysis): number | null {
  if (
    analysis.method === "zscore" &&
    analysis.mean !== undefined &&
    analysis.std !== undefined
  ) {
    return analysis.std === 0 ? 0 : (value - analysis.mean) / analysis.std;
  }
  if (
    analysis.method === "iqr" &&
    analysis.upperFence !== undefined &&
    analysis.lowerFence !== undefined
  ) {
    const { upperFence, lowerFence } = analysis;
    if (value > upperFence) return value - upperFence;
    if (value < lowerFence) return value - lowerFence;
    return 0;
  }
  return null;
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

  const lastScore = scoreLastValue(values[n - 1], analysis);
  if (lastScore === null) {
    return {
      metricName,
      slope,
      intercept,
      trendLine,
      prediction: `Ожидается ${slope < 0 ? "снижение" : slope > 0 ? "рост" : "стабильность"}`,
      periodsUntilZoneChange: null,
    };
  }

  const lastZone = determineZone(lastScore, analysis.method);

  if (lastZone === "green") {
    let periodsUntilYellow: number | null = null;
    for (let i = 1; i <= 24; i++) {
      const futureValue = intercept + slope * (n - 1 + i);
      const futureScore = scoreLastValue(futureValue, analysis);
      if (futureScore === null) break;
      if (determineZone(futureScore, analysis.method) !== "green") {
        periodsUntilYellow = i;
        break;
      }
    }
    const absSlope = Math.abs(slope);
    const direction =
      slope < 0 ? "Снижается" : slope > 0 ? "Растёт" : "Стабильна";
    const prediction =
      periodsUntilYellow !== null
        ? `Метрика в зелёной зоне. ${direction} на ${absSlope.toFixed(2)} ед./период. При текущем темпе войдёт в жёлтую зону через ~${periodsUntilYellow} ${periodWord(periodsUntilYellow)}`
        : `Метрика в зелёной зоне. Остаётся в норме в ближайшие 24 периода`;
    return {
      metricName,
      slope,
      intercept,
      trendLine,
      prediction,
      periodsUntilZoneChange: periodsUntilYellow,
    };
  }

  let periodsUntilZoneChange: number | null = null;

  for (let i = 1; i <= 24; i++) {
    const futureValue = intercept + slope * (n + i - 1);
    const futureScore = scoreLastValue(futureValue, analysis);
    if (futureScore === null) break;

    const futureZone = determineZone(futureScore, analysis.method);
    if (futureZone !== lastZone) {
      periodsUntilZoneChange = i;
      break;
    }
  }

  const absSlope = Math.abs(slope);
  const slopeText =
    slope < 0
      ? `Метрика снижается на ${absSlope.toFixed(2)} ед./период.`
      : slope > 0
        ? `Метрика растёт на ${absSlope.toFixed(2)} ед./период.`
        : "";

  let prediction: string;
  if (slope === 0) {
    prediction = "Метрика стабильна, зона не изменится в ближайшие 24 периода";
  } else if (periodsUntilZoneChange !== null) {
    prediction = `${slopeText} При текущем темпе покинет ${zoneLabel(lastZone)} зону через ~${periodsUntilZoneChange} ${periodWord(periodsUntilZoneChange)}`;
  } else {
    prediction = `${slopeText} Зона не изменится в ближайшие 24 периода`;
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
