function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Rank autocomplete options for the current field query, optionally boosted by
 * task/role context (other builder fields).
 */
export function rankSuggestions(
  suggestions: string[],
  query: string,
  options?: { context?: string; minScore?: number },
): string[] {
  const valid = suggestions.filter((s): s is string => Boolean(s && typeof s === "string"));
  const q = query.trim().toLowerCase();
  const qTokens = tokenize(q);
  const ctxTokens = options?.context ? tokenize(options.context) : [];
  const minScore = options?.minScore ?? (q.length >= 3 ? 70 : q.length >= 2 ? 50 : 0);

  if (!q && ctxTokens.length === 0) return valid;

  const scored = valid
    .map((suggestion) => {
      const lower = suggestion.toLowerCase();
      let score = 0;

      if (q) {
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
