import { describe, expect, it } from 'vitest';

import { classifyEditalUrl } from '@/lib/edital-classifier';

describe('classifyEditalUrl', () => {
  it('flags a quadro de vagas as annex even though the filename contains "edital"', () => {
    const url =
      'https://transpetro.com.br/Quadro%20Vagas_Edital%20042026%20PSP%20TERRA%20-%20SUPERIOR%20-Transpetro_ret1%20(1).pdf';
    expect(classifyEditalUrl(url)).toBe('annex');
  });

  it('classifies common auxiliary annexes', () => {
    expect(classifyEditalUrl('https://x.gov.br/gabarito-preliminar.pdf')).toBe('annex');
    expect(classifyEditalUrl('https://x.gov.br/resultado-final.pdf')).toBe('annex');
    expect(classifyEditalUrl('https://x.gov.br/edital-convocacao.pdf')).toBe('annex');
    expect(classifyEditalUrl('https://x.gov.br/cronograma.pdf')).toBe('annex');
  });

  it('classifies a real edital as main', () => {
    expect(classifyEditalUrl('https://www.trf1.jus.br/editais/edital-001-2025.pdf')).toBe('main');
    expect(classifyEditalUrl('https://x.gov.br/edital-de-abertura-2025.pdf')).toBe('main');
  });

  it('treats the conteúdo programático annex as main, not an auxiliary annex', () => {
    expect(classifyEditalUrl('https://x.gov.br/anexo-ii-conteudo-programatico.pdf')).toBe('main');
    expect(classifyEditalUrl('https://x.gov.br/edital-abertura-anexo-materias.pdf')).toBe('main');
  });

  it('keeps an abertura edital that merely mentions vagas once as main', () => {
    expect(classifyEditalUrl('https://x.gov.br/edital-de-abertura-cargos-e-vagas-2025.pdf')).toBe('main');
  });

  it('flags the canonical "quadro de vagas" annex even next to abertura', () => {
    expect(classifyEditalUrl('https://x.gov.br/edital-abertura-quadro-de-vagas-2025.pdf')).toBe('annex');
  });

  it('classifies a real edital whose filename has no separator before the year as main', () => {
    // Regression: digits glued to the preceding word ("Edital042026") used to defeat the
    // \bedital\b token boundary, ranking the official file below third-party mirrors.
    expect(
      classifyEditalUrl(
        'https://transpetro.com.br/data/files/27/35/6A/E5/C8100A104ACC22E9D8098204/Edital042026_PSPTerra_NS.pdf'
      )
    ).toBe('main');
  });

  it('does not flag a retificação as an annex on its own', () => {
    // Regression: a consolidated retificação (e.g. "_ret2") republishing the edital in full is
    // the authoritative document, not an auxiliary annex — verify.prompt.ts is what actually
    // opens the PDF and tells the two apart.
    expect(
      classifyEditalUrl(
        'https://transpetro.com.br/x/Edital%20042026%20PSP%20TERRA%20-%20SUPERIOR%20-Transpetro_ret2.pdf'
      )
    ).toBe('main');
  });

  it('returns unknown when the URL carries no filename hints', () => {
    expect(classifyEditalUrl('https://transpetro.com.br/download?id=123')).toBe('unknown');
    expect(classifyEditalUrl('not a url')).toBe('unknown');
  });
});
