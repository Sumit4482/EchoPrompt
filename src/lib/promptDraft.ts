import { PromptData } from '@/services/api';

const DRAFT_KEY = 'echoprompt_builder_draft';
const EDITING_ID_KEY = 'editingPromptId';

export interface PromptDraft {
  promptData: PromptData;
  content: string;
  lastAiEnhanced: boolean;
  savedAt: string;
}

export function savePromptDraft(draft: PromptDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadPromptDraft(): PromptDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PromptDraft;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function clearPromptDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function getEditingPromptId(): string | null {
  return localStorage.getItem(EDITING_ID_KEY);
}

export function setEditingPromptId(id: string): void {
  localStorage.setItem(EDITING_ID_KEY, id);
}

export function clearEditingPromptId(): void {
  localStorage.removeItem(EDITING_ID_KEY);
}
