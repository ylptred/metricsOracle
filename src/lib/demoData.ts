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

// Hardcoded series for metrics that need clearly non-normal distributions (sharp mid-period peak).
// Peak is contained to W11–W16 (6 values), rest is baseline — this keeps Q3 at baseline level
// so Tukey fences are visible on the chart and outlier peaks land above upperFence.
const WIP_TESTING_VALUES = [
  8, 7, 8, 9, 7, 8, 9, 7, 8,        // W01–W09: stable low 7-9
  9,                                   // W10: still baseline
  14, 16, 17, 18, 16, 14,            // W11–W16: peak (above upperFence ≈13.6)
  8, 8,                                // W17–W18: quick return
  9, 8, 9, 8, 9, 8,                  // W19–W24: stable low → last point green
];

const BUG_LIFETIME_VALUES = [
  2.2, 2.0, 2.3, 2.5, 2.0, 2.4, 2.2, 2.0, 2.3,  // W01–W09: stable 2.0-2.5
  2.5,                                               // W10: baseline
  8.0, 10.0, 11.0, 12.0, 10.0, 8.0,               // W11–W16: peak (above upperFence ≈8.1)
  3.5, 3.0,                                          // W17–W18: transition
  2.5, 2.8, 3.0, 2.5, 2.8, 2.5,                   // W19–W24: return → last point green
];

const TESTING_CYCLE_VALUES = [
  6.0, 5.5, 6.0, 7.0, 5.5, 6.5, 7.0, 5.5, 6.0,  // W01–W09: stable 5.5-7
  6.5,                                               // W10: baseline
  13.0, 15.0, 17.0, 18.0, 16.0, 14.0,             // W11–W16: peak (above upperFence ≈14.1)
  8.0, 7.0,                                          // W17–W18: transition
  7.0, 6.0, 7.5, 6.0, 7.0, 6.5,                   // W19–W24: return → last point green
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

    const wip_testing = WIP_TESTING_VALUES[i];
    const bug_lifetime_days = BUG_LIFETIME_VALUES[i];

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

    const testing_cycle_time = TESTING_CYCLE_VALUES[i];

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
