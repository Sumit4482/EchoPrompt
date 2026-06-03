import type { PromptData } from "@/services/api";

const LABELED_FIELDS: { key: keyof PromptData; label: string }[] = [
  { key: "context", label: "Context" },
  { key: "tone", label: "Tone" },
  { key: "outputFormat", label: "Output Format" },
  { key: "constraints", label: "Constraints" },
  { key: "responseLength", label: "Response Length" },
  { key: "audience", label: "Target Audience" },
  { key: "industry", label: "Industry Context" },
  { key: "mood", label: "Mood/Emotion" },
  { key: "language", label: "Language" },
  { key: "complexity", label: "Complexity Level" },
  { key: "customVariables", label: "Custom Variables" },
];

/** Structured prompt for ChatGPT / Claude — no AI required. */
export function buildPromptText(data: PromptData): string {
  const task = data.task?.trim() ?? "";
  const role = data.role?.trim() ?? "";

  let text = "";
  if (role && task) {
    text = `You are a ${role}. ${task}`;
  } else if (task) {
    text = task;
  } else if (role) {
    text = `You are a ${role}.`;
  }

  for (const { key, label } of LABELED_FIELDS) {
    const value = (data[key] as string | undefined)?.trim();
    if (value) text += `\n\n${label}: ${value}`;
  }

  return text;
}

export function hasPreviewablePrompt(data: PromptData): boolean {
  if (data.task?.trim()) return true;
  return LABELED_FIELDS.some(({ key }) => (data[key] as string | undefined)?.trim());
}
