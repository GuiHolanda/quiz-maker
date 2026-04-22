// Shared classNames for HeroUI input-like components using variant="bordered".
// Overrides only the focus border to use the primary (Indigo) accent color.

export const borderedInputClassNames = {
  inputWrapper: [
    'group-data-[focus=true]:border-primary',
    'group-data-[focus=true]:data-[hover=true]:border-primary',
  ].join(' '),
};

export const borderedSelectClassNames = {
  trigger: [
    'data-[focus=true]:border-primary',
    'data-[open=true]:border-primary',
  ].join(' '),
};
