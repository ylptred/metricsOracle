"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { MetricAnalysis, ForecastResult } from "@/types";

interface Props {
  analysis: MetricAnalysis;
  forecast: ForecastResult;
  periods: string[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-zinc-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono">
            {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const FORECAST_AHEAD = 5;

export function MetricChart({ analysis, forecast, periods }: Props) {
  const n = analysis.values.length;
  const { thresholds, method, upperFence, lowerFence, mean, std } = analysis;

  const historicalData = analysis.values.map((value, i) => ({
    period: periods[i] ?? `${i + 1}`,
    value,
    trend: forecast.trendLine[i],
    forecastTrend: i === n - 1 ? forecast.trendLine[i] : undefined,
  }));

  const forecastData = Array.from({ length: FORECAST_AHEAD }, (_, i) => ({
    period: `+${i + 1}`,
    value: undefined,
    trend: undefined,
    forecastTrend: forecast.slope * (n + i) + forecast.intercept,
  }));

  const data = [...historicalData, ...forecastData];

  const forecastValues = forecastData.map((d) => d.forecastTrend);
  const allValues = analysis.values.concat(forecast.trendLine).concat(forecastValues);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = (maxVal - minVal) * 0.15 || 1;
  const yMin = Math.floor((minVal - padding) * 100) / 100;
  const yMax = Math.ceil((maxVal + padding) * 100) / 100;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            domain={[yMin, yMax]}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
            iconType="plainline"
          />

          {thresholds && (
            <>
              <ReferenceArea
                y1={thresholds.yellowLower}
                y2={thresholds.yellowUpper}
                fill="#22c55e"
                fillOpacity={0.07}
              />
              <ReferenceLine
                y={thresholds.yellowUpper}
                stroke="#eab308"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "yellow ▲", fill: "#eab308", fontSize: 11, position: "insideTopRight" }}
              />
              <ReferenceLine
                y={thresholds.yellowLower}
                stroke="#eab308"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "yellow ▼", fill: "#eab308", fontSize: 11, position: "insideBottomRight" }}
              />
              <ReferenceLine
                y={thresholds.redUpper}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "red ▲", fill: "#ef4444", fontSize: 11, position: "insideTopRight" }}
              />
              <ReferenceLine
                y={thresholds.redLower}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "red ▼", fill: "#ef4444", fontSize: 11, position: "insideBottomRight" }}
              />
            </>
          )}

          {method === "zscore" && mean !== undefined && (
            <ReferenceLine
              y={mean}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `mean: ${mean.toFixed(2)}`, position: "insideTopLeft", fill: "#94a3b8", fontSize: 11 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            name="значение"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#60a5fa" }}
          />
          <Line
            type="linear"
            dataKey="trend"
            name="тренд"
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            activeDot={false}
          />
          <Line
            type="linear"
            dataKey="forecastTrend"
            name="прогноз"
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {method === "iqr" && upperFence !== undefined && lowerFence !== undefined && (
        <div className="mt-1 flex gap-4 px-2 text-xs text-zinc-500">
          <span>
            Верхняя граница (Q3 + 1.5·IQR):{" "}
            <span className="font-mono text-zinc-400">{upperFence.toFixed(2)}</span>
          </span>
          <span>
            Нижняя граница (Q1 − 1.5·IQR):{" "}
            <span className="font-mono text-zinc-400">{lowerFence.toFixed(2)}</span>
          </span>
        </div>
      )}

      {method === "zscore" && mean !== undefined && std !== undefined && (
        <div className="mt-1 flex gap-4 px-2 text-xs text-zinc-500">
          <span>
            Среднее:{" "}
            <span className="font-mono text-zinc-400">{mean.toFixed(2)}</span>
          </span>
          <span>
            Стд. отклонение:{" "}
            <span className="font-mono text-zinc-400">{std.toFixed(2)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
