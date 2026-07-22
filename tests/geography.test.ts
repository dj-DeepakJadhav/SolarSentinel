import { describe, expect, it } from "vitest";
import { earthYawForLocation, locationToCartesian } from "@/src/lib/geography";

const closeTo = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 8);

describe("Earth location presentation", () => {
  it("places locations on a latitude/longitude sphere", () => {
    const northPole = locationToCartesian({ latitude: 90, longitude: 0 }, 1);
    closeTo(northPole.x, 0);
    closeTo(northPole.y, 1);
    closeTo(northPole.z, 0);
  });

  it("rotates the selected longitude toward the camera without changing its latitude", () => {
    const location = { latitude: 53.8655, longitude: 10.6866 };
    const marker = locationToCartesian(location, 1);
    const yaw = earthYawForLocation(location);
    const presented = {
      x: Math.cos(yaw) * marker.x + Math.sin(yaw) * marker.z,
      y: marker.y,
      z: -Math.sin(yaw) * marker.x + Math.cos(yaw) * marker.z,
    };
    closeTo(presented.x, 0);
    expect(presented.z).toBeGreaterThan(0);
    closeTo(presented.y, marker.y);
  });
});
