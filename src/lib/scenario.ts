import type { ScenarioLevel, SpaceWeatherSnapshot } from "@/src/domain/space-weather";

export type VisualState = { intensity: number; particleSpeed: number; particleCount: number; auroraScale: number; compression: number };

const scenarios: Record<ScenarioLevel, VisualState> = {
  quiet: { intensity: 0.18, particleSpeed: 0.34, particleCount: 380, auroraScale: 0.9, compression: 1 },
  elevated: { intensity: 0.42, particleSpeed: 0.58, particleCount: 620, auroraScale: 1.06, compression: 0.92 },
  strong: { intensity: 0.72, particleSpeed: 0.92, particleCount: 920, auroraScale: 1.25, compression: 0.8 },
  extreme: { intensity: 1, particleSpeed: 1.25, particleCount: 1300, auroraScale: 1.48, compression: 0.68 },
};

export function deriveLiveVisualState(snapshot: SpaceWeatherSnapshot): VisualState {
  const kp = snapshot.kpObserved ?? 0;
  const speed = snapshot.solarWindSpeedKms ?? 350;
  const southwardBz = Math.max(-(snapshot.imfBzNt ?? 0), 0);
  const intensity = Math.min(kp / 9, 1) * 0.55 + Math.min(Math.max(speed - 350, 0) / 650, 1) * 0.25 + Math.min(southwardBz / 25, 1) * 0.2;
  return { intensity, particleSpeed: 0.32 + intensity * 0.8, particleCount: Math.round(360 + intensity * 720), auroraScale: 0.88 + intensity * 0.48, compression: 1 - intensity * 0.27 };
}

export function deriveScenario(level: ScenarioLevel): VisualState { return scenarios[level]; }
