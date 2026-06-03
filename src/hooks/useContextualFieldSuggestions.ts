import { useMemo } from "react";
import type { PromptData } from "@/services/api";
import { useFieldSuggestions } from "@/hooks/useFieldSuggestions";
import { buildContextualSuggestions } from "@/lib/contextualSuggestions";

/** Field suggestions ranked using task/role context from the current builder state. */
export function useContextualFieldSuggestions(promptData: PromptData) {
  const { suggestions: base, isLoading } = useFieldSuggestions();

  const suggestions = useMemo(
    () => buildContextualSuggestions(promptData, base),
    [promptData, base],
  );

  return { suggestions, isLoading };
}
