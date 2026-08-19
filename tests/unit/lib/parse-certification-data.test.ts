import { parseCertificationData } from '@/lib/parse-certification-data';

// Guards the parser that sits between the streamed AI_CHAT_TOPICS_PROMPT output and the
// Exam draft the UI renders — the model's raw text is untrusted, so every malformed or
// missing-field shape must fall back to null rather than produce a broken draft.

const VALID_BLOCK = `Here you go:

\`\`\`certification-data
{
  "context": "Validates AWS solution design skills.",
  "sources": ["[AWS Exam Guide](https://aws.amazon.com/certification/)"],
  "certificationData": {
    "label": "AWS Certified Solutions Architect - Associate",
    "key": "SAA-C03",
    "provider": "AWS",
    "totalQuestions": 65,
    "examDurationMinutes": 130,
    "passingScore": 72,
    "topics": [
      { "name": "Design Secure Architectures", "minQuestions": 26, "maxQuestions": 30 },
      { "name": "Design Resilient Architectures", "minQuestions": 24, "maxQuestions": 26 }
    ]
  }
}
\`\`\`
`;

describe('parseCertificationData', () => {
  it('returns null when there is no certification-data fence', () => {
    expect(parseCertificationData('Qual certificação você tem em mente?')).toBeNull();
  });

  it('returns null for malformed JSON inside the fence', () => {
    const text = '```certification-data\n{ not valid json\n```';
    expect(parseCertificationData(text)).toBeNull();
  });

  it('returns null when required certificationData fields are missing', () => {
    const text = '```certification-data\n{"certificationData": {"provider": "AWS"}}\n```';
    expect(parseCertificationData(text)).toBeNull();
  });

  it('returns null when a topic is missing minQuestions/maxQuestions', () => {
    const text =
      '```certification-data\n{"certificationData": {"label": "X", "key": "X-1", "topics": [{"name": "A"}]}}\n```';
    expect(parseCertificationData(text)).toBeNull();
  });

  it('parses a well-formed block into context, sources, and an Exam draft', () => {
    const result = parseCertificationData(VALID_BLOCK);

    expect(result).not.toBeNull();
    expect(result?.context).toBe('Validates AWS solution design skills.');
    expect(result?.sources).toEqual(['[AWS Exam Guide](https://aws.amazon.com/certification/)']);
    expect(result?.examDraft).toEqual({
      type: 'certification',
      name: 'AWS Certified Solutions Architect - Associate',
      key: 'SAA-C03',
      role: null,
      year: null,
      totalQuestions: 65,
      examDurationMinutes: 130,
      passingScore: 72,
      provider: { name: 'AWS' },
      examBoard: null,
      sections: [
        { name: 'Design Secure Architectures', minQuestions: 26, maxQuestions: 30, topics: [] },
        { name: 'Design Resilient Architectures', minQuestions: 24, maxQuestions: 26, topics: [] },
      ],
    });
  });

  it('maps subtopics into ExamSection.topics, filtering blanks and non-strings', () => {
    const text =
      '```certification-data\n' +
      '{"certificationData": {"label": "X", "key": "X-1", "topics": ' +
      '[{"name": "A", "minQuestions": 50, "maxQuestions": 100, "subtopics": ["Sub A", " Sub B ", "", 42]}]}}\n' +
      '```';
    const result = parseCertificationData(text);

    expect(result?.examDraft.sections).toEqual([
      { name: 'A', minQuestions: 50, maxQuestions: 100, topics: [{ name: 'Sub A' }, { name: 'Sub B' }] },
    ]);
  });

  it('defaults to an empty topics array when subtopics is absent', () => {
    const text =
      '```certification-data\n' +
      '{"certificationData": {"label": "X", "key": "X-1", "topics": ' +
      '[{"name": "A", "minQuestions": 50, "maxQuestions": 100}]}}\n' +
      '```';
    const result = parseCertificationData(text);

    expect(result?.examDraft.sections[0].topics).toEqual([]);
  });

  it('defaults optional numeric fields to null/0 when the source omits them', () => {
    const text =
      '```certification-data\n' +
      '{"certificationData": {"label": "X", "key": "X-1", "topics": ' +
      '[{"name": "A", "minQuestions": 50, "maxQuestions": 100}]}}\n' +
      '```';
    const result = parseCertificationData(text);

    expect(result?.examDraft.totalQuestions).toBe(0);
    expect(result?.examDraft.examDurationMinutes).toBeNull();
    expect(result?.examDraft.passingScore).toBeNull();
    expect(result?.examDraft.provider).toBeNull();
    expect(result?.context).toBe('');
    expect(result?.sources).toEqual([]);
  });
});
