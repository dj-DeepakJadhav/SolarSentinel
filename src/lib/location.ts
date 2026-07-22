import type { Location } from "@/src/domain/space-weather";

export type SkyContext = { phase: "daylight" | "civil_twilight" | "night"; label: string; detail: string; solarElevationDegrees: number };

// NOAA-style solar-position approximation for presentation context only. It is
// deliberately not used for any aurora-visibility or operational conclusion.
export function getDayNightContext(location: Location, now: Date): SkyContext {
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = (now.getTime() - startOfYear) / 86_400_000;
  const gamma = (2 * Math.PI / 365) * (day - 1 + (now.getUTCHours() - 12) / 24);
  const declination = .006918 - .399912 * Math.cos(gamma) + .070257 * Math.sin(gamma) - .006758 * Math.cos(2 * gamma) + .000907 * Math.sin(2 * gamma) - .002697 * Math.cos(3 * gamma) + .00148 * Math.sin(3 * gamma);
  const equationOfTime = 229.18 * (.000075 + .001868 * Math.cos(gamma) - .032077 * Math.sin(gamma) - .014615 * Math.cos(2 * gamma) - .040849 * Math.sin(2 * gamma));
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const trueSolarTime = (minutes + equationOfTime + 4 * location.longitude + 1440) % 1440;
  const hourAngle = (trueSolarTime / 4 - 180) * Math.PI / 180;
  const latitude = location.latitude * Math.PI / 180;
  const elevation = Math.asin(Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)) * 180 / Math.PI;
  if (elevation > 0) return { phase: "daylight", label: "DAYLIGHT NOW", detail: "Space weather is global; a dark sky is required before visual aurora observation is even possible.", solarElevationDegrees: elevation };
  if (elevation > -6) return { phase: "civil_twilight", label: "CIVIL TWILIGHT", detail: "The Sun is just below the horizon. This is sky context, not an aurora prediction.", solarElevationDegrees: elevation };
  return { phase: "night", label: "NIGHT SKY", detail: "It is dark at this location. Cloud cover and official aurora context still matter.", solarElevationDegrees: elevation };
}
