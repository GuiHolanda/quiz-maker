// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting: white/14 · Focus: white/70 · Label: xs, normal weight, muted

import { InputLabelPlacement, InputVariant } from "@/types";

export const inputLabelClass = 'text-xs font-normal text-default-400';

const borderedInputClassNames = {
  base: '!mt-0',
  label: inputLabelClass,
  inputWrapper: [
    'border-white/[0.14]',
    'group-data-[focus=true]:border-white/70',
    'group-data-[focus=true]:data-[hover=true]:border-white/70',
  ].join(' '),
};

const borderedSelectClassNames = {
  base: '!mt-0',
  label: inputLabelClass,
  trigger: [
    'border-white/[0.14]',
    'data-[focus=true]:border-white/70',
    'data-[open=true]:border-white/70',
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
