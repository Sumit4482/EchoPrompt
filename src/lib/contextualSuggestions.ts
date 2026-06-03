import type { PromptData } from "@/services/api";
import {
  BuilderFieldSuggestions,
  BuilderSuggestionField,
} from "@/constants/builderSuggestions";
import { TASK_FIELD_BUNDLES } from "@/constants/taskFieldBundles";
import { rankSuggestions } from "@/lib/suggestionRanking";
import { mergeSuggestions } from "@/lib/mergeSuggestions";

const TOPIC_HINTS: { pattern: RegExp; bundleTask: string }[] = [
  { pattern: /\b(social\s*media|instagram|tiktok|linkedin\s*post)\b/i, bundleTask: "Create social media content" },
  { pattern: /\b(blog|article|seo)\b/i, bundleTask: "Write an engaging blog post" },
  { pattern: /\b(email|newsletter|mail\s*campaign)\b/i, bundleTask: "Create email marketing campaign" },
  { pattern: /\b(code\s*review|pull\s*request|pr\s*review)\b/i, bundleTask: "Review the following code for best practices and potential issues" },
  { pattern: /\b(api\s*doc|openapi|endpoint\s*doc)\b/i, bundleTask: "Write comprehensive API documentation" },
  { pattern: /\b(design\s*brief|ux\s*brief|wireframe)\b/i, bundleTask: "Create a comprehensive design brief for a mobile app" },
];

export function findTaskBundleMatch(task: string): Partial<PromptData> | null {
  const trimmed = task.trim();
  if (!trimmed) return null;

  if (TASK_FIELD_BUNDLES[trimmed]) return TASK_FIELD_BUNDLES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, bundle] of Object.entries(TASK_FIELD_BUNDLES)) {
    const k = key.toLowerCase();
    if (lower.includes(k) || k.includes(lower)) return bundle;
  }

  for (const { pattern, bundleTask } of TOPIC_HINTS) {
    if (pattern.test(trimmed)) return TASK_FIELD_BUNDLES[bundleTask] ?? null;
  }

  return null;
}

function builderContextText(promptData: PromptData, excludeField?: BuilderSuggestionField): string {
  const parts: string[] = [];
  if (excludeField !== "task" && promptData.task?.trim()) parts.push(promptData.task);
  if (excludeField !== "role" && promptData.role?.trim()) parts.push(promptData.role);
  if (excludeField !== "context" && promptData.context?.trim()) parts.push(promptData.context);
  if (excludeField !== "industry" && promptData.industry?.trim()) parts.push(promptData.industry);
  return parts.join(" ");
}

function pinnedFromBundle(
  field: BuilderSuggestionField,
  promptData: PromptData,
): string[] {
  const bundle = findTaskBundleMatch(promptData.task || "");
  if (!bundle) return [];
  const value = bundle[field as keyof typeof bundle];
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

export function contextualizeFieldSuggestions(
  field: BuilderSuggestionField,
  promptData: PromptData,
  baseList: string[],
  fieldQuery: string,
  maxItems = 12,
): string[] {
  const pinned = pinnedFromBundle(field, promptData);
  const context = builderContextText(promptData, field);
  const merged = mergeSuggestions(pinned, baseList, 250);
  const ranked = rankSuggestions(merged, fieldQuery, { context, minScore: fieldQuery.trim().length >= 2 ? 55 : 0 });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...pinned, ...ranked]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function buildContextualSuggestions(
  promptData: PromptData,
  base: BuilderFieldSuggestions,
  fieldQueries: Partial<Record<BuilderSuggestionField, string>> = {},
): BuilderFieldSuggestions {
  const fields = Object.keys(base) as BuilderSuggestionField[];
  const result = {} as BuilderFieldSuggestions;

  for (const field of fields) {
    const query = fieldQueries[field] ?? (promptData[field] as string | undefined) ?? "";
    result[field] = contextualizeFieldSuggestions(
      field,
      promptData,
      base[field],
      query,
      field === "task" ? 14 : 10,
    );
  }

  return result;
}
