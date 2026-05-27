export interface PromptDefaults {
  defaultTone: string;
  defaultOutputFormat: string;
}

export const DEFAULT_PROMPT_DEFAULTS: PromptDefaults = {
  defaultTone: "Professional",
  defaultOutputFormat: "Markdown",
};

const STORAGE_KEY = "echoPromptSettings";
const DEFAULTS_KEY = "echoPromptDefaults";

function parseStored(raw: string | null): PromptDefaults | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PromptDefaults>;
    if (parsed.defaultTone && parsed.defaultOutputFormat) {
      return {
        defaultTone: parsed.defaultTone,
        defaultOutputFormat: parsed.defaultOutputFormat,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const PROMPT_DEFAULTS_UPDATED = "echoprompt:prompt-defaults-updated";

export function applyPromptDefaults(settings: PromptDefaults): void {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent<PromptDefaults>(PROMPT_DEFAULTS_UPDATED, { detail: settings }),
  );
}

/** Merge saved defaults into prompt data (only fills empty tone/format). */
export function withPromptDefaults<T extends { tone?: string; outputFormat?: string }>(
  data: T,
  defaults: PromptDefaults = readPromptDefaults(),
): T {
  return {
    ...data,
    tone: data.tone || defaults.defaultTone,
    outputFormat: data.outputFormat || defaults.defaultOutputFormat,
  };
}

export function readPromptDefaults(): PromptDefaults {
  return (
    parseStored(localStorage.getItem(STORAGE_KEY))
    ?? parseStored(localStorage.getItem(DEFAULTS_KEY))
    ?? DEFAULT_PROMPT_DEFAULTS
  );
}
