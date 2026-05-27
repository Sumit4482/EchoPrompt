import { apiService, PromptData } from '@/services/api';
import { BuilderSuggestionField } from '@/constants/builderSuggestions';

export const FIELD_SUGGESTIONS_CACHE_KEY = 'echoprompt_field_suggestions_v3';

export function invalidateFieldSuggestionsCache(): void {
  try {
    sessionStorage.removeItem(FIELD_SUGGESTIONS_CACHE_KEY);
  } catch {
    // ignore
  }
}

/** Fire-and-forget — never blocks UI */
export function trackSuggestionSelect(field: BuilderSuggestionField, value: string): void {
  apiService
    .recordFieldSuggestion(field, value, 1)
    .then(() => invalidateFieldSuggestionsCache())
    .catch(() => {});
}

export function trackPromptDataSuggestions(promptData: PromptData): void {
  apiService
    .recordFieldSuggestionsFromPromptData(promptData, 2)
    .then(() => invalidateFieldSuggestionsCache())
    .catch(() => {});
}
