import { NextRequest, NextResponse } from "next/server";
import { generateDemoData } from "@/lib/demoData";
import { validateFile } from "@/lib/validator";
import { parseFile } from "@/lib/parser";
import { analyzeMetric, buildTrafficLight } from "@/lib/analytics";
import { buildForecast } from "@/lib/forecast";
import type { AnalysisResult } from "@/types";

const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Превышено время обработки")), ms)
    ),
  ]);
}

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const result = await withTimeout(processRequest(req), TIMEOUT_MS);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Внутренняя ошибка";
    const status = message.includes("Превышено") ? 500 : 400;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
}

async function processRequest(req: NextRequest): Promise<AnalysisResult> {
  const contentType = req.headers.get("content-type") ?? "";

  let parsedData;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    if (!body?.demo) {
      throw new Error("Ожидалось { demo: true } или multipart/form-data с полем file");
    }
    parsedData = generateDemoData();
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Поле 'file' отсутствует или не является файлом");
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    parsedData = await parseFile(file);
  } else {
    throw new Error("Неподдерживаемый Content-Type");
  }

  const metricAnalyses = parsedData.headers.map((name) => {
    const values = parsedData.rows.map((r) => r.values[name] ?? 0);
    return analyzeMetric(name, values);
  });

  const trafficLight = buildTrafficLight(metricAnalyses);

  const forecasts = metricAnalyses.map((analysis) => {
    const values = parsedData.rows.map((r) => r.values[analysis.name] ?? 0);
    return buildForecast(analysis.name, values, analysis, "period");
  });

  return { parsedData, trafficLight, forecasts };
}
