import { FieldSuggestion } from '../models/FieldSuggestion';
import { SuggestionField } from '../constants/suggestionFields';
import { isSuggestionField } from '../services/suggestionRecorder';
import { buildSuggestionCatalog } from '../data/fieldSuggestionCatalog';

function scoreMatch(value: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const lower = value.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  if (lower === q) return 1000;
  if (lower.startsWith(q)) return 600;

  let score = 0;
  if (lower.includes(q)) score += 280;

  if (words.length > 0) {
    const allWords = words.every((w) => lower.includes(w));
    if (allWords) score += 220;
    else if (words.length > 1) return 0;
    else if (words[0] && lower.split(/\s+/).some((sw) => sw.startsWith(words[0]))) score += 180;
  }

  return score;
}

function searchInMemoryCatalog(field: SuggestionField, query: string, limit: number): string[] {
  const catalog = buildSuggestionCatalog()[field];
  return catalog
    .map((value) => ({ value, score: scoreMatch(value, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.value);
}

export async function searchFieldSuggestions(
  field: SuggestionField,
  query: string,
  limit = 25,
): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let fromDb: string[] = [];
  try {
    const rows = await FieldSuggestion.find({
      field,
      value: { $regex: escaped, $options: 'i' },
    })
      .sort({ weight: -1 })
      .limit(safeLimit * 2)
      .select('value')
      .lean();
    fromDb = rows.map((r) => r.value);
  } catch {
    fromDb = [];
  }

  const fromCatalog = searchInMemoryCatalog(field, q, safeLimit * 2);

  const seen = new Set<string>();
  const merged: { value: string; score: number }[] = [];

  for (const value of [...fromDb, ...fromCatalog]) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ value, score: scoreMatch(value, q) });
  }

  return merged
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((row) => row.value);
}

export function parseSuggestionSearchQuery(
  field: unknown,
  query: unknown,
  limit: unknown,
): { field: SuggestionField; query: string; limit: number } | null {
  if (!isSuggestionField(field as string)) return null;
  const q = typeof query === 'string' ? query.trim() : '';
  if (!q) return null;
  const lim = typeof limit === 'string' ? parseInt(limit, 10) : 25;
  return {
    field: field as SuggestionField,
    query: q,
    limit: Number.isFinite(lim) ? lim : 25,
  };
}
