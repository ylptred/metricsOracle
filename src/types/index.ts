export interface MetricRow {
  period: string;
  values: Record<string, number>;
}

export interface ParsedData {
  headers: string[];
  rows: MetricRow[];
}

export interface ZoneThresholds {
  yellowUpper: number;
  redUpper: number;
  yellowLower: number;
  redLower: number;
}

export interface MetricAnalysis {
  name: string;
  method: "zscore" | "iqr";
  score: number;
  zone: "green" | "yellow" | "red";
  values: number[];
  mean?: number;
  std?: number;
  q1?: number;
  q3?: number;
  iqrValue?: number;
  upperFence?: number;
  lowerFence?: number;
  thresholds?: ZoneThresholds;
}

export interface TrafficLight {
  overall: "green" | "yellow" | "red";
  metrics: MetricAnalysis[];
}

export interface ForecastResult {
  metricName: string;
  slope: number;
  intercept: number;
  trendLine: number[];
  prediction: string;
  periodsUntilZoneChange: number | null;
}

export interface AnalysisResult {
  parsedData: ParsedData;
  trafficLight: TrafficLight;
  forecasts: ForecastResult[];
}
