// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting: white/14 · Focus: white/70

export const borderedInputClassNames = {
  inputWrapper: [
    'border-white/[0.14]',
    'group-data-[focus=true]:border-white/70',
    'group-data-[focus=true]:data-[hover=true]:border-white/70',
  ].join(' '),
};

export const borderedSelectClassNames = {
  trigger: [
    'border-white/[0.14]',
    'data-[focus=true]:border-white/70',
    'data-[open=true]:border-white/70',
  ].join(' '),
};
