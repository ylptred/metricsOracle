import { describe, it, expect } from "vitest";
import { validateFile } from "@/lib/validator";

describe("validateFile", () => {
  it("returns invalid for file larger than 1 MB", () => {
    const content = "x".repeat(2 * 1024 * 1024);
    const file = new File([content], "big.csv", { type: "text/csv" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/большой/i);
  });

  it("returns invalid for unsupported extension", () => {
    const file = new File(["data"], "data.json", { type: "application/json" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/расширение/i);
  });

  it("returns valid for correct .csv file", () => {
    const file = new File(["period,metric\n2024-W01,1.0"], "data.csv", {
      type: "text/csv",
    });
    expect(validateFile(file).valid).toBe(true);
  });
});
