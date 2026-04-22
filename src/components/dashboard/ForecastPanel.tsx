"use client";

import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import type { ForecastResult } from "@/types";

interface Props {
  forecasts: ForecastResult[];
}

const STABLE_THRESHOLD = 0.01;

function SlopeIcon({ slope }: { slope: number }) {
  if (slope >= STABLE_THRESHOLD)
    return <TrendingUp className="h-5 w-5 text-red-400" />;
  if (slope <= -STABLE_THRESHOLD)
    return <TrendingDown className="h-5 w-5 text-emerald-400" />;
  return <Minus className="h-5 w-5 text-zinc-500" />;
}

function SlopeLabel({ slope }: { slope: number }) {
  if (slope >= STABLE_THRESHOLD)
    return <span className="text-red-400">Рост</span>;
  if (slope <= -STABLE_THRESHOLD)
    return <span className="text-emerald-400">Снижение</span>;
  return <span className="text-zinc-500">Стабильно</span>;
}

export function ForecastPanel({ forecasts }: Props) {
  return (
    <div className="space-y-3">
      {forecasts.map((f) => (
        <div
          key={f.metricName}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-start"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
            <SlopeIcon slope={f.slope} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-100 break-all">{f.metricName}</span>
              <SlopeLabel slope={f.slope} />
            </div>
            <p className="mb-2 text-sm text-zinc-400">{f.prediction}</p>
            <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
              <span>
                Наклон:{" "}
                <span
                  className={`font-mono ${
                    f.slope >= STABLE_THRESHOLD
                      ? "text-red-400"
                      : f.slope <= -STABLE_THRESHOLD
                      ? "text-emerald-400"
                      : "text-zinc-400"
                  }`}
                >
                  {f.slope >= 0 ? "+" : ""}
                  {f.slope.toFixed(4)}
                </span>{" "}
                / период
              </span>
              {f.periodsUntilZoneChange !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Смена зоны через{" "}
                  <span className="font-mono text-amber-400">~{f.periodsUntilZoneChange}</span>{" "}
                  пер.
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
