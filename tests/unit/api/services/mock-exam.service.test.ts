import { prismaMock } from '../__mocks__/prisma';
import { MockExamService } from '@/app/api/mock-exams/mock-exam.service';

const openAICallMock = vi.fn();

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = openAICallMock;
  },
}));

const metricsCreateLogMock = vi.fn().mockResolvedValue('log-1');
const metricsRecordStepMock = vi.fn();
const metricsFinalizeMock = vi.fn();

vi.mock('@/features/services/metrics.service', () => ({
  MetricsService: class {
    createLog = metricsCreateLogMock;
    recordStep = metricsRecordStepMock;
    finalize = metricsFinalizeMock;
  },
}));

describe('MockExamService', () => {
  let service: MockExamService;

  beforeEach(() => {
    service = new MockExamService();
    openAICallMock.mockReset();
    metricsCreateLogMock.mockClear();
    metricsRecordStepMock.mockClear();
    metricsFinalizeMock.mockClear();
  });

  // Behaviour 1: validateSectionAvailability throws 422 when count < requested (tested via create())
  it('create() throws 422 when available question count is less than the requested questionCount', async () => {
    prismaMock.examSection.findMany.mockResolvedValue([{ id: 'sec-1', name: 'Matemática' } as any]);
    prismaMock.exam.findFirst.mockResolvedValue({ id: 'exam-1', name: 'Concurso ABC' } as any);
    prismaMock.examQuestion.count.mockResolvedValue(3);

    await expect(
      service.create(
        {
          examId: 'exam-1',
          name: 'Test',
          totalQuestions: 5,
          sections: [{ sectionName: 'Matemática', questionCount: 5 }],
        },
        'user-1',
      ),
    ).rejects.toMatchObject({ status: 422, message: /insuficientes/ });
  });

  // Behaviour 2: finishAttempt saves answers and calculates score server-side
  it('finishAttempt() calls $transaction once and records answers with server-calculated score', async () => {
    prismaMock.mockExamAttempt.findFirst.mockResolvedValue({
      id: 10,
      mockExamId: 1,
      userId: 'user-1',
    } as any);

    prismaMock.mockExamQuestion.findMany.mockResolvedValue([
      {
        id: 5,
        examQuestion: { answer: { correctOptions: ['A'] } },
      },
    ] as any);

    prismaMock.$transaction.mockResolvedValue([undefined, undefined] as any);

    await service.finishAttempt(1, 10, 'user-1', [{ mockExamQuestionId: 5, selectedOptions: ['A'] }]);

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();

    expect(prismaMock.mockExamAttemptAnswer.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            attemptId: 10,
            mockExamQuestionId: 5,
            selectedOptions: '["A"]',
          }),
        ]),
      }),
    );

    expect(prismaMock.mockExamAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({
          score: 1,
          finishedAt: expect.any(Date),
        }),
      }),
    );
  });

  // Behaviour 3: getAttemptResult computes section breakdown correctly
  it('getAttemptResult() computes correct sectionBreakdown with per-section correct/total counts', async () => {
    const mockAttemptResult = {
      id: 10,
      mockExamId: 1,
      startedAt: new Date('2024-01-01'),
      finishedAt: new Date('2024-01-01T01:00:00'),
      score: 50,
      answers: [
        { mockExamQuestionId: 1, selectedOptions: JSON.stringify(['A']) }, // correct
        { mockExamQuestionId: 2, selectedOptions: JSON.stringify(['B']) }, // wrong
        { mockExamQuestionId: 3, selectedOptions: JSON.stringify(['C']) }, // correct
      ],
      mockExam: {
        id: 1,
        name: 'Test Mock',
        exam: {
          id: 'exam-1',
          name: 'Concurso ABC',
          type: 'public_exam',
          examBoard: { id: 'board-1', name: 'CESGRANRIO' },
        },
        questions: [
          {
            id: 1,
            order: 0,
            examQuestion: {
              id: 101,
              text: 'Q1',
              correctCount: 0,
              sectionName: 'Matemática',
              topicName: null,
              difficulty: 'medium',
              options: [],
              examName: 'Concurso ABC',
              answer: { questionId: 101, correctOptions: ['A'], explanations: [] },
            },
          },
          {
            id: 2,
            order: 1,
            examQuestion: {
              id: 102,
              text: 'Q2',
              correctCount: 0,
              sectionName: 'Matemática',
              topicName: null,
              difficulty: 'medium',
              options: [],
              examName: 'Concurso ABC',
              answer: { questionId: 102, correctOptions: ['A'], explanations: [] },
            },
          },
          {
            id: 3,
            order: 2,
            examQuestion: {
              id: 103,
              text: 'Q3',
              correctCount: 0,
              sectionName: 'Português',
              topicName: null,
              difficulty: 'easy',
              options: [],
              examName: 'Concurso ABC',
              answer: { questionId: 103, correctOptions: ['C'], explanations: [] },
            },
          },
        ],
      },
    } as any;

    prismaMock.mockExamAttempt.findFirst.mockResolvedValue(mockAttemptResult);

    const result = await service.getAttemptResult(1, 10, 'user-1');

    expect(result.sectionBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sectionName: 'Matemática', correct: 1, total: 2 }),
        expect.objectContaining({ sectionName: 'Português', correct: 1, total: 1 }),
      ]),
    );
    expect(result.sectionBreakdown).toHaveLength(2);
  });

  // Behaviour 4: resolveSections matches section names case-insensitively (tested via create())
  it('create() resolves section names case-insensitively via NFC+lowercase looseKey matching', async () => {
    const exam = { id: 'exam-1', name: 'Concurso ABC', provider: null, examBoard: null } as any;

    prismaMock.examSection.findMany.mockResolvedValue([{ id: 'sec-1', name: 'Língua Portuguesa' } as any]);
    prismaMock.exam.findFirst.mockResolvedValue(exam);
    prismaMock.examQuestion.count.mockResolvedValue(10);
    prismaMock.exam.findFirstOrThrow.mockResolvedValue(exam);
    prismaMock.examQuestion.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);

    prismaMock.mockExam.create.mockResolvedValue({
      id: 42,
      name: 'Test',
      exam: { id: 'exam-1', name: 'Concurso ABC', type: 'public_exam', examBoard: { id: 'board-1', name: 'CESGRANRIO' } },
      _count: { questions: 2 },
      createdAt: new Date(),
    } as any);

    await expect(
      service.create(
        {
          examId: 'exam-1',
          name: 'Test',
          totalQuestions: 2,
          sections: [{ sectionName: 'língua portuguesa', questionCount: 2 }],
        },
        'user-1',
      ),
    ).resolves.not.toThrow();

    expect(prismaMock.mockExam.create).toHaveBeenCalledOnce();

    expect(prismaMock.examQuestion.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ sectionId: 'sec-1' })]),
        }),
      }),
    );
  });

  // Behaviour 4b: drawQuestions samples the whole pool, not just the head of the query
  it('create() eventually draws every available question across repeated simulados', async () => {
    // The regression: drawing with sort(() => Math.random() - 0.5) leaves rows near their
    // original index, so the slice kept returning the same oldest questions and most of
    // the bank was unreachable.
    const exam = { id: 'exam-1', name: 'Concurso ABC', provider: null, examBoard: null } as any;
    const available = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => ({ id }));

    prismaMock.examSection.findMany.mockResolvedValue([{ id: 'sec-1', name: 'Matemática' } as any]);
    prismaMock.exam.findFirst.mockResolvedValue(exam);
    prismaMock.examQuestion.count.mockResolvedValue(available.length);
    prismaMock.exam.findFirstOrThrow.mockResolvedValue(exam);
    prismaMock.mockExam.create.mockResolvedValue({
      id: 42,
      name: 'Test',
      exam: { id: 'exam-1', name: 'Concurso ABC', type: 'public_exam', examBoard: null },
      _count: { questions: 2 },
      createdAt: new Date(),
    } as any);

    const drawnIds = new Set<number>();

    for (let run = 0; run < 60; run++) {
      // Fresh copy each run: a draw must never consume or reorder the caller's rows.
      prismaMock.examQuestion.findMany.mockResolvedValue(available.map((q) => ({ ...q })) as any);

      await service.create(
        {
          examId: 'exam-1',
          name: 'Test',
          totalQuestions: 2,
          sections: [{ sectionName: 'Matemática', questionCount: 2 }],
        },
        'user-1',
      );

      const { data } = prismaMock.mockExam.create.mock.calls.at(-1)![0] as any;

      data.questions.create.forEach((q: { examQuestionId: number }) => drawnIds.add(q.examQuestionId));
    }

    expect(Array.from(drawnIds).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  // Behaviour 5: ensureAnswers — idempotent gabarito generation
  describe('ensureAnswers', () => {
    it('throws 404 when mockExam not found', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue(null);

      await expect(service.ensureAnswers(999, 'user-1')).rejects.toMatchObject({ status: 404 });
    });

    it('returns generated:0 when every question already has an answer (idempotent)', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue({
        id: 1,
        exam: { name: 'Concurso ABC', type: 'public_exam', role: null, examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            examQuestion: {
              id: 100,
              sectionName: 'Matemática',
              topicName: null,
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              examName: 'Concurso ABC',
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] },
            },
          },
        ],
      } as any);

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result).toEqual({ generated: 0 });
      expect(openAICallMock).not.toHaveBeenCalled();
      expect(metricsCreateLogMock).not.toHaveBeenCalled();
    });

    it('calls OpenAI per section and persists answers for missing questions', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue({
        id: 1,
        exam: { name: 'Concurso ABC', type: 'public_exam', role: 'Analista', examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            examQuestion: {
              id: 100,
              sectionName: 'Matemática',
              topicName: 'Álgebra',
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              examName: 'Concurso ABC',
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
          {
            examQuestion: {
              id: 200,
              sectionName: 'Português',
              topicName: 'Sintaxe',
              text: 'Q2',
              correctCount: 1,
              difficulty: 'easy',
              examName: 'Concurso ABC',
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
        ],
      } as any);

      openAICallMock
        .mockResolvedValueOnce({ text: JSON.stringify({ answers: [{ questionId: 100, correctOptions: ['A'] }] }), inputTokens: 0, outputTokens: 0 })
        .mockResolvedValueOnce({ text: JSON.stringify({ answers: [{ questionId: 200, correctOptions: ['B'] }] }), inputTokens: 0, outputTokens: 0 });
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result.generated).toBe(2);
      expect(openAICallMock).toHaveBeenCalledTimes(2);
      const sections = new Set(openAICallMock.mock.calls.map((c: any[]) => c[1].subject_name));

      expect(sections.has('Matemática')).toBe(true);
      expect(sections.has('Português')).toBe(true);
      const firstInput = openAICallMock.mock.calls[0][1];

      expect(firstInput.public_exam_name).toBe('Concurso ABC');
      expect(firstInput.exam_board_name).toBe('CESGRANRIO');
      expect(firstInput.role).toBe('Analista');

      // Regression: this LLM call used to bypass MetricsService entirely, so its tokens
      // never showed up in /admin/analytics — see achado 14 of the pricing tier audit.
      expect(metricsCreateLogMock).toHaveBeenCalledWith('user-1', 'generate_mock_answers', 0);
      expect(metricsRecordStepMock).toHaveBeenCalledTimes(2);
      expect(metricsRecordStepMock).toHaveBeenCalledWith(
        'log-1',
        'answers',
        expect.objectContaining({ inputTokens: expect.any(Number), outputTokens: expect.any(Number) }),
        expect.any(Number)
      );
      expect(metricsFinalizeMock).toHaveBeenCalledWith('log-1', expect.any(Number));
    });

    it('skips only the questions that already have an answer', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue({
        id: 1,
        exam: { name: 'Concurso ABC', type: 'public_exam', role: null, examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            examQuestion: {
              id: 100,
              sectionName: 'Matemática',
              topicName: null,
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              examName: 'Concurso ABC',
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] }, // skip
            },
          },
          {
            examQuestion: {
              id: 101,
              sectionName: 'Matemática',
              topicName: null,
              text: 'Q2',
              correctCount: 1,
              difficulty: 'medium',
              examName: 'Concurso ABC',
              options: [{ label: 'A', text: 'opt' }],
              answer: null, // generate
            },
          },
        ],
      } as any);

      openAICallMock.mockResolvedValueOnce({
        text: JSON.stringify({ answers: [{ questionId: 101, correctOptions: ['A'] }] }),
        inputTokens: 0,
        outputTokens: 0,
      });
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result.generated).toBe(1);
      const payloadSent = openAICallMock.mock.calls[0][1].questions as Array<{ id: number }>;

      expect(payloadSent.map((q) => q.id)).toEqual([101]);
    });
  });
});
