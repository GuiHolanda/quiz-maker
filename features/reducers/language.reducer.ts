export type Language = 'en' | 'pt';

export interface LanguageState {
  readonly language: Language;
  readonly messages: Record<string, string>;
}

export type LanguageAction =
  | { type: 'setLanguage'; payload: { language: Language } }
  | { type: 'setMessages'; payload: { messages: Record<string, string> } };

export function languageReducer(state: LanguageState, action: LanguageAction): LanguageState {
  switch (action.type) {
    case 'setLanguage':
      return { ...state, language: action.payload.language };
    case 'setMessages':
      return { ...state, messages: action.payload.messages };
    default:
      return state;
  }
}
