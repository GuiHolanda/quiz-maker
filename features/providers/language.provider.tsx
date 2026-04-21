'use client';

import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { LanguageStoreApi, Language } from '@/types';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@/config/constants';
import { languageReducer, LanguageState } from '@/features/reducers/language.reducer';
import { parseProperties } from '@/lib/properties-parser';

export const LanguageContext = React.createContext<LanguageStoreApi | null>(null);

const INITIAL_STATE: LanguageState = {
  language: 'pt',
  messages: {},
};

async function loadMessages(language: Language): Promise<Record<string, string>> {
  const res = await fetch(`/messages/${language}.properties`);
  const raw = await res.text();
  return parseProperties(raw);
}

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(languageReducer, INITIAL_STATE);

  useEffect(() => {
    let lang: Language = 'pt';
    try {
      const stored = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
      if (stored === 'en' || stored === 'pt') lang = stored;
    } catch {}

    dispatch({ type: 'setLanguage', payload: { language: lang } });
    loadMessages(lang).then((messages) =>
      dispatch({ type: 'setMessages', payload: { messages } })
    );
  }, []);

  useEffect(() => {
    if (!state.language) return;
    try {
      localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, state.language);
    } catch {}
    document.documentElement.lang = state.language;
  }, [state.language]);

  const setLanguage = useCallback((lang: Language) => {
    dispatch({ type: 'setLanguage', payload: { language: lang } });
    loadMessages(lang).then((messages) =>
      dispatch({ type: 'setMessages', payload: { messages } })
    );
  }, []);

  const api = useMemo<LanguageStoreApi>(
    () => ({
      language: state.language,
      messages: state.messages,
      setLanguage,
    }),
    [state.language, state.messages, setLanguage]
  );

  return <LanguageContext.Provider value={api}>{children}</LanguageContext.Provider>;
}
