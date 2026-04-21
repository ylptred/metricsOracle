import { describe, it, expect } from "vitest";
import { linearRegression, forecastMetric } from "@/lib/forecast";

describe("linearRegression", () => {
  it("returns correct slope and intercept for linear data", () => {
    const values = [1, 2, 3, 4, 5];
    const { slope, intercept } = linearRegression(values);
    expect(slope).toBeCloseTo(1, 5);
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
