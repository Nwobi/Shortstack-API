import { describe, it, expect } from "vitest";
import { generateShortCode, isValidAlias } from "../../src/utils/shortCode";

describe("generateShortCode", () => {
  it("generates a string of the default length (7)", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
  });

  it("generates a string of a custom length", () => {
    expect(generateShortCode(10)).toHaveLength(10);
  });

  it("only uses base62 characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateShortCode()).toMatch(/^[0-9A-Za-z]+$/);
    }
  });

  it("produces different codes on each call", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateShortCode()),
    );
    expect(codes.size).toBe(100);
  });
});

describe("isValidAlias", () => {
  it("accepts valid aliases", () => {
    expect(isValidAlias("my-brand")).toBe(true);
    expect(isValidAlias("ABC123")).toBe(true);
    expect(isValidAlias("abc")).toBe(true);
  });

  it("rejects aliases that are too short", () => {
    expect(isValidAlias("ab")).toBe(false);
  });

  it("rejects aliases with special characters", () => {
    expect(isValidAlias("bad alias!")).toBe(false);
    expect(isValidAlias("under_score")).toBe(false);
  });
});
