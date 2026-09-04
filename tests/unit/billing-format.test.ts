import {
  formatCount,
  formatDate,
  formatMoney,
  formatShortDate,
} from '@/app/(workspace)/billing/components/billingFormat';

describe('billingFormat', () => {
  describe('formatMoney', () => {
    it('renders BRL without the locale space so it matches the pricing copy', () => {
      expect(formatMoney(2990, 'brl', 'pt')).toBe('R$29,90');
      expect(formatMoney(4990, 'BRL', 'pt')).toBe('R$49,90');
    });

    it('renders USD for the English locale', () => {
      expect(formatMoney(4990, 'usd', 'en')).toBe('$49.90');
    });

    it('accepts the currency code in any case', () => {
      expect(formatMoney(100, 'BrL', 'pt')).toBe('R$1,00');
    });
  });

  describe('formatDate', () => {
    it('renders a long date in Portuguese', () => {
      expect(formatDate('2026-09-12T00:00:00.000Z', 'pt')).toBe('12 de setembro de 2026');
    });

    it('renders a long date in English', () => {
      expect(formatDate('2026-09-12T00:00:00.000Z', 'en')).toBe('September 12, 2026');
    });
  });

  describe('formatShortDate', () => {
    it('renders a numeric date', () => {
      expect(formatShortDate('2026-08-12T00:00:00.000Z', 'pt')).toBe('12/08/2026');
      expect(formatShortDate('2026-08-12T00:00:00.000Z', 'en')).toBe('08/12/2026');
    });
  });

  describe('formatCount', () => {
    it('groups thousands per locale', () => {
      expect(formatCount(1140, 'pt')).toBe('1.140');
      expect(formatCount(1140, 'en')).toBe('1,140');
    });
  });
});
