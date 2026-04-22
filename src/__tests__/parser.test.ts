import { describe, it, expect } from "vitest";
import { parseTxt, parseFile } from "@/lib/parser";

describe("parseTxt", () => {
  it("parses tab-separated data correctly", () => {
    const input =
      "period\tRevenue\tCosts\n" +
      "2024-01\t100\t70\n" +
      "2024-02\t110\t75\n" +
      "2024-03\t120\t80\n" +
      "2024-04\t130\t85\n" +
      "2024-05\t140\t90";
    const result = parseTxt(input);
    expect(result.headers).toEqual(["Revenue", "Costs"]);
    expect(result.rows).toHaveLength(5);
    expect(result.rows[0].period).toBe("2024-01");
    expect(result.rows[0].values["Revenue"]).toBe(100);
  });

  it("parses comma-separated data correctly", () => {
    const input =
      "period,Sales,Costs\n" +
      "2024-01,200,150\n" +
      "2024-02,210,155\n" +
      "2024-03,220,160\n" +
      "2024-04,230,165\n" +
      "2024-05,240,170";
    const result = parseTxt(input);
    expect(result.headers).toEqual(["Sales", "Costs"]);
    expect(result.rows[0].values["Sales"]).toBe(200);
  });

  it("returns empty result for empty input", () => {
    const result = parseTxt("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});

describe("parseFile", () => {
  function makeTxtFile(content: string, name = "data.txt"): File {
    return new File([content], name, { type: "text/plain" });
  }

  const validContent =
    "period\tRevenue\tCosts\n" +
    "2024-01\t100\t70\n" +
    "2024-02\t110\t75\n" +
    "2024-03\t120\t80\n" +
    "2024-04\t130\t85\n" +
    "2024-05\t140\t90";

  it("parses a valid txt file with tab delimiter", async () => {
    const file = makeTxtFile(validContent);
    const result = await parseFile(file);
    expect(result.headers).toEqual(["Revenue", "Costs"]);
    expect(result.rows).toHaveLength(5);
    expect(result.rows[0].period).toBe("2024-01");
  });

  it("parses a valid txt file with comma delimiter", async () => {
    const content =
      "period,Revenue,Costs\n" +
      "2024-01,100,70\n" +
      "2024-02,110,75\n" +
      "2024-03,120,80\n" +
      "2024-04,130,85\n" +
      "2024-05,140,90";
    const file = makeTxtFile(content);
    const result = await parseFile(file);
    expect(result.headers).toEqual(["Revenue", "Costs"]);
    expect(result.rows[1].values["Costs"]).toBe(75);
  });

  it("throws an error when data has fewer than 5 rows", async () => {
    const content =
      "period\tRevenue\n" +
      "2024-01\t100\n" +
      "2024-02\t110\n" +
      "2024-03\t120\n" +
      "2024-04\t130";
    const file = makeTxtFile(content);
    await expect(parseFile(file)).rejects.toThrow(/5/);
  });

  it("throws an error for non-numeric metric values", async () => {
    const content =
      "period\tRevenue\n" +
      "2024-01\t100\n" +
      "2024-02\tabc\n" +
      "2024-03\t120\n" +
      "2024-04\t130\n" +
      "2024-05\t140";
    const file = makeTxtFile(content);
    await expect(parseFile(file)).rejects.toThrow(/числ/i);
  });

  it("throws an error when no metric columns are present", async () => {
    const content =
      "period\n2024-01\n2024-02\n2024-03\n2024-04\n2024-05\n2024-06";
    const file = makeTxtFile(content);
    await expect(parseFile(file)).rejects.toThrow(/колонк|метрик/i);
  });
});
