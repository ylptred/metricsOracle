import type { MetricAnalysis, ParsedData } from "@/types";

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], avg: number): number {
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
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

function zScoreAnalysis(name: string, values: number[]): MetricAnalysis {
  const avg = mean(values);
  const sigma = std(values, avg);
  const latestZ = sigma === 0 ? 0 : Math.abs((values[values.length - 1] - avg) / sigma);
  const zone = latestZ < 1.5 ? "green" : latestZ < 2.5 ? "yellow" : "red";
  return { name, method: "zscore", score: latestZ, zone, values, mean: avg, std: sigma };
}

function iqrAnalysis(name: string, values: number[]): MetricAnalysis {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqrValue = q3 - q1;
  const latest = values[values.length - 1];
  const lowerFence = q1 - 1.5 * iqrValue;
  const upperFence = q3 + 1.5 * iqrValue;

  let score = 0;
  let zone: MetricAnalysis["zone"] = "green";
  if (latest < lowerFence || latest > upperFence) {
    const extremeFence = iqrValue === 0 ? 0 : Math.abs(latest - (latest > q3 ? upperFence : lowerFence)) / (iqrValue || 1);
    score = extremeFence;
    zone = extremeFence > 1 ? "red" : "yellow";
  }

  return { name, method: "iqr", score, zone, values, q1, q3, iqrValue };
}

function chooseMethod(values: number[]): "zscore" | "iqr" {
  if (values.length < 8) return "iqr";
  const avg = mean(values);
  const sigma = std(values, avg);
  if (sigma === 0) return "iqr";
  const skewness =
    values.reduce((sum, v) => sum + Math.pow((v - avg) / sigma, 3), 0) /
    values.length;
  return Math.abs(skewness) > 1 ? "iqr" : "zscore";
}

export function analyzeMetric(name: string, values: number[]): MetricAnalysis {
  const method = chooseMethod(values);
  return method === "zscore" ? zScoreAnalysis(name, values) : iqrAnalysis(name, values);
}

export function analyzeAll(data: ParsedData): MetricAnalysis[] {
  return data.headers.map((header) => {
    const values = data.rows.map((r) => r.values[header] ?? 0);
    return analyzeMetric(header, values);
  });
}
