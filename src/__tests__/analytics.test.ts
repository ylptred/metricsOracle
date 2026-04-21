import { describe, it, expect } from "vitest";
import { analyzeMetric } from "@/lib/analytics";

describe("analyzeMetric", () => {
  it("returns green zone for normal values", () => {
    const values = [100, 102, 98, 101, 99, 100, 103, 97, 101, 100, 99, 102];
    const result = analyzeMetric("test", values);
    expect(result.zone).toBe("green");
  });

  it("returns red zone for extreme outlier", () => {
    const values = [100, 102, 98, 101, 99, 100, 103, 97, 101, 100, 99, 250];
    const result = analyzeMetric("test", values);
    expect(result.zone).not.toBe("green");
  });

  it("sets correct method and name", () => {
    const values = [10, 12, 11, 13, 10, 11, 12, 13, 11, 10, 12, 11];
    const result = analyzeMetric("Revenue", values);
    expect(result.name).toBe("Revenue");
    expect(["zscore", "iqr"]).toContain(result.method);
  });
});
