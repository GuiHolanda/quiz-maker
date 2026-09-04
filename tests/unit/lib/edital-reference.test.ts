import { describe, expect, it } from 'vitest';

import { compactEditalReference, parseEditalReference } from '@/lib/edital-reference';

describe('compactEditalReference', () => {
  it('reduces a long official edital key to the number/year pair used in searches', () => {
    // The real Transpetro key identify returns. Quoting it whole as a search phrase is what
    // sent the locate step to jusbrasil's search page instead of the edital.
    expect(compactEditalReference('EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR-2026.4', 2026)).toBe('04/2026');
  });

  it('keeps an already-compact key intact', () => {
    expect(compactEditalReference('001/2025', 2025)).toBe('001/2025');
  });

  it('drops trailing qualifiers after the number/year pair', () => {
    expect(compactEditalReference('01/2024/NS', 2024)).toBe('01/2024');
  });

  it('reads the number out of a prose key', () => {
    expect(compactEditalReference('Edital de Abertura nº 1 - PSP TERRA/2026', 2026)).toBe('1/2026');
  });

  it('never mistakes the four-digit year for the edital number', () => {
    expect(compactEditalReference('Edital 2026.4', 2026)).toBe('4/2026');
  });

  it('returns the bare number when no year is known', () => {
    expect(compactEditalReference('EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR', null)).toBe('04');
  });

  it('returns null when there is no key or no number to extract', () => {
    expect(compactEditalReference(null, 2026)).toBeNull();
    expect(compactEditalReference('   ', 2026)).toBeNull();
    expect(compactEditalReference('Edital de Abertura', 2026)).toBeNull();
  });
});

describe('parseEditalReference', () => {
  it('parses a "nº N/YYYY" reference into a compact key and the year', () => {
    expect(parseEditalReference('Edital nº 1/2026 · TRT 4ª Região')).toEqual({ editalKey: '1/2026', year: 2026 });
  });

  it('combines a bare "nº N" with a year mentioned elsewhere in the text', () => {
    expect(parseEditalReference('Edital de Abertura nº 33, de 2025')).toEqual({ editalKey: '33/2025', year: 2025 });
  });

  it('reads a bare edital number when no year is present', () => {
    expect(parseEditalReference('edital n 7')).toEqual({ editalKey: '7', year: null });
  });

  it('accepts an already-compact "N/YYYY" string', () => {
    expect(parseEditalReference('1/2026')).toEqual({ editalKey: '1/2026', year: 2026 });
  });

  it('extracts only the year when no edital number is present', () => {
    expect(parseEditalReference('Edital de Abertura 2025')).toEqual({ editalKey: null, year: 2025 });
  });

  it('returns nulls for empty text or text with no number or year', () => {
    expect(parseEditalReference('')).toEqual({ editalKey: null, year: null });
    expect(parseEditalReference('  TRT 4ª Região  ')).toEqual({ editalKey: null, year: null });
  });
});
