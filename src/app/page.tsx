"use client";

import { useState, useRef } from "react";
import { Upload, BarChart3, Zap, Shield, ChevronDown, Loader2 } from "lucide-react";
import { UploadZone } from "@/components/upload/UploadZone";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { AnalysisResult } from "@/types";

const STEPS = [
  {
    Icon: Upload,
    title: "Загрузка",
    desc: "Загрузите .txt или .xlsx файл с метриками",
  },
  {
    Icon: Shield,
    title: "Валидация",
    desc: "Проверка формата, типов и полноты данных",
  },
  {
    Icon: BarChart3,
    title: "Анализ",
    desc: "Z-Score и IQR выявляют аномалии в каждой метрике",
  },
  {
    Icon: Zap,
    title: "Прогноз",
    desc: "Линейный тренд показывает, когда зона изменится",
  },
];

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function handleResult(r: AnalysisResult) {
    setResult(r);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  async function runDemo() {
    setIsDemoLoading(true);
    setDemoError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Ошибка");
      handleResult(data as AnalysisResult);
    } catch (e) {
      setDemoError(e instanceof Error ? e.message : "Ошибка демо");
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(52,211,153,0.15),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_110%,rgba(245,158,11,0.06),transparent)]" />

        <span className="mb-6 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-emerald-400">
          Статистический анализ метрик
        </span>

        <h1 className="mb-4 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Метрики,{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            как спасательный оракул
          </span>
        </h1>

        <p className="mb-3 text-xl text-zinc-300 md:text-2xl">
          От диагностики до предсказания будущего
        </p>

        <p className="mb-10 max-w-2xl text-base leading-relaxed text-zinc-500">
          MetricsOracle анализирует временные ряды с помощью Z-Score и IQR, автоматически
          обнаруживает аномалии и строит линейный прогноз. Светофорная система сразу
          показывает: всё под контролем или нужно действовать.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() =>
              document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })
            }
            className="rounded-lg bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Загрузить файл
          </button>
          <button
            onClick={runDemo}
            disabled={isDemoLoading}
            aria-label="Запустить демо-анализ на синтетических данных"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-7 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            {isDemoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Запустить демо
          </button>
        </div>

        {demoError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {demoError}
          </p>
        )}

        <button
          onClick={() =>
            document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-8 animate-bounce text-zinc-600 transition-colors hover:text-zinc-400"
          aria-label="Прокрутить вниз"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      {/* ─── КАК ЭТО РАБОТАЕТ ─────────────────────────────────────── */}
      <section id="how" className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold">Как это работает</h2>
          <p className="mb-14 text-center text-zinc-500">Четыре шага от файла до прогноза</p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
              >
                <span className="absolute right-4 top-4 text-4xl font-black text-zinc-800/60 select-none">
                  {i + 1}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold text-zinc-100">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ЗАГРУЗКА ─────────────────────────────────────────────── */}
      <section id="upload" className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl font-bold">Загрузить данные</h2>
          <p className="mb-10 text-center text-zinc-500">Форматы: .txt (TSV) или .xlsx</p>

          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm">
            <p className="mb-3 font-medium text-zinc-300">Формат файла:</p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-zinc-500">
              <li>Первая строка — заголовки: период + названия метрик</li>
              <li>Первая колонка — период (например, 2024-W01)</li>
              <li>Остальные колонки — числовые значения метрик</li>
              <li>Минимум 8 строк для корректного анализа</li>
            </ul>
            <pre className="overflow-x-auto rounded-xl bg-zinc-800 px-4 py-3 font-mono text-xs text-zinc-300 leading-relaxed">
              {`period     bug_ratio  wip_count  cycle_time\n2024-W01   0.12       8          14.5\n2024-W02   0.15       10         16.2\n2024-W03   0.18       12         17.8`}
            </pre>
          </div>

          <UploadZone onResult={handleResult} />
        </div>
      </section>

      {/* ─── РЕЗУЛЬТАТЫ ───────────────────────────────────────────── */}
      <div
        ref={resultsRef}
        className={`transition-all duration-700 ${
          result ? "opacity-100" : "pointer-events-none h-0 overflow-hidden opacity-0"
        }`}
      >
        {result && (
          <section className="px-4 pb-24 pt-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-10 text-center text-3xl font-bold">Результаты анализа</h2>
              <ErrorBoundary>
                <Dashboard result={result} />
              </ErrorBoundary>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
