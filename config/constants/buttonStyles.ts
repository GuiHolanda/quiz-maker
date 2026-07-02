// Approved className strings for HeroUI Button components.
// Each constant matches a documented pattern in the style-guide.
// Icon-only buttons always require: isIconOnly + size="sm" + aria-label + variant="light" (neutral/danger) or no variant (primary).

export const buttonStyles = {
  primary:    'bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200',
  primarySm:  'bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 h-8 px-4 transition-opacity duration-200',
  secondary:  'border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200',
  flat:       'bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 rounded-lg transition-colors',
  danger:     'bg-danger text-white font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200',
  dangerFlat: 'bg-danger/10 text-danger border border-danger/20 font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200',

  iconOnly: {
    neutral: 'text-default-400 hover:text-foreground transition-colors duration-200',
    primary: 'bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity duration-200',
    danger:  'text-default-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors duration-200',
  },
} as const;
