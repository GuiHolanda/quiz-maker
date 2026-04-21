import { useContext, useCallback } from 'react';
import { LanguageContext } from '@/features/providers/language.provider';
import type { Language } from '@/types';

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let value = ctx.messages[key] ?? key;
      if (vars) {
        for (const [varName, varValue] of Object.entries(vars)) {
          value = value.replace(`{${varName}}`, String(varValue));
        }
      }
      return value;
    },
    [ctx.messages]
  );

  return { t, language: ctx.language, setLanguage: ctx.setLanguage };
}
