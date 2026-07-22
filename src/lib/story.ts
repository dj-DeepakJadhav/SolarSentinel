export const storyActs = [
  { id: "sun", number: "01", label: "The Sun now" },
  { id: "observer", number: "02", label: "The observer" },
  { id: "stream", number: "03", label: "The stream" },
  { id: "earth", number: "04", label: "Earth now" },
  { id: "scenario", number: "05", label: "What if?" },
  { id: "replay", number: "06", label: "A real event" },
] as const;

export type StoryAct = (typeof storyActs)[number]["id"];

export function getStoryAct(id: StoryAct) {
  return storyActs.find((act) => act.id === id) ?? storyActs[0];
}
