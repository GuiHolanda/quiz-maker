import { prismaMock } from '../__mocks__/prisma';
import { ExamQuestionService } from '@/features/services/exam-question.service';

describe('ExamQuestionService', () => {
  it('saveAnswers upserts an ExamAnswer per question', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.examAnswer.upsert.mockResolvedValue({ id: 1 } as any);
    const service = new ExamQuestionService(prismaMock as any);
    await service.saveAnswers([{ questionId: 1, correctOptions: ['A'], explanations: {} } as any]);
    expect(prismaMock.examAnswer.upsert).toHaveBeenCalled();
  });

  it('saveExplanations createMany with answerId', async () => {
    prismaMock.examExplanation.createMany.mockResolvedValue({ count: 1 } as any);
    const service = new ExamQuestionService(prismaMock as any);
    await service.saveExplanations(5, { A: 'ok' });
    expect(prismaMock.examExplanation.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [{ answerId: 5, label: 'A', text: 'ok' }] })
    );
  });
});

describe('createFromPayload — pool attachment', () => {
  it('sets poolId when a matching QuestionPool entry exists for the exam context', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'user-1',
      type: 'certification',
      name: 'AWS SAA',
      providerId: 'provider-1',
      examBoardId: null,
      sections: [
        {
          id: 'section-1',
          name: 'Cloud Architecture',
          topics: [{ id: 'topic-1', name: 'VPC' }],
        },
      ],
    };
    const pool = { id: 'pool-1', sectionName: 'Cloud Architecture', topicName: 'VPC' };

    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(exam as any);
    prismaMock.questionPool.findMany.mockResolvedValue([pool] as any);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 1 } as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload(
      [
        {
          id: 1,
          examName: 'AWS SAA',
          sectionName: 'Cloud Architecture',
          topic: 'VPC',
          text: 'Q?',
          correctCount: 1,
          difficulty: 'medium',
          options: { A: 'opt A' },
        },
      ],
      'user-1',
      'exam-1'
    );

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poolId: 'pool-1' }) })
    );
  });

  it('leaves poolId null when no pool entry exists', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'user-1',
      type: 'certification',
      name: 'AWS SAA',
      providerId: 'provider-1',
      examBoardId: null,
      sections: [{ id: 'section-1', name: 'Security', topics: [] }],
    };

    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(exam as any);
    prismaMock.questionPool.findMany.mockResolvedValue([] as any);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 2 } as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload(
      [
        {
          id: 1,
          examName: 'AWS SAA',
          sectionName: 'Security',
          text: 'Q?',
          correctCount: 1,
          difficulty: 'easy',
          options: { A: 'A' },
        },
      ],
      'user-1',
      'exam-1'
    );

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poolId: null }) })
    );
  });
});

describe('createFromPayload — option shuffling', () => {
  const question = {
    id: 1,
    examName: 'AWS SAA',
    sectionName: 'Security',
    text: 'Q?',
    correctCount: 1,
    difficulty: 'easy',
    options: { A: 'correct', B: 'wrong 1', C: 'wrong 2', D: 'wrong 3', E: 'wrong 4' },
  };

  function persistedOptions() {
    return prismaMock.examOption.createMany.mock.calls.flatMap(([call]: any) => call.data);
  }

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(null);
    prismaMock.questionPool.findMany.mockResolvedValue([] as any);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 1 } as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.examOption.createMany.mockClear();
  });

  it('persists every option text exactly once under the same label set', async () => {
    const service = new ExamQuestionService(prismaMock as any);

    await service.createFromPayload([question] as any, 'user-1', 'exam-1');

    const persisted = persistedOptions();

    expect(persisted.map((option: any) => option.label).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(persisted.map((option: any) => option.text).sort()).toEqual(
      ['correct', 'wrong 1', 'wrong 2', 'wrong 3', 'wrong 4'].sort()
    );
  });

  it('does not always persist the drafting model letter for the first option', async () => {
    // The model puts the correct alternative under "A" almost every time; persisting
    // its ordering verbatim let users score by always picking "A".
    const service = new ExamQuestionService(prismaMock as any);
    const labels = new Set<string>();

    for (let run = 0; run < 60; run++) {
      prismaMock.examOption.createMany.mockClear();
      await service.createFromPayload([question] as any, 'user-1', 'exam-1');

      const correct = persistedOptions().find((option: any) => option.text === 'correct');

      labels.add(correct.label);
    }

    expect(labels.size).toBeGreaterThan(1);
  });
});

describe('createFromPayload — question format', () => {
  const trueFalseQuestion = {
    id: 1,
    examName: 'TRF 1',
    sectionName: 'Direito Administrativo',
    text: 'A Administração pode anular seus próprios atos.',
    correctCount: 1,
    difficulty: 'easy',
    options: { C: 'Certo', E: 'Errado' },
  };

  function persistedOptions() {
    return prismaMock.examOption.createMany.mock.calls.flatMap(([call]: any) => call.data);
  }

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.questionPool.findMany.mockResolvedValue([] as any);
    prismaMock.examQuestion.create.mockResolvedValue({ id: 1 } as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.examOption.createMany.mockClear();
    prismaMock.examQuestion.create.mockClear();
  });

  it('stamps the exam format onto the persisted question', async () => {
    prismaMock.exam.findFirst.mockResolvedValue({
      id: 'exam-1',
      type: 'public_exam',
      questionFormat: 'true_false',
      providerId: null,
      examBoardId: null,
      sections: [],
    } as any);

    const service = new ExamQuestionService(prismaMock as any);

    await service.createFromPayload([trueFalseQuestion] as any, 'user-1', 'exam-1');

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ format: 'true_false' }) })
    );
  });

  it('falls back to mc_5 when the exam cannot be resolved', async () => {
    prismaMock.exam.findFirst.mockResolvedValue(null);

    const service = new ExamQuestionService(prismaMock as any);

    await service.createFromPayload([trueFalseQuestion] as any, 'user-1', 'exam-1');

    expect(prismaMock.examQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ format: 'mc_5' }) })
    );
  });

  it('never moves the text off a semantic label', async () => {
    // In Certo/Errado the label IS the meaning. Reassigning texts across C and E the way
    // the position-bias shuffle does for multiple choice would invert every gabarito.
    prismaMock.exam.findFirst.mockResolvedValue({
      id: 'exam-1',
      type: 'public_exam',
      questionFormat: 'true_false',
      providerId: null,
      examBoardId: null,
      sections: [],
    } as any);

    const service = new ExamQuestionService(prismaMock as any);

    for (let run = 0; run < 40; run++) {
      prismaMock.examOption.createMany.mockClear();
      await service.createFromPayload([trueFalseQuestion] as any, 'user-1', 'exam-1');

      const persisted = persistedOptions();

      expect(persisted.find((option: any) => option.label === 'C').text).toBe('Certo');
      expect(persisted.find((option: any) => option.label === 'E').text).toBe('Errado');
    }
  });
});

describe('createFromPayload — batching de escritas', () => {
  it('lê o pool uma vez e grava todas as alternativas num único createMany', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'user-1',
      type: 'certification',
      name: 'AWS SAA',
      providerId: 'provider-1',
      examBoardId: null,
      questionFormat: 'mc_5',
      sections: [{ id: 'section-1', name: 'Cloud Architecture', topics: [{ id: 'topic-1', name: 'VPC' }] }],
    };

    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(exam as any);
    prismaMock.questionPool.findMany.mockResolvedValue([
      { id: 'pool-1', sectionName: 'Cloud Architecture', topicName: 'VPC' },
    ] as any);
    let nextId = 1;
    prismaMock.examQuestion.create.mockImplementation(() => Promise.resolve({ id: nextId++ }) as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);

    const questions = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      examName: 'AWS SAA',
      sectionName: 'Cloud Architecture',
      topic: 'VPC',
      text: `Q${i}?`,
      correctCount: 1,
      difficulty: 'medium',
      options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
    }));

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload(questions as any, 'user-1', 'exam-1');

    expect(prismaMock.questionPool.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.questionPool.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.examOption.createMany).toHaveBeenCalledTimes(1);

    const inserted = prismaMock.examOption.createMany.mock.calls[0][0] as any;
    expect(inserted.data).toHaveLength(20);
    expect(new Set(inserted.data.map((row: any) => row.questionId))).toEqual(new Set([1, 2, 3, 4]));
  });

  it('não chama createMany quando não há alternativas para gravar', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.exam.findFirst.mockResolvedValue(null);
    prismaMock.questionPool.findMany.mockResolvedValue([] as any);
    prismaMock.examOption.createMany.mockResolvedValue({ count: 0 } as any);

    const service = new ExamQuestionService(prismaMock as any);
    await service.createFromPayload([], 'user-1', 'exam-1');

    expect(prismaMock.examOption.createMany).not.toHaveBeenCalled();
  });
});
