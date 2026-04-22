import type { ParsedData } from "@/types";

const METRICS = [
  "prod_bug_ratio",
  "wip_testing",
  "bug_lifetime_days",
  "release_delivery_speed",
  "test_debt_ratio",
  "debt_burndown",
  "testing_cycle_time",
  "automation_coverage",
];

// Smooth bell-shaped pressure curve: peaks around week 14-15
function pressureCurve(week: number): number {
  const peak = 14;
  const width = 4;
  return Math.exp(-((week - peak) ** 2) / (2 * width ** 2));
}

// Deterministic pseudo-noise seeded by index to avoid randomness per call
function stableNoise(week: number, seed: number): number {
  const x = Math.sin(week * 127.1 + seed * 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2; // [-1, 1]
}

export function generateDemoData(): ParsedData {
  const rows = Array.from({ length: 24 }, (_, i) => {
    const week = i + 1;
    const weekStr = `2024-W${String(week).padStart(2, "0")}`;
    const p = pressureCurve(week);

    // prod_bug_ratio: baseline 0.15, spike to ~0.45 at peak
    const prod_bug_ratio = +(
      0.15 +
      p * 0.30 +
      stableNoise(week, 1) * 0.015
    ).toFixed(2);

    // wip_testing: baseline 8, rises to ~22 at peak
    const wip_testing = +(
      8 +
      p * 14 +
      stableNoise(week, 2) * 1.2
    ).toFixed(2);

    // bug_lifetime_days: baseline 2.5, correlates with wip_testing
    const bug_lifetime_days = +(
      2.5 +
      p * 4.5 +
      stableNoise(week, 3) * 0.3
    ).toFixed(2);

    // release_delivery_speed: baseline 3, drops at peak; mild seasonality ±10%
    const seasonality = 1 + 0.10 * Math.sin((week / 24) * 2 * Math.PI);
    const release_delivery_speed = +(
      Math.max(0.5, (3 - p * 1.8 + stableNoise(week, 4) * 0.2) * seasonality)
    ).toFixed(2);

    // test_debt_ratio: linear growth from 12% to 28%
    const test_debt_ratio = +(
      12 +
      (week / 24) * 16 +
      stableNoise(week, 5) * 0.6
    ).toFixed(2);

    // debt_burndown: inversely correlated with wip_testing; baseline 6, drops at peak
    const debt_burndown = +(
      Math.max(0.5, 6 - p * 4.2 + stableNoise(week, 6) * 0.4)
    ).toFixed(2);

    // testing_cycle_time: correlates with bug_lifetime_days; baseline 16h, peaks ~40h
    const testing_cycle_time = +(
      16 +
      p * 24 +
      stableNoise(week, 7) * 1.5
    ).toFixed(2);

    // automation_coverage: slow linear growth 35%→58%, plateau during WIP peak (weeks 12-17)
    const plateauFactor = week >= 12 && week <= 17 ? 0.1 : 1;
    const baseGrowth = (week / 24) * 23 * plateauFactor;
    const automation_coverage = +(
      35 +
      baseGrowth +
      stableNoise(week, 8) * 0.5
    ).toFixed(2);

    return {
      period: weekStr,
      values: {
        prod_bug_ratio,
        wip_testing,
        bug_lifetime_days,
        release_delivery_speed,
        test_debt_ratio,
        debt_burndown,
        testing_cycle_time,
        automation_coverage,
      },
    };
  });

  return { headers: METRICS, rows };
}
