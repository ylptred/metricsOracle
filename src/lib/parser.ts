import type { ParsedData, MetricRow } from "@/types";

export function parseTxt(content: string): ParsedData {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(/[\t,;]/).map((h) => h.trim());
  const metricHeaders = headers.slice(1);

  const rows: MetricRow[] = lines.slice(1).map((line) => {
    const cells = line.split(/[\t,;]/).map((c) => c.trim());
    const period = cells[0];
    const values: Record<string, number> = {};
    metricHeaders.forEach((h, i) => {
      values[h] = parseFloat(cells[i + 1]) || 0;
    });
    return { period, values };
  });

  return { headers: metricHeaders, rows };
}

export async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedData> {
  const { read, utils } = await import("xlsx");
  const workbook = read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (raw.length < 2) return { headers: [], rows: [] };

  const headerRow = raw[0] as string[];
  const metricHeaders = headerRow.slice(1).map(String);

  const rows: MetricRow[] = (raw.slice(1) as string[][]).map((cells) => {
    const period = String(cells[0] ?? "");
    const values: Record<string, number> = {};
    metricHeaders.forEach((h, i) => {
      values[h] = parseFloat(String(cells[i + 1])) || 0;
    });
    return { period, values };
  });

  return { headers: metricHeaders, rows };
}
