'use client';

import { Button } from '@heroui/button';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function LanguageSwitch() {
  const { language, setLanguage } = useTranslation();

  const toggle = () => setLanguage(language === 'pt' ? 'en' : 'pt');

  return (
    <Button
      variant="light"
      size="sm"
      onPress={toggle}
      aria-label={`Switch language to ${language === 'pt' ? 'English' : 'Português'}`}
      className="min-w-0 px-2 text-white/50 hover:text-white/80 transition-colors"
    >
      {language === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
    </Button>
  );
}
