import { describe, it, expect } from "vitest";
import { parseTxt } from "@/lib/parser";

describe("parseTxt", () => {
  it("parses a simple TSV string", () => {
    const input = "period\tRevenue\tCosts\n2024-01\t100\t70\n2024-02\t110\t75";
    const result = parseTxt(input);
    expect(result.headers).toEqual(["Revenue", "Costs"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].period).toBe("2024-01");
    expect(result.rows[0].values["Revenue"]).toBe(100);
  });

  it("returns empty result for empty input", () => {
    const result = parseTxt("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});
