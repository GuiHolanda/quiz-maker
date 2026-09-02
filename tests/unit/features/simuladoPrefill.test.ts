import {
  buildSimuladoPrefillFromJob,
  readSimuladoPrefill,
  writeSimuladoPrefill,
} from '@/app/(workspace)/simulados/components/create/simuladoPrefill';
import { SIMULADO_NEW_PREFILL_KEY } from '@/config/constants';

function createLocalStorageFake() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('simuladoPrefill', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageFake());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips the payload and clears the key after the first read', () => {
    writeSimuladoPrefill({
      examId: 'e1',
      name: 'Simulado A',
      totalQuestions: 20,
      durationMinutes: null,
      questionSource: 'wrong',
      sections: [{ sectionName: 'A', questionCount: 20 }],
    });

    const prefill = readSimuladoPrefill();

    expect(prefill).toEqual({
      examId: 'e1',
      name: 'Simulado A',
      totalQuestions: 20,
      durationMinutes: null,
      questionSource: 'wrong',
      sections: [{ sectionName: 'A', questionCount: 20 }],
    });
    expect(readSimuladoPrefill()).toBeNull();
  });

  it('tolerates the legacy payload shape written by the generation jobs provider', () => {
    localStorage.setItem(
      SIMULADO_NEW_PREFILL_KEY,
      JSON.stringify({ type: 'certification', examId: 'e2', totalQuestions: 40 })
    );

    const prefill = readSimuladoPrefill();

    expect(prefill).toEqual({
      examId: 'e2',
      name: undefined,
      totalQuestions: 40,
      questionSource: 'library',
      sections: [],
    });
    expect(prefill).not.toHaveProperty('durationMinutes');
  });

  it('preserves an explicit null durationMinutes written by the duplicate flow', () => {
    writeSimuladoPrefill({
      examId: 'e3',
      totalQuestions: 10,
      durationMinutes: null,
      questionSource: 'library',
      sections: [],
    });

    expect(readSimuladoPrefill()).toHaveProperty('durationMinutes', null);
  });

  it('returns null and clears the key on malformed JSON', () => {
    localStorage.setItem(SIMULADO_NEW_PREFILL_KEY, '{ not valid json');

    expect(readSimuladoPrefill()).toBeNull();
    expect(localStorage.getItem(SIMULADO_NEW_PREFILL_KEY)).toBeNull();
  });

  it('returns null and clears the key when the payload has no examId', () => {
    localStorage.setItem(SIMULADO_NEW_PREFILL_KEY, JSON.stringify({ totalQuestions: 5 }));

    expect(readSimuladoPrefill()).toBeNull();
    expect(localStorage.getItem(SIMULADO_NEW_PREFILL_KEY)).toBeNull();
  });
});

describe('buildSimuladoPrefillFromJob', () => {
  it('keeps only the topics with a positive savedCount as sections', () => {
    const prefill = buildSimuladoPrefillFromJob({
      refKey: 'exam-1',
      topics: [
        { topicName: 'Redes', savedCount: 3 },
        { topicName: 'Segurança', savedCount: 0 },
        { topicName: 'Storage', savedCount: 2 },
      ],
    });

    expect(prefill).toEqual({
      examId: 'exam-1',
      totalQuestions: 5,
      questionSource: 'library',
      sections: [
        { sectionName: 'Redes', questionCount: 3 },
        { sectionName: 'Storage', questionCount: 2 },
      ],
    });
  });

  it('sums totalQuestions from the savedCount of the included topics', () => {
    const prefill = buildSimuladoPrefillFromJob({
      refKey: 'exam-2',
      topics: [
        { topicName: 'A', savedCount: 4 },
        { topicName: 'B', savedCount: 6 },
        { topicName: 'C', savedCount: 0 },
      ],
    });

    expect(prefill?.totalQuestions).toBe(10);
    expect(prefill?.sections).toHaveLength(2);
  });

  it('returns null when no topic has a saved question', () => {
    expect(
      buildSimuladoPrefillFromJob({
        refKey: 'exam-3',
        topics: [
          { topicName: 'A', savedCount: 0 },
          { topicName: 'B', savedCount: 0 },
        ],
      })
    ).toBeNull();

    expect(buildSimuladoPrefillFromJob({ refKey: 'exam-3', topics: [] })).toBeNull();
  });
});
