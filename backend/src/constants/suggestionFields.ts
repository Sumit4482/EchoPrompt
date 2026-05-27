export const SUGGESTION_FIELDS = [
  'role',
  'task',
  'context',
  'tone',
  'outputFormat',
  'constraints',
  'responseLength',
  'audience',
  'industry',
  'mood',
  'language',
  'complexity',
] as const;

export type SuggestionField = (typeof SUGGESTION_FIELDS)[number];

export type FieldSuggestionsResponse = Record<SuggestionField, string[]>;
