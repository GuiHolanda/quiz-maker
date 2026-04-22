// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting border: white/14 (soft white on dark surfaces). Focus border: solid primary (Indigo).

export const borderedInputClassNames = {
  inputWrapper: [
    'border-white/[0.14]',
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
  ].join(' '),
};

export const borderedSelectClassNames = {
  trigger: [
    'border-white/[0.14]',
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
  ].join(' '),
};
