/** Popular (dynamic) first, then static — deduped case-insensitively */
export function mergeSuggestions(
  staticList: string[],
  dynamicList: string[] = [],
  maxItems = 200
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  const add = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  };

  for (const item of dynamicList) add(item);
  for (const item of staticList) add(item);

  return merged.slice(0, maxItems);
}
