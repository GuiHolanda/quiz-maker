import { describe, it, expect } from 'vitest';

import { normalizeCase, stripNumbering, splitTopics, validateExamBlueprint } from '@/lib/exam-blueprint';

describe('normalizeCase', () => {
  it('converts fully-uppercase string to sentence case', () => {
    expect(normalizeCase('LEGISLAÇÃO APLICADA AO SERVIÇO PÚBLICO')).toBe('Legislação aplicada ao serviço público');
  });

  it('converts fully-uppercase string with punctuation to sentence case', () => {
    expect(normalizeCase('ÉTICA E MORAL: DEFINIÇÃO E DISTINÇÃO')).toBe('Ética e moral: definição e distinção');
  });

  it('does not alter mixed-case strings', () => {
    expect(normalizeCase('Direito Constitucional')).toBe('Direito Constitucional');
  });

  it('does not alter already sentence-cased strings', () => {
    expect(normalizeCase('Princípios fundamentais')).toBe('Princípios fundamentais');
  });

  it('normalizes all-caps strings regardless of length — examBoard.name is excluded at the call site in validateExtracted', () => {
    // The function normalizes any all-uppercase string to sentence case — including
    // short acronyms like CESPE. Acronyms in examBoard.name are protected in production
    // by not calling normalizeCase on that field at all.
    expect(normalizeCase('CESPE')).toBe('Cespe');
  });
});

describe('stripNumbering', () => {
  it('removes leading numeric numbering', () => {
    expect(stripNumbering('1.1. Direito Constitucional')).toBe('Direito Constitucional');
  });

  it('removes leading roman numeral numbering', () => {
    expect(stripNumbering('IV - Direito Administrativo')).toBe('Direito Administrativo');
  });

  it('leaves unnumbered text unchanged', () => {
    expect(stripNumbering('Direito Constitucional')).toBe('Direito Constitucional');
  });
});

describe('splitTopics', () => {
  it('splits a semicolon-separated topic into multiple entries', () => {
    expect(splitTopics('Tópico A; Tópico B')).toEqual(['Tópico A', 'Tópico B']);
  });

  it('returns a single-item array when there is no semicolon', () => {
    expect(splitTopics('Tópico único')).toEqual(['Tópico único']);
  });
});

describe('validateExamBlueprint', () => {
  const validPayload = {
    context: 'Validates AWS solution design skills.',
    sources: ['[AWS Exam Guide](https://aws.amazon.com/certification/)'],
    exam: {
      label: 'AWS Certified Solutions Architect – Associate',
      key: 'SAA-C03',
      provider: 'AWS',
      totalQuestions: 65,
      examDurationMinutes: 130,
      passingScore: 72,
      year: 2024,
      topics: [
        { name: 'Design Secure Architectures', minQuestions: 26, maxQuestions: 34, subtopics: ['Sub A', 'Sub B'] },
        { name: 'Design Resilient Architectures', minQuestions: 24, maxQuestions: 32 },
      ],
    },
  };

  it('maps a well-formed certification blueprint into an Exam draft', () => {
    const result = validateExamBlueprint(validPayload, 'certification');

    expect(result.context).toBe('Validates AWS solution design skills.');
    expect(result.sources).toEqual(['[AWS Exam Guide](https://aws.amazon.com/certification/)']);
    expect(result.examDraft).toEqual({
      type: 'certification',
      name: 'AWS Certified Solutions Architect – Associate',
      key: 'SAA-C03',
      role: null,
      year: 2024,
      totalQuestions: 65,
      examDurationMinutes: 130,
      passingScore: 72,
      provider: { name: 'AWS' },
      examBoard: null,
      sections: [
        { name: 'Design Secure Architectures', minQuestions: 26, maxQuestions: 34, topics: [{ name: 'Sub A' }, { name: 'Sub B' }] },
        { name: 'Design Resilient Architectures', minQuestions: 24, maxQuestions: 32, topics: [] },
      ],
    });
  });

  it('maps examBoard and role for a public_exam blueprint, leaving provider null', () => {
    const result = validateExamBlueprint(
      {
        exam: {
          label: 'Concurso Público TRF 1ª Região 2025',
          key: '001/2025',
          examBoard: 'CEBRASPE',
          role: 'Analista Judiciário',
          topics: [{ name: 'Língua Portuguesa', minQuestions: 10, maxQuestions: 10 }],
        },
      },
      'public_exam'
    );

    expect(result.examDraft.type).toBe('public_exam');
    expect(result.examDraft.provider).toBeNull();
    expect(result.examDraft.examBoard).toEqual({ name: 'CEBRASPE' });
    expect(result.examDraft.role).toBe('Analista Judiciário');
  });

  it('throws a 502 when data is not an object', () => {
    expect(() => validateExamBlueprint(null, 'certification')).toThrow(
      expect.objectContaining({ status: 502 })
    );
  });

  it('throws a 502 when exam is missing', () => {
    expect(() => validateExamBlueprint({}, 'certification')).toThrow(expect.objectContaining({ status: 502 }));
  });

  it('throws a 502 when exam.label is missing', () => {
    expect(() =>
      validateExamBlueprint({ exam: { topics: [{ name: 'A', minQuestions: 1, maxQuestions: 2 }] } }, 'certification')
    ).toThrow(expect.objectContaining({ status: 502 }));
  });

  it('throws a 502 when topics is empty', () => {
    expect(() => validateExamBlueprint({ exam: { label: 'X', topics: [] } }, 'certification')).toThrow(
      expect.objectContaining({ status: 502 })
    );
  });

  it('throws a 502 when a topic is missing minQuestions/maxQuestions', () => {
    expect(() =>
      validateExamBlueprint({ exam: { label: 'X', topics: [{ name: 'A' }] } }, 'certification')
    ).toThrow(expect.objectContaining({ status: 502 }));
  });

  it('defaults optional fields to null/0/[] when the source omits them', () => {
    const result = validateExamBlueprint(
      { exam: { label: 'X', topics: [{ name: 'A', minQuestions: 50, maxQuestions: 100 }] } },
      'certification'
    );

    expect(result.examDraft.key).toBeNull();
    expect(result.examDraft.totalQuestions).toBe(0);
    expect(result.examDraft.examDurationMinutes).toBeNull();
    expect(result.examDraft.passingScore).toBeNull();
    expect(result.context).toBe('');
    expect(result.sources).toEqual([]);
  });

  it('filters blank and non-string subtopics', () => {
    const result = validateExamBlueprint(
      {
        exam: {
          label: 'X',
          topics: [{ name: 'A', minQuestions: 50, maxQuestions: 100, subtopics: ['Sub A', ' ', '', 42] }],
        },
      },
      'certification'
    );

    expect(result.examDraft.sections[0].topics).toEqual([{ name: 'Sub A' }]);
  });
});
