import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type GenerationConfig,
} from '@google/generative-ai';

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const genAI = DEFAULT_API_KEY ? new GoogleGenerativeAI(DEFAULT_API_KEY) : null;

const GENERATION_CONFIG = {
  standard: { maxOutputTokens: 800, temperature: 0.45 },
  optimized: { maxOutputTokens: 1800, temperature: 0.45 },
} as const;

const END_MARKER = 'End of prompt.';

type LengthProfile = { wordMin: number; wordMax: number; label: string };

function resolveLengthProfile(promptData: Record<string, string | undefined>): LengthProfile {
  const hint = `${promptData.responseLength || ''} ${promptData.complexity || ''}`.toLowerCase();

  if (hint.includes('short') || hint.includes('brief') || hint.includes('concise')) {
    return { wordMin: 180, wordMax: 320, label: 'short' };
  }
  if (hint.includes('long') || hint.includes('detailed')) {
    return { wordMin: 650, wordMax: 900, label: 'long' };
  }
  // Default: quality-focused moderate (not "comprehensive" length)
  return { wordMin: 320, wordMax: 550, label: 'moderate' };
}

function getFinishReason(response: { candidates?: { finishReason?: string }[] }): string | undefined {
  return response.candidates?.[0]?.finishReason;
}

function isLikelyTruncated(text: string, finishReason?: string): boolean {
  if (finishReason === 'MAX_TOKENS') return true;
  const trimmed = text.trim();
  if (!trimmed || trimmed.endsWith(END_MARKER)) return false;
  return /\w+$/.test(trimmed) && !/[.!?:]\s*$/.test(trimmed) && trimmed.length > 300;
}

function stripEndMarker(text: string): string {
  return text.replace(/\n*End of prompt\.?\s*$/i, '').trim();
}

function buildSpecificationsBlock(promptData: Record<string, string | undefined>): string {
  const lines: string[] = [];
  const add = (label: string, value?: string) => {
    if (value?.trim()) lines.push(`${label}: ${value.trim()}`);
  };

  add('Role', promptData.role);
  add('Task', promptData.task);
  add('Context', promptData.context);
  add('Tone', promptData.tone);
  add('Output format', promptData.outputFormat);
  add('Constraints', promptData.constraints);
  add('Response length', promptData.responseLength);
  add('Audience', promptData.audience);
  add('Industry', promptData.industry);
  add('Mood', promptData.mood);
  add('Language', promptData.language);
  add('Complexity', promptData.complexity);
  add('Custom variables', promptData.customVariables);

  return lines.length ? lines.join('\n') : '(minimal input — infer carefully from task only)';
}

export class GeminiService {
  async generatePrompt(promptData: any, optimize: boolean = false, customApiKey?: string): Promise<string> {
    try {
      const apiKey = customApiKey || DEFAULT_API_KEY;
      if (!apiKey) {
        throw new Error('No Gemini API key configured. Set GEMINI_API_KEY in environment or provide a key in settings.');
      }

      const genAIInstance = customApiKey ? new GoogleGenerativeAI(apiKey) : genAI!;
      const generationConfig: GenerationConfig = optimize
        ? GENERATION_CONFIG.optimized
        : GENERATION_CONFIG.standard;

      const model = genAIInstance.getGenerativeModel({ model: GEMINI_MODEL, generationConfig });
      const userPrompt = this.buildSystemPrompt(promptData, optimize);

      let text = '';
      let finishReason: string | undefined;

      const first = await model.generateContent(userPrompt);
      const firstResponse = await first.response;
      text = firstResponse.text().trim();
      finishReason = getFinishReason(firstResponse as { candidates?: { finishReason?: string }[] });

      let continuations = 0;
      while (isLikelyTruncated(text, finishReason) && continuations < 1) {
        continuations += 1;
        console.log('🔄 Gemini output incomplete — continuing once');
        const continued = await this.continueGeneration(model, userPrompt, text);
        text = `${text}\n${continued.text}`.trim();
        finishReason = continued.finishReason;
      }

      if (!text.endsWith(END_MARKER)) {
        text = `${text}\n\n${END_MARKER}`;
      }

      return stripEndMarker(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate prompt with AI');
    }
  }

  private async continueGeneration(
    model: GenerativeModel,
    originalRequest: string,
    partialOutput: string,
  ): Promise<{ text: string; finishReason?: string }> {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: originalRequest }] },
        { role: 'model', parts: [{ text: partialOutput }] },
      ],
    });

    const result = await chat.sendMessage(
      `Continue where you stopped. Stay specific to the user's task — no generic filler. ` +
        `Finish remaining content only, keep it short, then "${END_MARKER}".`,
    );
    const response = await result.response;
    return {
      text: response.text().trim(),
      finishReason: getFinishReason(response as { candidates?: { finishReason?: string }[] }),
    };
  }

  private buildSystemPrompt(promptData: any, optimize: boolean): string {
    const { wordMin, wordMax } = resolveLengthProfile(promptData);
    const specs = buildSpecificationsBlock(promptData);

    return `You are an expert prompt engineer. Write ONE high-quality prompt another AI will execute.

GOAL: Quality over length. Specific over generic. Every line must earn its place.

USER INPUT (use these details explicitly — do not ignore or replace with boilerplate):
${specs}

QUALITY RULES (required):
1. Ground the prompt in the user's task, audience, industry, and constraints above — cite concrete details, not vague placeholders
2. ${wordMin}–${wordMax} words total — shorter is fine if complete and sharp
3. Structure: 4–6 sections max with clear headings; 2–4 tight bullets OR 2–3 sentences per section
4. Include: clear role, primary objective, success criteria (measurable when possible), output format, must-have constraints
5. Ban generic filler: no "highly experienced", "comprehensive", "seamless experience", "key stakeholders", "in today's world", or instructions like "Begin by establishing…"
6. Do NOT output a template telling someone how to write a document — output the actual prompt they should run
7. No duplicate sections, no encyclopedic feature lists — only features implied by the task
8. End with the line: ${END_MARKER}

${optimize ? 'Apply strong prompt-engineering (clear role, scope boundaries, evaluation criteria) but stay within the word limit.' : 'Keep it direct and production-ready.'}

Write the final prompt now:`;
  }
}

export const geminiService = new GeminiService();
