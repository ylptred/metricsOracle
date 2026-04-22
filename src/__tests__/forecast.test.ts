import { describe, it, expect } from "vitest";
import { linearRegression, forecastMetric, buildForecast } from "@/lib/forecast";
import type { MetricAnalysis } from "@/types";

describe("linearRegression", () => {
  it("returns correct slope and intercept for linear data", () => {
    const values = [1, 2, 3, 4, 5];
    const { slope, intercept } = linearRegression(values);
    expect(slope).toBeCloseTo(1, 5);
    expect(intercept).toBeCloseTo(1, 5);
  });

  it("returns slope≈2 and intercept≈1 for y=2x+1", () => {
    // x=0..4 → y=1,3,5,7,9
    const values = [1, 3, 5, 7, 9];
    const { slope, intercept } = linearRegression(values);
    expect(slope).toBeCloseTo(2, 5);
    expect(intercept).toBeCloseTo(1, 5);
  });

  it("returns zero slope for constant data", () => {
    const values = [5, 5, 5, 5, 5];
    const { slope } = linearRegression(values);
    expect(slope).toBe(0);
  });
});

describe("forecastMetric", () => {
  it("returns a forecast result with correct shape", () => {
    const values = [10, 12, 14, 16, 18, 20];
    const result = forecastMetric("Revenue", values);
    expect(result.metricName).toBe("Revenue");
    expect(result.trendLine).toHaveLength(values.length);
    expect(result.prediction).toMatch(/рост|снижение|стабильность/);
  });
});

describe("buildForecast", () => {
  it("returns non-null periodsUntilZoneChange for rising metric in yellow zone", () => {
    // values 1..10, mean=5.5, std≈2.872, last z-score ≈ 1.57 → yellow
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const mean = 5.5;
    const std = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    );
    const analysis: MetricAnalysis = {
      name: "rising",
      method: "zscore",
      zone: "yellow",
      score: (10 - mean) / std,
      values,
      mean,
      std,
    };
    const result = buildForecast("rising", values, analysis, "period");
    expect(result.periodsUntilZoneChange).not.toBeNull();
    expect(result.periodsUntilZoneChange).toBeGreaterThan(0);
  });

  it("returns stable prediction for constant metric", () => {
    const values = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    const analysis: MetricAnalysis = {
      name: "stable",
      method: "zscore",
      zone: "green",
      score: 0,
      values,
      mean: 5,
      std: 0,
    };
    const result = buildForecast("stable", values, analysis, "period");
    expect(result.prediction).toMatch(/стабильна/);
    expect(result.periodsUntilZoneChange).toBeNull();
  });
});
