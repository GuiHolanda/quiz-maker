import { describe, expect, it } from 'vitest';

import { classifyEditalDomain, resolveAllowedDomains } from '@/lib/edital-domains';

describe('classifyEditalDomain', () => {
  it('classifies a gov.br host as official-org', () => {
    expect(classifyEditalDomain('https://www.gov.br/pf/edital.pdf')).toBe('official-org');
  });

  it('classifies jus.br, leg.br and mp.br hosts as official-org', () => {
    expect(classifyEditalDomain('https://www.trf1.jus.br/editais/edital.pdf')).toBe('official-org');
    expect(classifyEditalDomain('https://www.camara.leg.br/edital.pdf')).toBe('official-org');
    expect(classifyEditalDomain('https://www.mprj.mp.br/edital.pdf')).toBe('official-org');
  });

  it('classifies a known banca domain as official-banca', () => {
    expect(classifyEditalDomain('https://concursos.cesgranrio.org.br/portal/edital.pdf')).toBe('official-banca');
  });

  it('classifies a subdomain of a known banca domain as official-banca', () => {
    expect(classifyEditalDomain('https://download.cebraspe.org.br/edital.pdf')).toBe('official-banca');
  });

  it('classifies a known aggregator domain as aggregator', () => {
    expect(classifyEditalDomain('https://arquivos.qconcursos.com/f/edital.pdf')).toBe('aggregator');
    expect(classifyEditalDomain('https://cdn.direcaoconcursos.com.br/uploads/edital.pdf')).toBe('aggregator');
  });

  it('classifies an unrecognized domain as other', () => {
    expect(classifyEditalDomain('https://example.com/edital.pdf')).toBe('other');
  });

  it('classifies a malformed URL as other', () => {
    expect(classifyEditalDomain('not a url')).toBe('other');
  });
});

describe('resolveAllowedDomains', () => {
  it('resolves a known banca name to its domain', () => {
    expect(resolveAllowedDomains('CESGRANRIO')).toEqual(['cesgranrio.org.br']);
  });

  it('is case-insensitive', () => {
    expect(resolveAllowedDomains('cebraspe')).toEqual(['cebraspe.org.br']);
  });

  it('returns an empty array for an unknown banca', () => {
    expect(resolveAllowedDomains('Banca Desconhecida XYZ')).toEqual([]);
  });

  it('returns an empty array when examBoard is null', () => {
    expect(resolveAllowedDomains(null)).toEqual([]);
  });
});
