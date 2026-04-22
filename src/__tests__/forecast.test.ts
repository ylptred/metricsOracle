import { describe, it, expect } from "vitest";
import { linearRegression, forecastMetric, buildForecast } from "@/lib/forecast";
import type { MetricAnalysis } from "@/types";

describe("linearRegression", () => {
  it("slope=-1 for descending sequence (last two points: 6→5)", () => {
    const values = [10, 9, 8, 7, 6, 5];
    const { slope } = linearRegression(values);
    expect(slope).toBe(-1);
  });

  it("slope=1 for values where last two points rise (3→4)", () => {
    const values = [1, 2, 1, 2, 3, 4];
    const { slope } = linearRegression(values);
    expect(slope).toBe(1);
  });

  it("slope=0 for constant data", () => {
    const values = [5, 5, 5, 5, 5, 5];
    const { slope } = linearRegression(values);
    expect(slope).toBe(0);
  });

  it("intercept satisfies y = slope*x + intercept at last point", () => {
    const values = [10, 9, 8, 7, 6, 5];
    const { slope, intercept } = linearRegression(values);
    const n = values.length;
    expect(slope * (n - 1) + intercept).toBeCloseTo(values[n - 1], 10);
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
  it("returns non-null periodsUntilZoneChange when last two points push metric toward zone boundary", () => {
    // Last two values: 8, 9 → slope=1. metric is in yellow, heading to red.
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
