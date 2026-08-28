import {
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
      durationMinutes: null,
      questionSource: 'library',
      sections: [],
    });
  });

  it('returns null and clears the key on malformed JSON', () => {
    localStorage.setItem(SIMULADO_NEW_PREFILL_KEY, '{ not valid json');

    expect(readSimuladoPrefill()).toBeNull();
    expect(localStorage.getItem(SIMULADO_NEW_PREFILL_KEY)).toBeNull();
  });
});
