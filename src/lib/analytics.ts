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
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  if (std === 0) return false;

  const cv = std / Math.abs(mean);
  if (cv > 0.5) return false;

  const skewness = values.reduce((a, b) => a + ((b - mean) / std) ** 3, 0) / n;
  if (Math.abs(skewness) > 0.8) return false;

  const kurtosis = values.reduce((a, b) => a + ((b - mean) / std) ** 4, 0) / n;
  if (Math.abs(kurtosis - 3) > 1.5) return false;

  return true;
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
  upperFence: number;
  lowerFence: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqrValue = q3 - q1;
  const upperFence = q3 + 1.5 * iqrValue;
  const lowerFence = q1 - 1.5 * iqrValue;
  const scores = values.map((v) =>
    v > upperFence ? v - upperFence : v < lowerFence ? v - lowerFence : 0
  );
  return { scores, q1, q3, iqrValue, upperFence, lowerFence };
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
    const lastScore = scores[scores.length - 1];
    const zone = determineZone(lastScore, "zscore");
    const maxAbsScore = Math.max(...scores.map(Math.abs));
    const thresholds: ZoneThresholds = {
      yellowUpper: mean + std,
      redUpper: mean + 3 * std,
      yellowLower: mean - std,
      redLower: mean - 3 * std,
    };
    return { name, method, score: maxAbsScore, zone, values, mean, std, thresholds };
  } else {
    const { scores, q1, q3, iqrValue, upperFence, lowerFence } = calculateIQR(values);
    const lastScore = scores[scores.length - 1];
    const zone = determineZone(lastScore, "iqr");
    const maxAbsScore = Math.max(...scores.map(Math.abs));
    const thresholds: ZoneThresholds = {
      yellowUpper: upperFence,
      redUpper: upperFence + 2,
      yellowLower: lowerFence,
      redLower: lowerFence - 2,
    };
    return { name, method, score: maxAbsScore, zone, values, q1, q3, iqrValue, upperFence, lowerFence, thresholds };
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
