import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/src/lib/fixture";
import { deriveLiveVisualState, deriveScenario } from "@/src/lib/scenario";

describe("scenario engine", () => {
  it("keeps the live visual intensity bounded", () => {
    const result = deriveLiveVisualState(demoSnapshot);
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });
  it("makes a strong scenario more expressive than quiet", () => {
    expect(deriveScenario("strong").auroraScale).toBeGreaterThan(deriveScenario("quiet").auroraScale);
  });
});
