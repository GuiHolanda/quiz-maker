'use client';

import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { inputProperties } from '@/config/constants/inputStyles';

interface SearchInputProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly placeholder: string;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly testId?: string;
}

export function SearchInput({ value, onValueChange, placeholder, ariaLabel, className, testId }: SearchInputProps) {
  return (
    <Input
      {...inputProperties.input}
      aria-label={ariaLabel ?? placeholder}
      className={className}
      data-testid={testId}
      placeholder={placeholder}
      startContent={
        <FontAwesomeIcon aria-hidden="true" className="h-3.5 w-3.5 text-default-400" icon={faMagnifyingGlass} />
      }
      value={value}
      onValueChange={onValueChange}
    />
  );
}
