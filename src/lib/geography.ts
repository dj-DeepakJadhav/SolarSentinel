import type { Location } from "@/src/domain/space-weather";

export type CartesianPoint = { x: number; y: number; z: number };

const radians = (degrees: number) => degrees * Math.PI / 180;

/**
 * Places a latitude/longitude on the same equirectangular globe convention as
 * the Earth texture. This is deliberately pure so the visual location contract
 * can be tested independently of WebGL.
 */
export function locationToCartesian(location: Pick<Location, "latitude" | "longitude">, radius: number): CartesianPoint {
  const phi = radians(90 - location.latitude);
  const theta = radians(location.longitude + 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/**
 * Y rotation that presents the selected longitude to the scene camera, which
 * looks at Earth from positive Z. Latitude remains visible as a vertical cue.
 */
export function earthYawForLocation(location: Pick<Location, "latitude" | "longitude">): number {
  const marker = locationToCartesian(location, 1);
  return Math.atan2(-marker.x, marker.z);
}
