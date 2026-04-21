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
