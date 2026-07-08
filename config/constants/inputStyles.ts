// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting: border-default-200 · Focus: border-primary + ring glow
// Label: xs, medium weight, default-500 · Height: md (40px) · Radius: rounded-lg · Transition: 200ms

import { InputLabelPlacement, InputVariant } from '@/shared/types';

export const inputLabelClass = 'text-xs font-medium text-default-500';

const borderedInputClassNames = {
  label: inputLabelClass,
  input: 'placeholder:text-sm placeholder:text-default-300 text-sm text-foreground',
  inputWrapper: [
    'rounded-lg',
    'border-default-200',
    'bg-background',
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
    'group-data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.1)]',
    'transition-all duration-200',
    'h-11',
  ].join(' '),
};

const borderedSelectClassNames = {
  label: inputLabelClass,
  value: 'text-sm',
  trigger: [
    'rounded-lg',
    'border-default-200',
    'bg-background',
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
    'data-[focus=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.1)]',
    'data-[open=true]:shadow-[0_0_0_3px_rgb(79_70_229_/_0.1)]',
    'transition-all duration-200',
    'h-11',
  ].join(' '),
};

export const inputProperties = {
  input: {
    labelPlacement: 'outside' as InputLabelPlacement,
    variant: 'bordered' as InputVariant,
    classNames: borderedInputClassNames,
  },
  select: {
    labelPlacement: 'outside' as InputLabelPlacement,
    variant: 'bordered' as InputVariant,
    classNames: borderedSelectClassNames,
  },
  autocomplete: {
    labelPlacement: 'outside' as InputLabelPlacement,
    variant: 'bordered' as InputVariant,
    inputProps: { classNames: borderedInputClassNames },
  },
};
