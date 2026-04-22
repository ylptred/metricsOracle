import { describe, it, expect } from "vitest";
import {
  calculateZScore,
  calculateIQR,
  determineZone,
  isNormalDistribution,
  buildTrafficLight,
  analyzeMetric,
} from "@/lib/analytics";
import { linearRegression } from "@/lib/forecast";
import type { MetricAnalysis } from "@/types";

describe("calculateZScore", () => {
  it("computes scores, mean, and std for normal values", () => {
    const values = [10, 20, 30];
    const { scores, mean, std } = calculateZScore(values);
    expect(mean).toBeCloseTo(20);
    expect(std).toBeGreaterThan(0);
    expect(scores[1]).toBeCloseTo(0);
    expect(scores[0]).toBeCloseTo(-scores[2]);
  });

  it("returns all-zero scores when std is 0", () => {
    const values = [5, 5, 5, 5, 5];
    const { scores, std } = calculateZScore(values);
    expect(std).toBe(0);
    scores.forEach((s) => expect(s).toBe(0));
  });
});

describe("calculateIQR", () => {
  it("returns zero score for values inside IQR", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { scores } = calculateIQR(values);
    expect(scores.filter((s) => s === 0).length).toBeGreaterThan(0);
  });

  it("returns positive score for value above Q3", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const { scores, q3 } = calculateIQR(values);
    const last = scores[values.length - 1];
    expect(last).toBeCloseTo(100 - q3);
    expect(last).toBeGreaterThan(0);
  });

  it("returns negative score for value below Q1", () => {
    const values = [-100, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { scores, q1 } = calculateIQR(values);
    expect(scores[0]).toBeCloseTo(-100 - q1);
    expect(scores[0]).toBeLessThan(0);
  });
});

describe("determineZone (zscore)", () => {
  it("returns green for |score| < 1", () => {
    expect(determineZone(0, "zscore")).toBe("green");
    expect(determineZone(0.9, "zscore")).toBe("green");
    expect(determineZone(-0.5, "zscore")).toBe("green");
  });

  it("returns yellow for 1 <= |score| <= 3", () => {
    expect(determineZone(1, "zscore")).toBe("yellow");
    expect(determineZone(3, "zscore")).toBe("yellow");
    expect(determineZone(-2, "zscore")).toBe("yellow");
  });

  it("returns red for |score| > 3", () => {
    expect(determineZone(3.1, "zscore")).toBe("red");
    expect(determineZone(-5, "zscore")).toBe("red");
  });
});

describe("determineZone (iqr)", () => {
  it("returns green for score === 0", () => {
    expect(determineZone(0, "iqr")).toBe("green");
  });

  it("returns yellow for 0 < |score| <= 2", () => {
    expect(determineZone(0.1, "iqr")).toBe("yellow");
    expect(determineZone(2, "iqr")).toBe("yellow");
    expect(determineZone(-1, "iqr")).toBe("yellow");
  });

  it("returns red for |score| > 2", () => {
    expect(determineZone(2.1, "iqr")).toBe("red");
    expect(determineZone(-10, "iqr")).toBe("red");
  });
});

describe("isNormalDistribution", () => {
  it("returns true for symmetric near-normal data", () => {
    // Symmetric: skewness = 0, kurtosis close to normal
    const values = [
      100, 101, 99, 102, 98, 103, 97, 101, 100, 99, 100, 101, 98, 102, 99,
    ];
    expect(isNormalDistribution(values)).toBe(true);
  });

  it("returns false for highly right-skewed data", () => {
    const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 100];
    expect(isNormalDistribution(values)).toBe(false);
  });

  it("returns false when std is 0 (constant data)", () => {
    expect(isNormalDistribution([5, 5, 5, 5, 5])).toBe(false);
  });
});

describe("buildTrafficLight", () => {
  const m = (zone: "green" | "yellow" | "red"): MetricAnalysis => ({
    name: "x",
    method: "zscore",
    score: 0,
    zone,
    values: [],
  });

  it("returns green when fewer than 3 yellow/red metrics", () => {
    expect(
      buildTrafficLight([m("green"), m("yellow"), m("green")]).overall
    ).toBe("green");
  });

  it("returns yellow when 3+ metrics are yellow or red but fewer than 3 are red", () => {
    expect(
      buildTrafficLight([m("yellow"), m("yellow"), m("red"), m("green")]).overall
    ).toBe("yellow");
  });

  it("returns red when 3+ metrics are red", () => {
    expect(
      buildTrafficLight([m("red"), m("red"), m("red"), m("green")]).overall
    ).toBe("red");
  });

  it("returns green for all-green metrics", () => {
    expect(
      buildTrafficLight([m("green"), m("green"), m("green")]).overall
    ).toBe("green");
  });

  it("returns red takes precedence over yellow threshold", () => {
    const metrics = [m("red"), m("red"), m("red"), m("yellow"), m("yellow")];
    expect(buildTrafficLight(metrics).overall).toBe("red");
  });
});

describe("linearRegression", () => {
  it("returns correct slope and intercept for y = 2x + 1", () => {
    const values = [1, 3, 5, 7, 9];
    const { slope, intercept } = linearRegression(values);
    expect(slope).toBeCloseTo(2, 5);
    expect(intercept).toBeCloseTo(1, 5);
  });

  it("returns zero slope for constant data", () => {
    const { slope } = linearRegression([4, 4, 4, 4, 4]);
    expect(slope).toBe(0);
  });

  it("returns negative slope for decreasing data", () => {
    const { slope } = linearRegression([10, 8, 6, 4, 2]);
    expect(slope).toBeCloseTo(-2, 5);
  });
});

describe("analyzeMetric", () => {
  it("returns green zone for constant values (no variation)", () => {
    const values = Array(12).fill(100) as number[];
    expect(analyzeMetric("test", values).zone).toBe("green");
  });

  it("returns non-green zone for extreme outlier", () => {
    const values = [100, 102, 98, 101, 99, 100, 103, 97, 101, 100, 99, 250];
    expect(analyzeMetric("test", values).zone).not.toBe("green");
  });

  it("preserves metric name and valid method", () => {
    const result = analyzeMetric("Revenue", [10, 12, 11, 13, 10]);
    expect(result.name).toBe("Revenue");
    expect(["zscore", "iqr"]).toContain(result.method);
  });
});
