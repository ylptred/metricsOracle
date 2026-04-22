import type { ParsedData, MetricRow } from "@/types";

function detectDelimiter(line: string): RegExp {
  const tabCount = (line.match(/\t/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return tabCount >= commaCount ? /\t/ : /,/;
}

export function parseTxt(content: string): ParsedData {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const metricHeaders = headers.slice(1);

  const rows: MetricRow[] = lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim());
    const period = cells[0];
    const values: Record<string, number> = {};
    metricHeaders.forEach((h, i) => {
      const raw = cells[i + 1];
      values[h] = raw !== undefined && raw !== "" ? parseFloat(raw) : NaN;
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
      const cell = cells[i + 1];
      values[h] =
        cell !== undefined && cell !== "" ? parseFloat(String(cell)) : NaN;
    });
    return { period, values };
  });

  return { headers: metricHeaders, rows };
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<ParsedData> {
  const name = file.name.toLowerCase();

  let data: ParsedData;

  if (name.endsWith(".txt")) {
    const content = await readAsText(file);
    data = parseTxt(content);
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = await readAsArrayBuffer(file);
    data = await parseXlsx(buffer);
  } else {
    throw new Error("Неподдерживаемый формат файла");
  }

  if (data.headers.length < 1) {
    throw new Error(
      "Файл должен содержать минимум 2 колонки: период и хотя бы одна метрика"
    );
  }

  if (data.rows.length < 5) {
    throw new Error(
      `Недостаточно строк данных: найдено ${data.rows.length}, требуется минимум 5`
    );
  }

  for (const row of data.rows) {
    if (!row.period || row.period.trim() === "") {
      throw new Error("Колонка периода содержит пустые значения");
    }
    for (const [metric, value] of Object.entries(row.values)) {
      if (isNaN(value)) {
        throw new Error(
          `Значение метрики "${metric}" в периоде "${row.period}" не является числом`
        );
      }
    }
  }

  return data;
}
