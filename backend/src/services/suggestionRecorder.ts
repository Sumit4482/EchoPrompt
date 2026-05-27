import { FieldSuggestion } from '../models/FieldSuggestion';
import { SUGGESTION_FIELDS, SuggestionField } from '../constants/suggestionFields';

const MIN_VALUE_LENGTH = 2;

const MAX_VALUE_LENGTH: Partial<Record<SuggestionField, number>> = {
  task: 120,
  context: 120,
  constraints: 120,
};

export function normalizeSuggestionValue(
  field: SuggestionField,
  raw: string
): string | null {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length < MIN_VALUE_LENGTH) return null;

  const maxLen = MAX_VALUE_LENGTH[field];
  if (maxLen && value.length > maxLen) return null;

  return value;
}

export function isSuggestionField(field: string): field is SuggestionField {
  return (SUGGESTION_FIELDS as readonly string[]).includes(field);
}

/** Upsert + increment weight; promotes row to source=usage */
export async function recordSuggestion(
  field: SuggestionField,
  raw: string,
  weightDelta = 1
): Promise<boolean> {
  const value = normalizeSuggestionValue(field, raw);
  if (!value) return false;

  await FieldSuggestion.findOneAndUpdate(
    { field, value },
    {
      $inc: { weight: weightDelta },
      $set: { source: 'usage' },
      $setOnInsert: { field, value },
    },
    { upsert: true }
  );

  return true;
}

export async function recordSuggestions(
  entries: Array<{ field: SuggestionField; value: string }>,
  weightDelta = 1
): Promise<number> {
  let recorded = 0;

  await Promise.all(
    entries.map(async ({ field, value }) => {
      const ok = await recordSuggestion(field, value, weightDelta);
      if (ok) recorded += 1;
    })
  );

  return recorded;
}

export async function recordFromPromptData(
  promptData: Record<string, string | undefined>,
  weightDelta = 2
): Promise<number> {
  const entries: Array<{ field: SuggestionField; value: string }> = [];

  for (const field of SUGGESTION_FIELDS) {
    const raw = promptData[field];
    if (raw?.trim()) {
      entries.push({ field, value: raw });
    }
  }

  return recordSuggestions(entries, weightDelta);
}
