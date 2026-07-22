import { describe, expect, it } from "vitest";
import { solarWeatherMission } from "@/src/lib/space-missions";

describe("solar weather learning mission", () => {
  it("ships distinct, source-first prompts for students and teachers", () => {
    expect(solarWeatherMission.status).toBe("live");
    expect(solarWeatherMission.sourceLabel).toContain("NASA SDO");
    expect(solarWeatherMission.prompts.student.length).toBeGreaterThan(0);
    expect(solarWeatherMission.prompts.teacher.length).toBeGreaterThan(0);
    expect(solarWeatherMission.prompts.teacher).not.toEqual(solarWeatherMission.prompts.student);
  });
});
