'use client';

import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function LanguageSwitch() {
  const { language, setLanguage } = useTranslation();

  const toggle = () => setLanguage(language === 'pt' ? 'en' : 'pt');

  return (
    <Button
      aria-label={`Switch language to ${language === 'pt' ? 'English' : 'Português'}`}
      className="min-w-0 px-2 text-default-500 hover:text-foreground transition-colors"
      size="sm"
      variant="light"
      onPress={toggle}
    >
      {language === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
    </Button>
  );
}
