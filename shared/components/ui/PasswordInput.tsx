'use client';

import { forwardRef, useState } from 'react';
import { Input, type InputProps } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

type PasswordInputProps = Omit<InputProps, 'type' | 'endContent'>;

/**
 * Password input with a built-in visibility toggle.
 *
 * Wraps HeroUI <Input> and manages type=password|text internally. Spreads
 * inputProperties.input defaults; consumer props override (same convention as
 * the navbar search pattern in app/CLAUDE.md).
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      {...inputProperties.input}
      {...props}
      endContent={
        <button
          aria-label={visible ? t('aria.hidePassword') : t('aria.showPassword')}
          className="text-default-400 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:text-foreground"
          tabIndex={-1}
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          onMouseDown={(e) => e.preventDefault()}
        >
          <FontAwesomeIcon className="w-3.5 h-3.5" icon={visible ? faEyeSlash : faEye} />
        </button>
      }
      type={visible ? 'text' : 'password'}
    />
  );
});
