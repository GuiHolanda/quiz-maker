import { prismaMock } from '../__mocks__/prisma';
import { MockExamService } from '@/app/api/mock-exams/mock-exam.service';

const openAICallMock = vi.fn();

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = openAICallMock;
  },
}));

describe('MockExamService', () => {
  let service: MockExamService;

  beforeEach(() => {
    service = new MockExamService();
    openAICallMock.mockReset();
  });

  // Behaviour 1: validateSubjectAvailability throws 422 when count < requested (tested via create())
  it('create() throws 422 when available question count is less than the requested questionCount', async () => {
    // resolveSubjects: find the subject by publicExamId
    prismaMock.publicExamSubject.findMany.mockResolvedValue([
      { id: 'sub-1', name: 'Matemática' } as any,
    ]);

    // validateSubjectAvailability: find the exam
    prismaMock.publicExam.findFirst.mockResolvedValue({
      id: 'exam-1',
      name: 'Concurso ABC',
    } as any);

    // Only 3 questions available, but 5 are requested
    prismaMock.publicExamQuestion.count.mockResolvedValue(3);

    await expect(
      service.create(
        {
          publicExamId: 'exam-1',
          name: 'Test',
          totalQuestions: 5,
          subjects: [{ subjectName: 'Matemática', questionCount: 5 }],
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
        publicExamQuestion: {
          answer: { correctOptions: ['A'] },
        },
      },
    ] as any);

    // Array-form transaction mock — batch form, not callback form
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

  // Behaviour 3: getAttemptResult computes subject breakdown correctly
  it('getAttemptResult() computes correct subjectBreakdown with per-subject correct/total counts', async () => {
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
        publicExam: {
          id: 'exam-1',
          name: 'Concurso ABC',
          examBoard: { id: 'board-1', name: 'CESGRANRIO' },
        },
        questions: [
          {
            id: 1,
            order: 0,
            publicExamQuestion: {
              id: 101,
              text: 'Q1',
              correctCount: 0,
              subject: 'Matemática',
              topic: null,
              difficulty: 'medium',
              options: [],
              examBoardName: 'CESGRANRIO',
              publicExamName: 'Concurso ABC',
              answer: { questionId: 101, correctOptions: ['A'], explanations: [] }, // selected ['A'] → correct
            },
          },
          {
            id: 2,
            order: 1,
            publicExamQuestion: {
              id: 102,
              text: 'Q2',
              correctCount: 0,
              subject: 'Matemática',
              topic: null,
              difficulty: 'medium',
              options: [],
              examBoardName: 'CESGRANRIO',
              publicExamName: 'Concurso ABC',
              answer: { questionId: 102, correctOptions: ['A'], explanations: [] }, // selected ['B'], correct is ['A'] → wrong
            },
          },
          {
            id: 3,
            order: 2,
            publicExamQuestion: {
              id: 103,
              text: 'Q3',
              correctCount: 0,
              subject: 'Português',
              topic: null,
              difficulty: 'easy',
              options: [],
              examBoardName: 'CESGRANRIO',
              publicExamName: 'Concurso ABC',
              answer: { questionId: 103, correctOptions: ['C'], explanations: [] }, // selected ['C'] → correct
            },
          },
        ],
      },
    } as any;

    prismaMock.mockExamAttempt.findFirst.mockResolvedValue(mockAttemptResult);

    const result = await service.getAttemptResult(1, 10, 'user-1');

    expect(result.subjectBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subjectName: 'Matemática', correct: 1, total: 2 }),
        expect.objectContaining({ subjectName: 'Português', correct: 1, total: 1 }),
      ]),
    );
    expect(result.subjectBreakdown).toHaveLength(2);
  });

  // Behaviour 4: resolveSubjects matches subject names case-insensitively (tested via create())
  it('create() resolves subject names case-insensitively via NFC+lowercase looseKey matching', async () => {
    const exam = { id: 'exam-1', name: 'Concurso ABC' } as any;

    // resolveSubjects: DB has 'Língua Portuguesa', request passes 'língua portuguesa'
    prismaMock.publicExamSubject.findMany.mockResolvedValue([
      { id: 'sub-1', name: 'Língua Portuguesa' } as any,
    ]);

    // validateSubjectAvailability + create() both call publicExam.findFirst
    prismaMock.publicExam.findFirst.mockResolvedValue(exam);

    // 10 questions available — more than the 2 requested → passes availability check
    prismaMock.publicExamQuestion.count.mockResolvedValue(10);

    // drawQuestions calls findFirstOrThrow then findMany
    prismaMock.publicExam.findFirstOrThrow.mockResolvedValue(exam);
    prismaMock.publicExamQuestion.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);

    // Final mockExam.create
    prismaMock.mockExam.create.mockResolvedValue({
      id: 42,
      name: 'Test',
      publicExam: { id: 'exam-1', name: 'Concurso ABC', examBoard: { id: 'board-1', name: 'CESGRANRIO' } },
      _count: { questions: 2 },
      createdAt: new Date(),
    } as any);

    await expect(
      service.create(
        {
          publicExamId: 'exam-1',
          name: 'Test',
          totalQuestions: 2,
          subjects: [{ subjectName: 'língua portuguesa', questionCount: 2 }],
        },
        'user-1',
      ),
    ).resolves.not.toThrow();

    expect(prismaMock.mockExam.create).toHaveBeenCalledOnce();

    expect(prismaMock.publicExamQuestion.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ subjectId: 'sub-1' }),
          ]),
        }),
      }),
    );
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
        publicExam: { name: 'Concurso ABC', role: null, examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            publicExamQuestion: {
              id: 100,
              subject: 'Matemática',
              topic: null,
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              publicExamName: 'Concurso ABC',
              examBoardName: 'CESGRANRIO',
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] },
            },
          },
        ],
      } as any);

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result).toEqual({ generated: 0 });
      expect(openAICallMock).not.toHaveBeenCalled();
    });

    it('calls OpenAI per subject and persists answers for missing questions', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue({
        id: 1,
        publicExam: { name: 'Concurso ABC', role: 'Analista', examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            publicExamQuestion: {
              id: 100,
              subject: 'Matemática',
              topic: 'Álgebra',
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              publicExamName: 'Concurso ABC',
              examBoardName: 'CESGRANRIO',
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
          {
            publicExamQuestion: {
              id: 200,
              subject: 'Português',
              topic: 'Sintaxe',
              text: 'Q2',
              correctCount: 1,
              difficulty: 'easy',
              publicExamName: 'Concurso ABC',
              examBoardName: 'CESGRANRIO',
              options: [{ label: 'A', text: 'opt-a' }],
              answer: null,
            },
          },
        ],
      } as any);

      openAICallMock
        .mockResolvedValueOnce(JSON.stringify({ answers: [{ questionId: 100, correctOptions: ['A'] }] }))
        .mockResolvedValueOnce(JSON.stringify({ answers: [{ questionId: 200, correctOptions: ['B'] }] }));
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result.generated).toBe(2);
      expect(openAICallMock).toHaveBeenCalledTimes(2);
      const subjects = new Set(openAICallMock.mock.calls.map((c: any[]) => c[1].subject_name));

      expect(subjects.has('Matemática')).toBe(true);
      expect(subjects.has('Português')).toBe(true);
      // Each call carries the exam context.
      const firstInput = openAICallMock.mock.calls[0][1];

      expect(firstInput.public_exam_name).toBe('Concurso ABC');
      expect(firstInput.exam_board_name).toBe('CESGRANRIO');
      expect(firstInput.role).toBe('Analista');
    });

    it('skips only the questions that already have an answer', async () => {
      prismaMock.mockExam.findFirst.mockResolvedValue({
        id: 1,
        publicExam: { name: 'Concurso ABC', role: null, examBoard: { name: 'CESGRANRIO' } },
        questions: [
          {
            publicExamQuestion: {
              id: 100,
              subject: 'Matemática',
              topic: null,
              text: 'Q1',
              correctCount: 1,
              difficulty: 'medium',
              publicExamName: 'Concurso ABC',
              examBoardName: 'CESGRANRIO',
              options: [{ label: 'A', text: 'opt' }],
              answer: { id: 9, correctOptions: ['A'] }, // skip
            },
          },
          {
            publicExamQuestion: {
              id: 101,
              subject: 'Matemática',
              topic: null,
              text: 'Q2',
              correctCount: 1,
              difficulty: 'medium',
              publicExamName: 'Concurso ABC',
              examBoardName: 'CESGRANRIO',
              options: [{ label: 'A', text: 'opt' }],
              answer: null, // generate
            },
          },
        ],
      } as any);

      openAICallMock.mockResolvedValueOnce(
        JSON.stringify({ answers: [{ questionId: 101, correctOptions: ['A'] }] })
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));

      const result = await service.ensureAnswers(1, 'user-1');

      expect(result.generated).toBe(1);
      const payloadSent = openAICallMock.mock.calls[0][1].questions as Array<{ id: number }>;

      expect(payloadSent.map((q) => q.id)).toEqual([101]);
    });
  });
});
