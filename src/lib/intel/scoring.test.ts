import { describe, expect, it } from "vitest";
import { calculateM1Score, clampScore } from "./scoring";

describe("clampScore", () => {
  it("keeps scores inside the 0 to 100 range", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(55)).toBe(55);
    expect(clampScore(140)).toBe(100);
  });
});

describe("calculateM1Score", () => {
  it("returns the transparent M1 baseline with no hidden adjustments", () => {
    const score = calculateM1Score(null);

    expect(score.value).toBe(50);
    expect(score.adjustments).toEqual([]);
    expect(score.methodology).toContain("M1");
  });
});
