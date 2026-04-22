// Shared classNames for HeroUI input-like components using variant="bordered".
// Resting border: primary/40 (subtle indigo tint). Focus border: solid primary (Indigo).

export const borderedInputClassNames = {
  inputWrapper: [
    'border-primary/40',
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
  ].join(' '),
};

export const borderedSelectClassNames = {
  trigger: [
    'border-primary/40',
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
  ].join(' '),
};
