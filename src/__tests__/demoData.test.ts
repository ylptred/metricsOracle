import { describe, it, expect } from "vitest";
import { generateDemoData } from "@/lib/demoData";

const REQUIRED_METRICS = [
  "prod_bug_ratio",
  "wip_testing",
  "bug_lifetime_days",
  "release_delivery_speed",
  "test_debt_ratio",
  "debt_burndown",
  "testing_cycle_time",
  "automation_coverage",
];

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((sum, x) => sum + (x - mx) ** 2, 0) *
      ys.reduce((sum, y) => sum + (y - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

describe("generateDemoData", () => {
  const data = generateDemoData();

  it("возвращает ровно 24 строки", () => {
    expect(data.rows).toHaveLength(24);
  });

  it("содержит все 8 обязательных метрик в headers", () => {
    for (const metric of REQUIRED_METRICS) {
      expect(data.headers).toContain(metric);
    }
  });

  it("все значения метрик являются числами", () => {
    for (const row of data.rows) {
      for (const metric of REQUIRED_METRICS) {
        const val = row.values[metric];
        expect(typeof val).toBe("number");
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });

  it("prod_bug_ratio и wip_testing положительно коррелируют (r > 0.7)", () => {
    const bugRatio = data.rows.map((r) => r.values["prod_bug_ratio"]);
    const wip = data.rows.map((r) => r.values["wip_testing"]);
    const r = pearson(bugRatio, wip);
    expect(r).toBeGreaterThan(0.7);
  });
});
