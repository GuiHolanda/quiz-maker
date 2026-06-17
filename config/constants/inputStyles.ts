// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting: border-default-300 · Focus: border-primary · Label: xs, normal weight, muted
// Height: md size = h-10 (40px) · Radius: rounded-lg (8px) · Transition: colors 200ms

import { InputLabelPlacement, InputVariant } from '@/shared/types';

export const inputLabelClass = 'text-xs font-normal text-default-400';

const borderedInputClassNames = {
  label: inputLabelClass,
  input: 'placeholder:text-xs text-foreground',
  inputWrapper: [
    'rounded-sm',
    'border-default-300',
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
    'transition-colors duration-200',
  ].join(' '),
};

const borderedSelectClassNames = {
  label: inputLabelClass,
  value: 'placeholder:text-lg',
  trigger: [
    'rounded-sm',
    'border-default-300',
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
    'transition-colors duration-200',
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
