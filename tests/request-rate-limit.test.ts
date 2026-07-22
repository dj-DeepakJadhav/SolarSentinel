import { beforeEach, describe, expect, it } from "vitest";
import { clearRateLimitsForTest, takeRateLimit } from "@/src/lib/request-rate-limit";

describe("briefing rate limit", () => {
  beforeEach(() => clearRateLimitsForTest());

  it("allows the configured number of requests, then blocks the next one", () => {
    for (let attempt = 0; attempt < 2; attempt++) expect(takeRateLimit("test", 1_000, 2, 60_000).allowed).toBe(true);
    expect(takeRateLimit("test", 1_000, 2, 60_000).allowed).toBe(false);
  });

  it("opens a fresh window after expiry", () => {
    takeRateLimit("test", 1_000, 1, 100);
    expect(takeRateLimit("test", 1_100, 1, 100).allowed).toBe(true);
  });
});
