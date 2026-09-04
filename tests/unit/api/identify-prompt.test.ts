import { describe, expect, it } from 'vitest';

import { certificationIdentifyPrompt } from '@/config/prompts/certification-config/identify.prompt';
import { publicExamIdentifyPrompt } from '@/config/prompts/public-exam-config/identify.prompt';

describe('certificationIdentifyPrompt', () => {
  it('adds a hints section naming the certifying body and exam code the user supplied', () => {
    const prompt = certificationIdentifyPrompt.build({
      query: 'solutions architect',
      language: 'en',
      provider: 'AWS',
      key: 'SAA-C03',
    });

    expect(prompt).toContain('USER-PROVIDED HINTS');
    expect(prompt).toContain('- Certifying body: AWS');
    expect(prompt).toContain('- Exam code: SAA-C03');
  });

  it('includes only the hint lines for the fields that were provided', () => {
    const prompt = certificationIdentifyPrompt.build({
      query: 'solutions architect',
      language: 'en',
      provider: 'AWS',
    });

    expect(prompt).toContain('- Certifying body: AWS');
    expect(prompt).not.toContain('- Exam code:');
  });

  it('omits the hints section entirely when the user supplied nothing', () => {
    const prompt = certificationIdentifyPrompt.build({ query: 'solutions architect', language: 'en' });

    expect(prompt).not.toContain('USER-PROVIDED HINTS');
  });
});

describe('publicExamIdentifyPrompt', () => {
  it('adds a hints section naming the banca, cargo and edital the user supplied', () => {
    const prompt = publicExamIdentifyPrompt.build({
      query: 'TRT 4',
      language: 'pt',
      examBoard: 'FCC',
      role: 'Analista Judiciário',
      edital: '1/2026',
    });

    expect(prompt).toContain('USER-PROVIDED HINTS');
    expect(prompt).toContain('- Banca organizadora: FCC');
    expect(prompt).toContain('- Cargo: Analista Judiciário');
    expect(prompt).toContain('- Edital: 1/2026');
  });

  it('includes only the hint lines for the fields that were provided', () => {
    const prompt = publicExamIdentifyPrompt.build({ query: 'TRT 4', language: 'pt', examBoard: 'FCC' });

    expect(prompt).toContain('- Banca organizadora: FCC');
    expect(prompt).not.toContain('- Cargo:');
    expect(prompt).not.toContain('- Edital:');
  });

  it('omits the hints section entirely when the user supplied nothing', () => {
    const prompt = publicExamIdentifyPrompt.build({ query: 'TRT 4', language: 'pt' });

    expect(prompt).not.toContain('USER-PROVIDED HINTS');
  });
});
