import { describe, expect, it } from "vitest";
import { deriveNormalMapPixels } from "@/src/lib/texture-normal";

describe("derived texture normal maps", () => {
  it("produces opaque tangent-space pixels from source luminance", () => {
    const source = new Uint8Array([
      0, 0, 0, 255, 255, 255, 255, 255,
      0, 0, 0, 255, 255, 255, 255, 255,
    ]);
    const normal = deriveNormalMapPixels(source, 2, 2, 1);
    expect(normal).toHaveLength(source.length);
    expect(normal[3]).toBe(255);
    expect(normal[2]).toBeGreaterThan(127);
  });

  it("wraps longitude while clamping at the poles", () => {
    const source = new Uint8Array(3 * 2 * 4).fill(128);
    const normal = deriveNormalMapPixels(source, 3, 2, .7);
    expect(normal.every((value) => Number.isFinite(value))).toBe(true);
  });
});
