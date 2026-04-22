"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { MetricAnalysis } from "@/types";

interface Props {
  analysis: MetricAnalysis;
  periods: string[];
}

const ZONE_STYLES = {
  green: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    label: "Зелёная зона",
    stroke: "#34d399",
  },
  yellow: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    label: "Жёлтая зона",
    stroke: "#fbbf24",
  },
  red: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Красная зона",
    stroke: "#f87171",
  },
} as const;

const METHOD_TOOLTIP = {
  zscore:
    "Z-Score: используется когда распределение близко к нормальному. Аномалия — отклонение больше σ.",
  iqr: "IQR: используется для скошенных распределений. Аномалия — выход за Q1–Q3 ± 1.5·IQR.",
} as const;

export function MetricCard({ analysis, periods: _periods }: Props) {
  const { name, method, score, zone, values } = analysis;
  const zoneStyle = ZONE_STYLES[zone];
  const sparkData = values.slice(-8).map((v, i) => ({ i, v }));

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-100 leading-snug break-all">{name}</h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${zoneStyle.badge}`}
        >
          {zoneStyle.label}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3 text-sm text-zinc-500">
        <div className="group relative inline-block">
          <span className="cursor-help rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400 transition-colors hover:border-zinc-600">
            {method === "zscore" ? "Z-Score" : "IQR"}
          </span>
          <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs leading-relaxed text-zinc-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            {METHOD_TOOLTIP[method]}
          </div>
        </div>
        <span className="text-zinc-600">·</span>
        <span>
          Score:{" "}
          <span className="font-mono text-zinc-300">{score.toFixed(3)}</span>
        </span>
      </div>

      <div className="mt-auto h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={zoneStyle.stroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-right text-xs text-zinc-600">
        последние {sparkData.length} значений
      </p>
    </div>
  );
}
