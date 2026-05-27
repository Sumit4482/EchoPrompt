import { useEffect, useMemo, useState } from 'react';
import {
  STATIC_FIELD_SUGGESTIONS,
  BuilderFieldSuggestions,
  BuilderSuggestionField,
} from '@/constants/builderSuggestions';
import { mergeSuggestions } from '@/lib/mergeSuggestions';
import { FIELD_SUGGESTIONS_CACHE_KEY } from '@/lib/suggestionFeedback';
import { apiService } from '@/services/api';

const CACHE_KEY = FIELD_SUGGESTIONS_CACHE_KEY;
const SUGGESTION_LIMIT = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;

type PartialSuggestions = Partial<BuilderFieldSuggestions>;

function readCache(): PartialSuggestions | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: PartialSuggestions; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: PartialSuggestions) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

export function useFieldSuggestions() {
  const [dynamic, setDynamic] = useState<PartialSuggestions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setDynamic(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    apiService
      .getFieldSuggestions(SUGGESTION_LIMIT)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setDynamic(response.data as PartialSuggestions);
          writeCache(response.data as PartialSuggestions);
        }
      })
      .catch(() => {
        // fall back to static-only lists
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const merged = {} as BuilderFieldSuggestions;

    (Object.keys(STATIC_FIELD_SUGGESTIONS) as BuilderSuggestionField[]).forEach((field) => {
      merged[field] = mergeSuggestions(
        STATIC_FIELD_SUGGESTIONS[field],
        dynamic[field] ?? []
      );
    });

    return merged;
  }, [dynamic]);

  return { suggestions, isLoading };
}
