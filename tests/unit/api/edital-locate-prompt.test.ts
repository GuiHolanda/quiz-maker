import { describe, expect, it } from 'vitest';

import { editalLocatePrompt } from '@/config/prompts/public-exam-config/locate.prompt';

const build = (overrides: Partial<Parameters<typeof editalLocatePrompt.build>[0]> = {}) =>
  editalLocatePrompt.build({
    examName: 'Concurso Público Transpetro 2026',
    examBoard: 'CESGRANRIO',
    editalKey: 'EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR-2026.4',
    year: 2026,
    role: 'Engenheiro(a) Júnior - Mecânica',
    language: 'pt',
    excludeUrls: [],
    ...overrides,
  });

describe('editalLocatePrompt', () => {
  it('searches by the compact edital reference instead of quoting the full key', () => {
    const prompt = build();

    expect(prompt).toContain('04/2026');
    expect(prompt).not.toContain('"Edital EDITAL Nº 04');
  });

  it('still states the full edital key so the model can match the exact document', () => {
    expect(build()).toContain('EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR-2026.4');
  });

  it('tells the model to open concurso pages and pull the edital link out of their HTML', () => {
    const prompt = build().toLowerCase();

    expect(prompt).toContain('<a href');
    expect(prompt).toMatch(/abra .*p[áa]ginas/);
  });

  it('forbids answering with an HTML page instead of the PDF file', () => {
    const prompt = build().toLowerCase();

    expect(prompt).toMatch(/nunca devolva uma p[áa]gina html/);
  });

  it('omits the compact reference when no edital number is known', () => {
    const prompt = build({ editalKey: null });

    expect(prompt).not.toContain('Número do edital:');
  });
});
