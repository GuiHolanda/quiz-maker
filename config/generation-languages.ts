// Target language for AI question generation. Concursos are hard-coded to Brazilian
// Portuguese in their prompts; certifications vary, so the user picks a language and
// every step of the pipeline is told to hold it. This registry is the single source
// of truth for the option set, the name the prompts inject, and the fallback.
export type GenerationLanguage = 'pt' | 'en';

export const GENERATION_LANGUAGES = ['pt', 'en'] as const;

export const DEFAULT_GENERATION_LANGUAGE: GenerationLanguage = 'pt';

// The name written into the prompts — "Brazilian Portuguese" (not just "Portuguese")
// keeps the model from drifting to the European variant.
const PROMPT_LANGUAGE_NAME: Record<GenerationLanguage, string> = {
  pt: 'Brazilian Portuguese',
  en: 'English',
};

export function isGenerationLanguage(value: unknown): value is GenerationLanguage {
  return value === 'pt' || value === 'en';
}

// Falls back to the default rather than throwing: a job persisted before this field
// existed, or a payload that omits it, must still generate.
export function resolveGenerationLanguage(value: unknown): GenerationLanguage {
  return isGenerationLanguage(value) ? value : DEFAULT_GENERATION_LANGUAGE;
}

export function promptLanguageName(language: GenerationLanguage): string {
  return PROMPT_LANGUAGE_NAME[resolveGenerationLanguage(language)];
}
