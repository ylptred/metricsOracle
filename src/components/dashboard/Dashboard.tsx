"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricChart } from "@/components/charts/MetricChart";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import type { AnalysisResult, MetricAnalysis, ForecastResult } from "@/types";

interface Props {
  result: AnalysisResult;
}

const OVERALL_LABELS = {
  green: { label: "Всё под контролем", dot: "bg-emerald-400", glow: "shadow-[0_0_20px_rgba(52,211,153,0.5)]", text: "text-emerald-400", border: "border-emerald-500/30" },
  yellow: { label: "Требует внимания", dot: "bg-amber-400", glow: "shadow-[0_0_20px_rgba(251,191,36,0.5)]", text: "text-amber-400", border: "border-amber-500/30" },
  red: { label: "Критическое состояние", dot: "bg-red-400", glow: "shadow-[0_0_20px_rgba(248,113,113,0.5)]", text: "text-red-400", border: "border-red-500/30" },
} as const;

const ZONE_DOT = {
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-red-400",
} as const;

const ZONE_TEXT = {
  green: "Зелёная",
  yellow: "Жёлтая",
  red: "Красная",
} as const;

function TrafficLightBadge({ overall }: { overall: "green" | "yellow" | "red" }) {
  const s = OVERALL_LABELS[overall];
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border ${s.border} bg-zinc-900 px-8 py-6`}
      aria-label={`Общий статус: ${s.label}`}
    >
      <div
        className={`h-6 w-6 rounded-full ${s.dot} ${s.glow} ${overall === "red" ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      <span className={`text-lg font-bold ${s.text}`}>{s.label}</span>
    </div>
  );
}

export function Dashboard({ result }: Props) {
  const [activeTab, setActiveTab] = useState("metrics");
  const { parsedData, trafficLight, forecasts } = result;
  const { overall, metrics } = trafficLight;
  const periods = parsedData.rows.map((r) => r.period);

  const redCount = useMemo(() => metrics.filter((m) => m.zone === "red").length, [metrics]);
  const yellowCount = useMemo(() => metrics.filter((m) => m.zone === "yellow").length, [metrics]);
  const greenCount = useMemo(() => metrics.filter((m) => m.zone === "green").length, [metrics]);

  const forecastByName = useMemo(
    () => new Map<string, ForecastResult>(forecasts.map((f) => [f.metricName, f])),
    [forecasts]
  );

  const sortedMetrics = useMemo<MetricAnalysis[]>(
    () => [
      ...metrics.filter((m) => m.zone === "red"),
      ...metrics.filter((m) => m.zone === "yellow"),
      ...metrics.filter((m) => m.zone === "green"),
    ],
    [metrics]
  );

  return (
    <div className="space-y-8">
      {/* ─── Summary row ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-stretch gap-4">
        <TrafficLightBadge overall={overall} />

        <div className="flex flex-1 flex-wrap gap-4 min-w-0">
          {(
            [
              { label: "Всего метрик", value: metrics.length, color: "text-zinc-300" },
              { label: "Красных", value: redCount, color: "text-red-400" },
              { label: "Жёлтых", value: yellowCount, color: "text-amber-400" },
              { label: "Зелёных", value: greenCount, color: "text-emerald-400" },
            ] as const
          ).map(({ label, value, color }) => (
            <div
              key={label}
              className="flex min-w-[100px] flex-1 flex-col justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4"
            >
              <span className={`text-3xl font-black ${color}`} aria-label={`${label}: ${value}`}>{value}</span>
              <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Zone legend mini ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2" aria-label="Метрики по зонам">
        {sortedMetrics.map((m) => (
          <span
            key={m.name}
            className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400"
          >
            <span className={`h-2 w-2 rounded-full ${ZONE_DOT[m.zone]}`} aria-hidden="true" />
            <span className="sr-only">{ZONE_TEXT[m.zone]} зона:</span>
            {m.name}
          </span>
        ))}
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────── */}
      <Tabs defaultValue="metrics" onValueChange={setActiveTab}>
        <TabsList className="border border-zinc-800 bg-zinc-900 h-auto p-1">
          <TabsTrigger
            value="metrics"
            className="rounded-lg px-5 py-2 text-sm data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            Метрики
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="rounded-lg px-5 py-2 text-sm data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            Графики
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="rounded-lg px-5 py-2 text-sm data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            Прогноз
          </TabsTrigger>
        </TabsList>

        {/* МЕТРИКИ */}
        <TabsContent value="metrics" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMetrics.map((m) => (
              <MetricCard key={m.name} analysis={m} periods={periods} />
            ))}
          </div>
        </TabsContent>

        {/* ГРАФИКИ — рендерятся только когда вкладка активна */}
        <TabsContent value="charts" className="mt-6">
          {activeTab === "charts" && (
            <div className="space-y-6">
              {sortedMetrics.map((m) => {
                const fc = forecastByName.get(m.name);
                if (!fc) return null;
                return (
                  <div
                    key={m.name}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-zinc-100">{m.name}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          m.zone === "green"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : m.zone === "yellow"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                        aria-label={`Зона: ${ZONE_TEXT[m.zone]}`}
                      >
                        {ZONE_TEXT[m.zone]} зона
                      </span>
                    </div>
                    <MetricChart analysis={m} forecast={fc} periods={periods} />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ПРОГНОЗ */}
        <TabsContent value="forecast" className="mt-6">
          <ForecastPanel forecasts={forecasts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
