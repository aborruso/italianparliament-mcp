import { describe, it, expect } from "vitest";
import { toTitleCase, normalizeGender } from "./normalize.js";

describe("toTitleCase", () => {
  it("converts all-uppercase names to title case", () => {
    expect(toTitleCase("GIORGIA")).toBe("Giorgia");
    expect(toTitleCase("MELONI")).toBe("Meloni");
  });

  it("capitalizes each word", () => {
    expect(toTitleCase("DI MAIO")).toBe("Di Maio");
  });

  it("capitalizes after apostrophes and hyphens", () => {
    expect(toTitleCase("D'ALEMA")).toBe("D'Alema");
    expect(toTitleCase("MARIA-TERESA")).toBe("Maria-Teresa");
  });

  it("leaves already title-cased names unchanged", () => {
    expect(toTitleCase("Marco")).toBe("Marco");
    expect(toTitleCase("Meloni")).toBe("Meloni");
  });

  it("returns empty string as-is", () => {
    expect(toTitleCase("")).toBe("");
  });
});

describe("normalizeGender", () => {
  it("maps single-letter Senato codes to full words", () => {
    expect(normalizeGender("M")).toBe("male");
    expect(normalizeGender("F")).toBe("female");
  });

  it("leaves already-full Camera values unchanged", () => {
    expect(normalizeGender("male")).toBe("male");
    expect(normalizeGender("female")).toBe("female");
  });

  it("leaves empty string as-is", () => {
    expect(normalizeGender("")).toBe("");
  });
});
