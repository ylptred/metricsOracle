import type { ParsedData } from "@/types";

function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

export function generateDemoData(periods = 12): ParsedData {
  const headers = ["Выручка", "Расходы", "Маржа"];
  const rows = Array.from({ length: periods }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    return {
      period: `2024-${month}`,
      values: {
        Выручка: Math.round(100 + i * 5 + noise(15)),
        Расходы: Math.round(70 + i * 2 + noise(10)),
        Маржа: Math.round(30 + i * 3 + noise(8)),
      },
    };
  });

  const lastRow = rows[rows.length - 1];
  lastRow.values["Выручка"] += 60;

  return { headers, rows };
}
