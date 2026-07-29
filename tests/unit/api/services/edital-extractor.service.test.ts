import { describe, it, expect, vi } from 'vitest';

vi.mock('openai', () => ({
  default: class MockOpenAI {},
}));

import { EditalExtractorService } from '@/features/services/edital-extractor.service';

// We test normalizeCase indirectly through validateExtracted by calling
// the private method via a cast to any.
const service = new EditalExtractorService();
const normalize = (s: string) => (service as any).normalizeCase(s);

describe('EditalExtractorService.normalizeCase', () => {
  it('converts fully-uppercase string to sentence case', () => {
    expect(normalize('LEGISLAÇÃO APLICADA AO SERVIÇO PÚBLICO')).toBe(
      'Legislação aplicada ao serviço público',
    );
  });

  it('converts fully-uppercase string with punctuation to sentence case', () => {
    expect(normalize('ÉTICA E MORAL: DEFINIÇÃO E DISTINÇÃO')).toBe(
      'Ética e moral: definição e distinção',
    );
  });

  it('does not alter mixed-case strings', () => {
    expect(normalize('Direito Constitucional')).toBe('Direito Constitucional');
  });

  it('does not alter already sentence-cased strings', () => {
    expect(normalize('Princípios fundamentais')).toBe('Princípios fundamentais');
  });

  it('normalizes all-caps strings regardless of length — examBoard.name is excluded at the call site in validateExtracted', () => {
    // The function normalizes any all-uppercase string to sentence case — including
    // short acronyms like CESPE. Acronyms in examBoard.name are protected in production
    // by not calling normalizeCase on that field at all (only name, role, and subjects/topics
    // go through normalizeCase). So CESPE → Cespe here, but it never reaches this path.
    expect(normalize('CESPE')).toBe('Cespe');
  });
});
