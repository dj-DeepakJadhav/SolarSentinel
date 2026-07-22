import { describe, expect, it } from "vitest";
import { parseHorizonsVector } from "@/src/lib/providers/horizons";

describe("NASA JPL Horizons vectors", () => {
  it("parses an AU/day Cartesian state vector from the official response envelope", () => {
    const result = parseHorizonsVector({ result: "header\n$$SOE\n2461239.5 = A.D. 2026-Jul-18\n X = 4.302887483162997E-01 Y =-9.207120721206883E-01 Z = 5.335880848154005E-05\n VX= 1.531001970042685E-02 VY= 7.226268560018027E-03 VZ= 1.310450899283960E-07\n$$EOE" });
    expect(result.position).toEqual([.4302887483162997, -.9207120721206883, .00005335880848154005]);
    expect(result.velocity[0]).toBeCloseTo(.01531001970042685);
  });

  it("rejects a response that does not include a state vector", () => {
    expect(() => parseHorizonsVector({ result: "$$SOE\nNo vector\n$$EOE" })).toThrow("Cartesian state vector");
  });
});
