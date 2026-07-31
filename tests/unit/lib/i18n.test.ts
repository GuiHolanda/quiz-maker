import { hasMessages } from '@/lib/i18n-utils';
import { parseProperties } from '@/lib/properties-parser';

// ── hasMessages ────────────────────────────────────────────────────────────────
// Regression: Bug 2 — loadDefaultMessages() silently returns {} on Vercel when
// the .properties file is absent from the Lambda bundle. The provider must treat
// an empty object the same as undefined and fall back to a client-side fetch.

describe('hasMessages', () => {
  it('returns false for undefined', () => {
    expect(hasMessages(undefined)).toBe(false);
  });

  it('returns false for empty object — the silent-failure case from Vercel', () => {
    expect(hasMessages({})).toBe(false);
  });

  it('returns true when object has at least one key', () => {
    expect(hasMessages({ 'common.save': 'Salvar' })).toBe(true);
  });

  it('returns true for a realistic messages payload', () => {
    expect(hasMessages({ 'login.emailLabel': 'E-mail', 'login.passwordLabel': 'Senha' })).toBe(true);
  });
});

// ── parseProperties ────────────────────────────────────────────────────────────
// Guards the parser that sits between readFile/fetch and the messages store.

describe('parseProperties', () => {
  it('parses a simple key=value pair', () => {
    expect(parseProperties('common.save=Salvar')).toEqual({ 'common.save': 'Salvar' });
  });

  it('ignores comment lines starting with #', () => {
    const raw = '# this is a comment\ncommon.save=Salvar';
    expect(parseProperties(raw)).toEqual({ 'common.save': 'Salvar' });
  });

  it('ignores blank lines', () => {
    const raw = '\ncommon.save=Salvar\n\ncommon.cancel=Cancelar\n';
    expect(parseProperties(raw)).toEqual({ 'common.save': 'Salvar', 'common.cancel': 'Cancelar' });
  });

  it('decodes unicode escapes', () => {
    // ã = ã, ç = ç, ã = ã, o = o
    const raw = 'common.cancel=Cancel\\u00E1r';
    const result = parseProperties(raw);
    expect(result['common.cancel']).toBe('Cancelár');
  });

  it('returns empty object for empty string — matches silent readFile failure', () => {
    expect(parseProperties('')).toEqual({});
  });

  it('ignores lines without = separator', () => {
    const raw = 'no-equals-here\ncommon.save=Salvar';
    expect(parseProperties(raw)).toEqual({ 'common.save': 'Salvar' });
  });

  it('handles value that contains = (only first = is the separator)', () => {
    const raw = 'common.formula=a=b+c';
    expect(parseProperties(raw)).toEqual({ 'common.formula': 'a=b+c' });
  });

  it('strips surrounding single quotes from value', () => {
    const raw = "common.save='Salvar'";
    expect(parseProperties(raw)).toEqual({ 'common.save': 'Salvar' });
  });

  it('strips surrounding double quotes from value', () => {
    const raw = 'common.save="Salvar"';
    expect(parseProperties(raw)).toEqual({ 'common.save': 'Salvar' });
  });

  it('parses multiple keys and returns a non-empty object (hasMessages contract)', () => {
    const raw = 'login.emailLabel=E-mail\nlogin.passwordLabel=Senha';
    const result = parseProperties(raw);
    expect(hasMessages(result)).toBe(true);
  });
});
