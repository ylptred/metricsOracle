import { describe, it, expect } from "vitest";
import { validateFile } from "@/lib/validator";

describe("validateFile", () => {
  it("returns invalid for file larger than 5 MB", () => {
    const content = "x".repeat(6 * 1024 * 1024);
    const file = new File([content], "big.txt", { type: "text/plain" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/большой/i);
  });

  it("returns invalid for unsupported extension", () => {
    const file = new File(["data"], "data.csv", { type: "text/csv" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/расширение/i);
  });

  it("returns valid for correct .txt file", () => {
    const file = new File(["period\tmetric\n2024-W01\t1.0"], "data.txt", {
      type: "text/plain",
    });
    expect(validateFile(file).valid).toBe(true);
  });
});
