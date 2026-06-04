function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

function queryWords(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Google-style: each typed word must match the start of a later word in the suggestion. */
function googleWordMatchScore(suggestion: string, query: string): number {
  const qWords = queryWords(query);
  if (!qWords.length) return 0;

  const lower = suggestion.toLowerCase();
  const sWords = lower.split(/\s+/);
  let wordIndex = 0;

  for (const qw of qWords) {
    let matched = false;
    while (wordIndex < sWords.length) {
      const sw = sWords[wordIndex];
      if (sw.startsWith(qw) || (qw.length >= 2 && sw.includes(qw))) {
        matched = true;
        wordIndex += 1;
        break;
      }
      wordIndex += 1;
    }
    if (!matched) return 0;
  }

  let score = 300 + qWords.length * 120;
  if (lower.startsWith(query.toLowerCase().trim())) score += 250;
  return score;
}

/** Gray suffix shown inside the input (prefix autocomplete). */
export function getInlineCompletion(
  value: string,
  suggestion: string | undefined,
): string | null {
  if (!value.trim() || !suggestion) return null;
  const v = value.toLowerCase();
  const s = suggestion.toLowerCase();
  if (!s.startsWith(v) || suggestion.length <= value.length) return null;
  return suggestion.slice(value.length);
}

/**
 * Rank autocomplete options for the current field query, optionally boosted by
 * task/role context (other builder fields).
 */
export function rankSuggestions(
  suggestions: string[],
  query: string,
  options?: { context?: string; minScore?: number; googleStyle?: boolean },
): string[] {
  const valid = suggestions.filter((s): s is string => Boolean(s && typeof s === "string"));
  const q = query.trim().toLowerCase();
  const qTokens = tokenize(q);
  const ctxTokens = options?.context ? tokenize(options.context) : [];
  const minScore =
    options?.minScore ??
    (options?.googleStyle ? (q.length >= 1 ? 40 : 0) : q.length >= 3 ? 70 : q.length >= 2 ? 50 : 0);

  if (!q && ctxTokens.length === 0) return valid;

  const scored = valid
    .map((suggestion) => {
      const lower = suggestion.toLowerCase();
      let score = options?.googleStyle && q ? googleWordMatchScore(suggestion, query) : 0;

      if (q && score === 0) {
        if (lower === q) score += 1000;
        else if (lower.startsWith(q)) score += 520 + Math.max(0, 80 - lower.length);
        else {
          for (const t of qTokens) {
            if (lower === t) score += 400;
            else if (lower.startsWith(t)) score += 280;
            else if (lower.split(/\s+/).some((w) => w.startsWith(t))) score += 180;
            else if (lower.includes(t)) score += 100 - Math.min(lower.indexOf(t), 40);
          }
          if (qTokens.length > 1) {
            const allTokens = qTokens.every((t) => lower.includes(t));
            if (allTokens) score += 220;
            else score = Math.floor(score * 0.35);
          }
        }
      }

      for (const t of ctxTokens) {
        if (lower.includes(t)) score += 55;
        if (lower.split(/\s+/).some((w) => w.startsWith(t))) score += 35;
      }

      return { suggestion, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (q && minScore > 0) {
    const strict = scored.filter((item) => item.score >= minScore).map((item) => item.suggestion);
    if (strict.length > 0) return strict;
  }

  return scored.map((item) => item.suggestion);
}
