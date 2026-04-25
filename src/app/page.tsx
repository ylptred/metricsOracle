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
    desc: "Загрузите .csv или .xlsx файл с метриками",
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
          Метрики{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            как спасательный оракул
          </span>
        </h1>

        <p className="mb-3 text-xl text-zinc-300 md:text-2xl">
          От диагностики до предсказания будущего
        </p>

        <p className="mb-10 max-w-2xl text-base leading-relaxed text-zinc-500">
          MetricsOracle анализирует временные ряды с помощью Z-Score и IQR, автоматически
          обнаруживает аномалии и строит линейный прогноз. Сформированный светофор сразу показывает: всё под контролем или нужно действовать.
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
          <a
            href="#contacts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-amber-500 hover:bg-amber-400 text-black font-semibold
                       transition-all duration-200 hover:scale-105 shadow-lg
                       shadow-amber-500/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03
                       8-9 8a9.953 9.953 0 01-4.929-1.301L3 20l1.395-3.72
                       C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9
                       3.582 9 8z" />
            </svg>
            Хотите задать вопрос или связаться?
          </a>
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

      {/* ─── ПРЕЗЕНТАЦИЯ ──────────────────────────────────────────── */}
      <section className="w-full flex justify-center px-4 pb-8">
        <a
          href="https://disk.yandex.ru/d/47PzDiosrwcnkQ"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 w-full max-w-2xl
                     rounded-2xl border border-white/10 bg-white/5
                     backdrop-blur-sm px-6 py-5
                     hover:border-white/20 hover:bg-white/10
                     transition-all duration-300"
        >
          <div className="flex-shrink-0 flex items-center justify-center
                          w-12 h-12 rounded-xl bg-indigo-500/20
                          group-hover:bg-indigo-500/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-400"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414
                       A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/60 mb-0.5">Материалы доклада</p>
            <p className="text-base font-semibold text-white truncate">
              Презентация: Метрики как спасательный оракул
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg"
               className="w-5 h-5 text-white/30 group-hover:text-white/60
                          group-hover:translate-x-1 transition-all flex-shrink-0"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
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
          <p className="mb-10 text-center text-zinc-500">Форматы: .csv или .xlsx</p>

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

      {/* ─── КОНТАКТЫ ─────────────────────────────────────────────── */}
      <section id="contacts" className="w-full max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-white/10 bg-white/5
                        backdrop-blur-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Хотите задать вопрос или связаться?
          </h2>
          <p className="text-white/50 text-sm mb-8">
            Буду рад ответить на вопросы по докладу
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://t.me/shnappis" target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl
                          bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/30
                          text-[#229ED9] font-medium transition-all duration-200
                          hover:scale-105">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373
                         12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658
                         -.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295
                         -.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373
                         -.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953
                         l11.57-4.461c.537-.194 1.006.131.496.969z"/>
              </svg>
              @shnappis
            </a>
            <a href="https://www.linkedin.com/in/danila-smirnov-702a39381"
               target="_blank" rel="noopener noreferrer"
               className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl
                          bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/30
                          text-[#0A66C2] font-medium transition-all duration-200
                          hover:scale-105">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852
                         -3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414
                         v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267
                         2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063
                         -2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9
                         h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542
                         C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24
                         22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Danila Smirnov
            </a>
            <a href="mailto:ylptred@gmail.com"
               className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl
                          bg-white/5 hover:bg-white/10 border border-white/10
                          text-white/70 hover:text-white font-medium transition-all
                          duration-200 hover:scale-105">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0
                         002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              ylptred@gmail.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
