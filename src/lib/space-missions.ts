import type { LearningMode } from "@/src/domain/space-weather";

export type SpaceMission = {
  id: string;
  title: string;
  status: "live" | "planned";
  subject: string;
  sourceLabel: string;
  prompts: Record<LearningMode, readonly string[]>;
};

// This small content contract is the reusable product pattern. The hackathon
// ships only the live Solar Weather mission; later space topics can use the
// same source-first, teacher/student experience without becoming fake features.
export const solarWeatherMission: SpaceMission = {
  id: "solar-weather",
  title: "Solar Weather",
  status: "live",
  subject: "Sun–Earth connection",
  sourceLabel: "NASA SDO · NOAA SWPC · NASA DONKI",
  prompts: {
    student: [
      "Guide me through what I am seeing",
      "Why does Earth have an aurora?",
      "What is observed and what is forecast?",
      "How certain is this?",
    ],
    teacher: [
      "Prepare a five-minute classroom discussion",
      "Give me an observation question for this scene",
      "Explain observed versus forecast for students",
      "What uncertainty should the class notice?",
    ],
  },
};
