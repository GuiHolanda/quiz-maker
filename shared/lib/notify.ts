import { addToast } from '@heroui/toast';

/**
 * Standardized toast helper. The signature `(title, description?)` makes
 * a missing description visible at the call site — single-line "Sucesso"
 * toasts with no detail are an anti-pattern.
 *
 * Both arguments should resolve to translation keys via `t()` — never
 * hardcode user-facing strings here.
 */
export const notify = {
  success: (title: string, description?: string) => addToast({ title, description, color: 'success' }),

  error: (title: string, description?: string) => addToast({ title, description, color: 'danger' }),

  warning: (title: string, description?: string) => addToast({ title, description, color: 'warning' }),

  info: (title: string, description?: string) => addToast({ title, description, color: 'default' }),
};
