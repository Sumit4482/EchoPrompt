const STORAGE_KEY = 'gemini_api_key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY)?.trim() || null;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}
