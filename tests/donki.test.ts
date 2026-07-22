import { describe, expect, it } from "vitest";
import { createReplayTimeline, normalizeMay2024Replay } from "@/src/lib/providers/donki";

describe("DONKI May 2024 replay", () => {
  it("normalizes the catalogue event without inventing missing solar-wind values", () => {
    const result = normalizeMay2024Replay([{ gstID: "2024-05-10T15:00:00-GST-001", startTime: "2024-05-10T15:00Z", link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1", submissionTime: "2024-05-10T18:44Z", linkedEvents: [{ activityID: "2024-05-08T05:36:00-CME-001" }], allKpIndex: [{ observedTime: "2024-05-10T21:00Z", kpIndex: 8.67 }, { observedTime: "2024-05-11T00:00Z", kpIndex: 9 }] }], "2026-07-17T12:00:00Z");
    expect(result.status).toBe("replay");
    expect(result.kpObserved).toBe(9);
    expect(result.solarWindSpeedKms).toBeNull();
    expect(result.provenance[0]?.provider).toBe("NASA_DONKI");
  });

  it("keeps the replay timeline limited to dated DONKI Kp observations", () => {
    const timeline = createReplayTimeline([{ gstID: "2024-05-10T15:00:00-GST-001", allKpIndex: [
      { observedTime: "2024-05-10T21:00Z", kpIndex: 5.33 },
      { observedTime: "2024-05-11T00:00Z", kpIndex: 9 },
      { observedTime: "2024-05-11T03:00Z", kpIndex: 7 },
      { observedTime: "not-a-date", kpIndex: 8 },
    ] }]);
    expect(timeline).toEqual([
      expect.objectContaining({ observedAt: "2024-05-10T21:00Z", kpIndex: 5.33 }),
      expect.objectContaining({ observedAt: "2024-05-11T00:00Z", kpIndex: 9 }),
      expect.objectContaining({ observedAt: "2024-05-11T03:00Z", kpIndex: 7 }),
    ]);
  });
});
