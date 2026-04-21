import type { MetricAnalysis, TrafficLight } from "@/types";

export function computeTrafficLight(metrics: MetricAnalysis[]): TrafficLight {
  const hasRed = metrics.some((m) => m.zone === "red");
  const hasYellow = metrics.some((m) => m.zone === "yellow");

  const overall = hasRed ? "red" : hasYellow ? "yellow" : "green";
  return { overall, metrics };
}
