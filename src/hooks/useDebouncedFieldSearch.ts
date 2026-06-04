import { useEffect, useState } from 'react';
import { BuilderSuggestionField } from '@/constants/builderSuggestions';
import { apiService } from '@/services/api';

const DEBOUNCE_MS = 200;

export function useDebouncedFieldSearch(
  field: BuilderSuggestionField | undefined,
  query: string,
  enabled: boolean,
) {
  const [hits, setHits] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!enabled || !field || !query.trim()) {
      setHits([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(() => {
      apiService
        .searchFieldSuggestions(field, query.trim(), 30)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setHits(res.data);
          } else {
            setHits([]);
          }
        })
        .catch(() => setHits([]))
        .finally(() => setIsSearching(false));
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      setIsSearching(false);
    };
  }, [field, query, enabled]);

  return { hits, isSearching };
}
