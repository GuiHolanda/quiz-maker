'use client';

import type { LanguageStoreApi, Language } from '@/shared/types';

import React, { useReducer, useEffect, useCallback, useMemo } from 'react';

import { LANGUAGE_LOCAL_STORAGE_KEY } from '@/config/constants';
import { languageReducer } from '@/features/reducers/language.reducer';
import { parseProperties } from '@/lib/properties-parser';

export const LanguageContext = React.createContext<LanguageStoreApi | null>(null);

async function loadMessages(language: Language): Promise<Record<string, string>> {
  const res = await fetch(`/messages/${language}.properties`);
  const raw = await res.text();

  return parseProperties(raw);
}

export function LanguageProvider({
  children,
  initialMessages,
}: Readonly<{ children: React.ReactNode; initialMessages?: Record<string, string> }>) {
  const [state, dispatch] = useReducer(languageReducer, {
    language: 'pt',
    messages: initialMessages ?? {},
  });

  useEffect(() => {
    let lang: Language = 'pt';

    try {
      const stored = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);

      if (stored === 'en' || stored === 'pt') lang = stored;
    } catch {}

    // Se o idioma armazenado difere do SSR (pt), recarrega as mensagens no cliente.
    // Caso contrário, mantém as mensagens vindas do servidor (sem refetch, sem flash).
    if (lang !== 'pt' || !initialMessages) {
      dispatch({ type: 'setLanguage', payload: { language: lang } });
      loadMessages(lang).then((messages) => dispatch({ type: 'setMessages', payload: { messages } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      return;
    }
    try {
      localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, state.language);
    } catch {}
    document.documentElement.lang = state.language;
  }, [state.language]);

  const setLanguage = useCallback((lang: Language) => {
    dispatch({ type: 'setLanguage', payload: { language: lang } });
    loadMessages(lang).then((messages) => dispatch({ type: 'setMessages', payload: { messages } }));
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
