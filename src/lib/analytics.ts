import type { MetricAnalysis, ParsedData, TrafficLight, ZoneThresholds } from "@/types";

function calcMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calcStd(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

export function isNormalDistribution(values: number[]): boolean {
  const n = values.length;
  const mean = calcMean(values);
  const sigma = calcStd(values, mean);
  if (sigma === 0) return false;

  const skewness =
    values.reduce((sum, v) => sum + ((v - mean) / sigma) ** 3, 0) / n;
  const kurtosis =
    values.reduce((sum, v) => sum + ((v - mean) / sigma) ** 4, 0) / n;

  return Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 2;
}

export function calculateZScore(values: number[]): {
  scores: number[];
  mean: number;
  std: number;
} {
  const mean = calcMean(values);
  const std = calcStd(values, mean);
  const scores =
    std === 0 ? values.map(() => 0) : values.map((v) => (v - mean) / std);
  return { scores, mean, std };
}

export function calculateIQR(values: number[]): {
  scores: number[];
  q1: number;
  q3: number;
  iqrValue: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqrValue = q3 - q1;
  const scores = values.map((v) => (v < q1 ? v - q1 : v > q3 ? v - q3 : 0));
  return { scores, q1, q3, iqrValue };
}

export function determineZone(
  score: number,
  method: "zscore" | "iqr"
): "green" | "yellow" | "red" {
  if (method === "zscore") {
    const abs = Math.abs(score);
    if (abs - 1 > 2) return "red";
    if (abs - 1 > 0) return "yellow";
    return "green";
  } else {
    const abs = Math.abs(score);
    if (abs > 2) return "red";
    if (abs > 0) return "yellow";
    return "green";
  }
}

export function analyzeMetric(name: string, values: number[]): MetricAnalysis {
  const method: "zscore" | "iqr" = isNormalDistribution(values)
    ? "zscore"
    : "iqr";

  if (method === "zscore") {
    const { scores, mean, std } = calculateZScore(values);
    const zones = scores.map((s) => determineZone(s, "zscore"));
    const worstZone = zones.includes("red")
      ? "red"
      : zones.includes("yellow")
      ? "yellow"
      : "green";
    const maxAbsScore = Math.max(...scores.map(Math.abs));
    const thresholds: ZoneThresholds = {
      yellowUpper: mean + std,
      redUpper: mean + 3 * std,
      yellowLower: mean - std,
      redLower: mean - 3 * std,
    };
    return { name, method, score: maxAbsScore, zone: worstZone, values, mean, std, thresholds };
  } else {
    const { scores, q1, q3, iqrValue } = calculateIQR(values);
    const zones = scores.map((s) => determineZone(s, "iqr"));
    const worstZone = zones.includes("red")
      ? "red"
      : zones.includes("yellow")
      ? "yellow"
      : "green";
    const maxAbsScore = Math.max(...scores.map(Math.abs));
    const thresholds: ZoneThresholds = {
      yellowUpper: q3,
      redUpper: q3 + 2,
      yellowLower: q1,
      redLower: q1 - 2,
    };
    return { name, method, score: maxAbsScore, zone: worstZone, values, q1, q3, iqrValue, thresholds };
  }
}

export function buildTrafficLight(metrics: MetricAnalysis[]): TrafficLight {
  const redCount = metrics.filter((m) => m.zone === "red").length;
  const yellowOrRedCount = metrics.filter(
    (m) => m.zone === "yellow" || m.zone === "red"
  ).length;

  let overall: "green" | "yellow" | "red";
  if (redCount >= 3) {
    overall = "red";
  } else if (yellowOrRedCount >= 3) {
    overall = "yellow";
  } else {
    overall = "green";
  }

  return { overall, metrics };
}

export function analyzeAll(data: ParsedData): MetricAnalysis[] {
  return data.headers.map((header) => {
    const values = data.rows.map((r) => r.values[header] ?? 0);
    return analyzeMetric(header, values);
  });
}
