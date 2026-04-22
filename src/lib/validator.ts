import { z } from "zod";
import type { ParsedData } from "@/types";

export const parsedDataSchema = z.object({
  headers: z.array(z.string()).min(1, "Нужна хотя бы одна метрика"),
  rows: z
    .array(
      z.object({
        period: z.string().min(1),
        values: z.record(z.number()),
      })
    )
    .min(3, "Нужно минимум 3 периода для анализа"),
});

export type ValidatedParsedData = z.infer<typeof parsedDataSchema>;

export function validateParsedData(data: ParsedData): {
  success: true;
  data: ValidatedParsedData;
} | {
  success: false;
  errors: string[];
} {
  const result = parsedDataSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const name = file.name.toLowerCase();
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.substring(lastDot) : "";

  if (![".txt", ".xlsx", ".xls"].includes(ext)) {
    return {
      valid: false,
      error: `Неподдерживаемое расширение "${ext}". Допустимые: .txt, .xlsx, .xls`,
    };
  }

  const allowedMimes = [
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  if (file.type && !allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Неподдерживаемый MIME-тип: ${file.type}`,
    };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 5 МБ`,
    };
  }

  return { valid: true };
}
