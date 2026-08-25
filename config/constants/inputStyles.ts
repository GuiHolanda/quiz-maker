// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting: border-default-200 · Focus: border-primary + amber ring glow
// Label: xs, medium weight, default-500 · Height: md (40px) · Radius: rounded-lg · Transition: 200ms

import { InputLabelPlacement, InputVariant } from '@/shared/types';

export const inputLabelClass = 'text-xs font-medium text-default-500';

const borderedInputClassNames = {
  label: inputLabelClass,
  input: 'placeholder:text-sm placeholder:text-default-300 text-sm text-foreground',
  inputWrapper: [
    'rounded-lg',
    'border-content1',
    'bg-content2',
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
    'group-data-[focus=true]:shadow-[0_0_0_3px_rgb(224_120_32_/_0.12)]',
    'transition-all duration-200',
    'h-11',
  ].join(' '),
};

const borderedSelectClassNames = {
  label: inputLabelClass,
  value: 'text-sm',
  trigger: [
    'rounded-lg',
    'border-content1',
    'bg-content2',
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
    'data-[focus=true]:shadow-[0_0_0_3px_rgb(224_120_32_/_0.12)]',
    'data-[open=true]:shadow-[0_0_0_3px_rgb(224_120_32_/_0.12)]',
    'transition-all duration-200',
    'h-11',
  ].join(' '),
};

export const inputProperties = {
  input: {
    labelPlacement: 'outside' as InputLabelPlacement,
    classNames: borderedInputClassNames,
  },
  numberInput: {
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

// `placeholder:` overrides keep an empty field lighter — `font-semibold` alone would apply to it too.
export const compactInputClassNames = {
  inputWrapper: 'h-8 bg-content1 rounded-lg border-content1',
  input: 'text-xs font-semibold placeholder:font-normal placeholder:text-default-300',
};

export const compactSelectClassNames = {
  label: inputLabelClass,
  trigger: 'h-8 bg-background rounded-lg',
  value: 'text-xs font-semibold',
};

export const tableClassNames = {
  wrapper: 'bg-background shadow-none rounded-xl border border-default-200 p-0',
  th: 'bg-content1 text-default-400 font-mono text-[11px] uppercase tracking-widest border-b border-default-200 first:rounded-tl-xl last:rounded-tr-xl',
  td: 'text-sm text-foreground border-b border-default-100 group-data-[last=true]:border-0 py-3',
  tr: 'group hover:bg-content1 transition-colors duration-150',
};
