/** Max stored prompt body length (MongoDB schema + save clamp). */
export const PROMPT_CONTENT_MAX_LENGTH = 50_000;

/** Cap for AI generate responses (safety net; schema allows 50k). */
export const AI_GENERATED_CONTENT_MAX = 16_000;

export function clampPromptContent(
  content: string,
  maxLength: number = PROMPT_CONTENT_MAX_LENGTH,
): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trimEnd();
}
