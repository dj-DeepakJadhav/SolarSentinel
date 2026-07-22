import { describe, expect, it } from "vitest";
import { atlasChapters, atlasInfo, enablesSdoEffects } from "@/src/lib/atlas";

describe("Atlas chapter information", () => {
  it("gives every chapter a sourced mini-story, not just a one-line fact", () => {
    for (const chapter of atlasChapters) {
      const info = atlasInfo[chapter.id];
      expect(info).toBeDefined();
      expect(info.description.length).toBeGreaterThan(30);
      expect(info.fact.length).toBeGreaterThan(20);
      expect(info.factDetails).toHaveLength(2);
      expect(info.factDetails.every((detail) => detail.label.length > 2 && detail.copy.length > 40)).toBe(true);
      expect(info.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("holds live SDO effects until the final observer chapter", () => {
    expect(atlasChapters.filter(enablesSdoEffects).map((chapter) => chapter.number)).toEqual(["12"]);
  });
});
