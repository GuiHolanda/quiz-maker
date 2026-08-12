import { prismaMock } from '../__mocks__/prisma';
import { ExamCatalogService } from '@/features/services/exam-catalog.service';

describe('ExamCatalogService', () => {
  let service: ExamCatalogService;

  beforeEach(() => {
    service = new ExamCatalogService(prismaMock as any);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getTemplates
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getTemplates()', () => {
    it('returns empty array when no templates exist', async () => {
      prismaMock.exam.findMany
        .mockResolvedValueOnce([]) // templates
        .mockResolvedValueOnce([]); // userExams
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]);

      const result = await service.getTemplates('user-1');

      expect(result).toEqual([]);
    });

    it('returns all templates when user has no existing exams', async () => {
      const template = makeTemplate();
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template]) // templates
        .mockResolvedValueOnce([]); // userExams
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]);

      const result = await service.getTemplates('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tmpl-1');
    });

    it('hides a template whose type+name the user already has forked', async () => {
      const template = makeTemplate({ id: 'tmpl-1', type: 'certification', name: 'AWS SAA' });
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template]) // templates
        .mockResolvedValueOnce([{ name: 'AWS SAA', type: 'certification' }] as any); // userExams already has it
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]);

      const result = await service.getTemplates('user-1');

      expect(result).toHaveLength(0);
    });

    it('keeps templates the user has not forked even when other exams exist', async () => {
      const template1 = makeTemplate({ id: 'tmpl-1', type: 'certification', name: 'AWS SAA' });
      const template2 = makeTemplate({ id: 'tmpl-2', type: 'certification', name: 'Azure AZ-900' });
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template1, template2]) // templates
        .mockResolvedValueOnce([{ name: 'AWS SAA', type: 'certification' }] as any); // user already has AWS SAA
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]);

      const result = await service.getTemplates('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tmpl-2');
    });

    it('attaches poolQuestionCount from groupBy result', async () => {
      const template = makeTemplate({ id: 'tmpl-1' });
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template])
        .mockResolvedValueOnce([]);
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([
        { examId: 'tmpl-1', _count: { id: 42 } } as any,
      ]);

      const result = await service.getTemplates('user-1');

      expect(result[0].poolQuestionCount).toBe(42);
    });

    it('sets poolQuestionCount to 0 when no pool questions exist for a template', async () => {
      const template = makeTemplate({ id: 'tmpl-1' });
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template])
        .mockResolvedValueOnce([]);
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]); // no pool entries

      const result = await service.getTemplates('user-1');

      expect(result[0].poolQuestionCount).toBe(0);
    });

    it('maps sections and topics correctly', async () => {
      const template = makeTemplate({
        id: 'tmpl-1',
        sections: [
          {
            id: 'sec-1',
            name: 'Cloud Concepts',
            minQuestions: 25,
            maxQuestions: 35,
            topics: [{ id: 'top-1', name: 'VPC' }],
          },
        ],
      });
      prismaMock.exam.findMany
        .mockResolvedValueOnce([template])
        .mockResolvedValueOnce([]);
      (prismaMock.examQuestion.groupBy as any).mockResolvedValue([]);

      const result = await service.getTemplates('user-1');

      expect(result[0]!.sections).toHaveLength(1);
      expect(result[0]!.sections[0]!.name).toBe('Cloud Concepts');
      expect(result[0]!.sections[0]!.topics![0]!.name).toBe('VPC');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // forkExam
  // ─────────────────────────────────────────────────────────────────────────────

  describe('forkExam()', () => {
    it('throws 404 when template is not found', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(null);

      await expect(service.forkExam('tmpl-missing', 'user-1')).rejects.toMatchObject({ status: 404 });
    });

    it('creates a user exam copied from the template', async () => {
      const template = makeTemplate({
        id: 'tmpl-1',
        providerId: 'prov-1',
        examBoardId: null,
        sections: [],
      });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.provider.findUnique.mockResolvedValue({ id: 'prov-1', name: 'AWS', fullName: 'Amazon Web Services' } as any);
      prismaMock.provider.upsert.mockResolvedValue({ id: 'prov-1', name: 'AWS' } as any);
      prismaMock.exam.create.mockResolvedValue(makeForkedExam({ userId: 'user-1', isTemplate: false }));

      const result = await service.forkExam('tmpl-1', 'user-1');

      expect(prismaMock.exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', isTemplate: false }),
        }),
      );
      expect(result.id).toBe('forked-1');
    });

    it('upserts provider when template has one', async () => {
      const template = makeTemplate({ providerId: 'prov-1', examBoardId: null, sections: [] });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.provider.findUnique.mockResolvedValue({ id: 'prov-1', name: 'AWS', fullName: null } as any);
      prismaMock.provider.upsert.mockResolvedValue({ id: 'prov-1', name: 'AWS' } as any);
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());

      await service.forkExam('tmpl-1', 'user-1');

      expect(prismaMock.provider.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'AWS' } }),
      );
    });

    it('upserts examBoard when template has one', async () => {
      const template = makeTemplate({ providerId: null, examBoardId: 'board-1', sections: [] });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.examBoard.findUnique.mockResolvedValue({ id: 'board-1', name: 'FCC', fullName: null } as any);
      prismaMock.examBoard.upsert.mockResolvedValue({ id: 'board-1', name: 'FCC' } as any);
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());

      await service.forkExam('tmpl-1', 'user-1');

      expect(prismaMock.examBoard.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'FCC' } }),
      );
    });

    it('skips provider upsert when template has no provider', async () => {
      const template = makeTemplate({ providerId: null, examBoardId: null, sections: [] });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());

      await service.forkExam('tmpl-1', 'user-1');

      expect(prismaMock.provider.upsert).not.toHaveBeenCalled();
      expect(prismaMock.examBoard.upsert).not.toHaveBeenCalled();
    });

    it('copies sections and topics into the forked exam', async () => {
      const template = makeTemplate({
        sections: [
          { id: 'sec-1', name: 'Cloud', minQuestions: 20, maxQuestions: 30, topics: [{ id: 'top-1', name: 'VPC' }] },
        ],
      });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());
      prismaMock.questionPool.findFirst.mockResolvedValue(null);
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-x' } as any);

      await service.forkExam('tmpl-1', 'user-1');

      const createArg = prismaMock.exam.create.mock.calls[0][0];
      const sectionPayload = (createArg.data.sections as any).create[0];
      expect(sectionPayload.name).toBe('Cloud');
      expect(sectionPayload.topics.create[0].name).toBe('VPC');
    });

    it('creates sections without topics.create when section has no topics', async () => {
      const template = makeTemplate({
        sections: [{ id: 'sec-1', name: 'General', minQuestions: 10, maxQuestions: 20, topics: [] }],
      });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());
      prismaMock.questionPool.findFirst.mockResolvedValue(null);
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-x' } as any);

      await service.forkExam('tmpl-1', 'user-1');

      const createArg = prismaMock.exam.create.mock.calls[0][0];
      const sectionPayload = (createArg.data.sections as any).create[0];
      expect(sectionPayload.topics).toBeUndefined();
    });

    it('ensures pool entries exist for template sections on fork', async () => {
      const template = makeTemplate({
        providerId: 'prov-1',
        examBoardId: null,
        sections: [{ id: 'sec-1', name: 'Cloud', minQuestions: 20, maxQuestions: 30, topics: [] }],
      });
      prismaMock.exam.findFirst.mockResolvedValue(template as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.provider.findUnique.mockResolvedValue({ id: 'prov-1', name: 'AWS', fullName: 'Amazon Web Services' } as any);
      prismaMock.provider.upsert.mockResolvedValue({ id: 'prov-1', name: 'AWS' } as any);
      prismaMock.exam.create.mockResolvedValue(makeForkedExam());
      prismaMock.questionPool.findFirst.mockResolvedValue(null);
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-x' } as any);

      await service.forkExam('tmpl-1', 'user-1');

      expect(prismaMock.questionPool.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ sectionName: 'Cloud', topicName: null }) }),
      );
      expect(prismaMock.questionPool.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ sectionName: 'Cloud', topicName: null }) }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // promoteExam
  // ─────────────────────────────────────────────────────────────────────────────

  describe('promoteExam()', () => {
    it('throws 404 when exam is not found', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(null);

      await expect(service.promoteExam('missing-exam')).rejects.toMatchObject({ status: 404 });
    });

    it('sets isTemplate = true on the exam', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(makeExamWithSections({ sections: [] }) as any);
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.exam.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'exam-1' }, data: { isTemplate: true } }),
      );
    });

    it('creates a QuestionPool entry for each topic in a section', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          sections: [
            { id: 'sec-1', name: 'Cloud', topics: [{ id: 'top-1', name: 'VPC' }] },
          ],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst
        .mockResolvedValueOnce(null)                  // ensurePoolEntries — pool doesn't exist yet
        .mockResolvedValueOnce({ id: 'pool-1' } as any); // back-fill loop — pool now exists
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-1' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.questionPool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sectionName: 'Cloud', topicName: 'VPC' }),
        }),
      );
    });

    it('creates a section-level QuestionPool when a section has no topics', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          sections: [{ id: 'sec-1', name: 'General', topics: [] }],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst
        .mockResolvedValueOnce(null)                  // ensurePoolEntries — pool doesn't exist yet
        .mockResolvedValueOnce({ id: 'pool-2' } as any); // back-fill loop — pool now exists
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-2' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.questionPool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sectionName: 'General', topicName: null }),
        }),
      );
    });

    it('back-fills poolId on questions for sections without topics', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          examBoardId: null,
          sections: [{ id: 'sec-1', name: 'General', topics: [] }],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst
        .mockResolvedValueOnce(null)                  // ensurePoolEntries — pool doesn't exist yet
        .mockResolvedValueOnce({ id: 'pool-2' } as any); // back-fill loop — pool now exists
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-2' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.examQuestion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sectionName: 'General', topicName: null, poolId: null }),
          data: { poolId: 'pool-2' },
        }),
      );
    });

    it('calls examQuestion.updateMany to back-fill poolId after pool create', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          examBoardId: null,
          sections: [{ id: 'sec-1', name: 'Cloud', topics: [{ id: 'top-1', name: 'VPC' }] }],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst
        .mockResolvedValueOnce(null)                  // ensurePoolEntries — pool doesn't exist yet
        .mockResolvedValueOnce({ id: 'pool-1' } as any); // back-fill loop — pool now exists
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-1' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.examQuestion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { poolId: 'pool-1' } }),
      );
    });

    it('skips pool create when pool already exists (idempotent)', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          sections: [{ id: 'sec-1', name: 'General', topics: [] }],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst.mockResolvedValue({ id: 'existing-pool' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.questionPool.create).not.toHaveBeenCalled();
      expect(prismaMock.examQuestion.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { poolId: 'existing-pool' } }),
      );
    });

    it('creates one pool per topic when a section has multiple topics', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(
        makeExamWithSections({
          providerId: 'prov-1',
          sections: [
            {
              id: 'sec-1',
              name: 'Cloud',
              topics: [
                { id: 'top-1', name: 'VPC' },
                { id: 'top-2', name: 'S3' },
              ],
            },
          ],
        }) as any,
      );
      prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
      prismaMock.exam.update.mockResolvedValue({} as any);
      prismaMock.questionPool.findFirst
        .mockResolvedValueOnce(null)                   // ensurePoolEntries VPC — doesn't exist
        .mockResolvedValueOnce(null)                   // ensurePoolEntries S3 — doesn't exist
        .mockResolvedValue({ id: 'pool-x' } as any);   // back-fill loop calls — pool exists
      prismaMock.questionPool.create.mockResolvedValue({ id: 'pool-x' } as any);
      prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.promoteExam('exam-1');

      expect(prismaMock.questionPool.create).toHaveBeenCalledTimes(2);
      const names = prismaMock.questionPool.create.mock.calls.map((c: any[]) => c[0].data.topicName);
      expect(names).toEqual(expect.arrayContaining(['VPC', 'S3']));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getAdminExamDetail
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getAdminExamDetail()', () => {
    it('throws 404 when exam is not found', async () => {
      prismaMock.exam.findFirst.mockResolvedValue(null);

      await expect(service.getAdminExamDetail('missing')).rejects.toMatchObject({ status: 404 });
    });

    it('returns exam detail including poolQuestionCount', async () => {
      prismaMock.exam.findFirst.mockResolvedValue({
        id: 'exam-1',
        type: 'certification',
        name: 'AWS SAA',
        role: null,
        year: null,
        key: 'SAA-C03',
        totalQuestions: 65,
        examDurationMinutes: 130,
        passingScore: 72,
        isTemplate: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        provider: { id: 'p1', name: 'AWS' },
        examBoard: null,
        sections: [
          { id: 'sec-1', name: 'Cloud', minQuestions: 25, maxQuestions: 35, topics: [] },
        ],
        user: { email: 'owner@example.com' },
        questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
      } as any);
      prismaMock.examQuestion.count.mockResolvedValue(7);

      const result = await service.getAdminExamDetail('exam-1');

      expect(result.questionCount).toBe(3);
      expect(result.poolQuestionCount).toBe(7);
      expect(result.ownerEmail).toBe('owner@example.com');
      expect(result.isTemplate).toBe(false);
    });

    it('returns ownerEmail as null when exam has no owner (template)', async () => {
      prismaMock.exam.findFirst.mockResolvedValue({
        id: 'tmpl-1',
        type: 'certification',
        name: 'AWS SAA',
        role: null,
        year: null,
        key: null,
        totalQuestions: 65,
        examDurationMinutes: null,
        passingScore: null,
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: null,
        examBoard: null,
        sections: [],
        user: null,
        questions: [],
      } as any);
      prismaMock.examQuestion.count.mockResolvedValue(0);

      const result = await service.getAdminExamDetail('tmpl-1');

      expect(result.ownerEmail).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // getAdminCatalogEntries
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getAdminCatalogEntries()', () => {
    it('returns empty array when no exams exist', async () => {
      prismaMock.exam.findMany.mockResolvedValue([]);

      const result = await service.getAdminCatalogEntries();

      expect(result).toEqual([]);
    });

    it('maps sectionCount and questionCount from included relations', async () => {
      prismaMock.exam.findMany.mockResolvedValue([
        {
          id: 'exam-1',
          type: 'certification',
          name: 'AWS SAA',
          role: null,
          year: null,
          provider: null,
          examBoard: null,
          isTemplate: true,
          userId: null,
          user: null,
          sections: [{ id: 's1' }, { id: 's2' }],
          questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
      ] as any);

      const result = await service.getAdminCatalogEntries();

      expect(result[0].sectionCount).toBe(2);
      expect(result[0].questionCount).toBe(3);
      expect(result[0].isTemplate).toBe(true);
    });

    it('resolves ownerEmail from user relation', async () => {
      prismaMock.exam.findMany.mockResolvedValue([
        {
          id: 'exam-2',
          type: 'public_exam',
          name: 'TRF',
          role: 'Analista',
          year: 2025,
          provider: null,
          examBoard: null,
          isTemplate: false,
          userId: 'user-1',
          user: { email: 'owner@example.com' },
          sections: [],
          questions: [],
        },
      ] as any);

      const result = await service.getAdminCatalogEntries();

      expect(result[0].ownerEmail).toBe('owner@example.com');
    });

    it('sets ownerEmail to null when user relation is absent', async () => {
      prismaMock.exam.findMany.mockResolvedValue([
        {
          id: 'tmpl-1',
          type: 'certification',
          name: 'Azure AZ-900',
          role: null,
          year: null,
          provider: null,
          examBoard: null,
          isTemplate: true,
          userId: null,
          user: null,
          sections: [],
          questions: [],
        },
      ] as any);

      const result = await service.getAdminCatalogEntries();

      expect(result[0].ownerEmail).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeTemplate(overrides: Record<string, any> = {}) {
  return {
    id: 'tmpl-1',
    type: 'certification',
    name: 'AWS SAA',
    role: null,
    year: null,
    key: 'SAA-C03',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    isTemplate: true,
    providerId: 'prov-1',
    examBoardId: null,
    userId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    provider: { id: 'prov-1', name: 'AWS', fullName: 'Amazon Web Services' },
    examBoard: null,
    sections: [],
    ...overrides,
  };
}

function makeExamWithSections(overrides: Record<string, any> = {}) {
  return {
    id: 'exam-1',
    type: 'certification',
    name: 'AWS SAA',
    providerId: 'prov-1',
    examBoardId: null,
    sections: [],
    ...overrides,
  };
}

function makeForkedExam(overrides: Record<string, any> = {}) {
  return {
    id: 'forked-1',
    type: 'certification',
    name: 'AWS SAA',
    role: null,
    year: null,
    key: 'SAA-C03',
    totalQuestions: 65,
    examDurationMinutes: 130,
    passingScore: 72,
    isTemplate: false,
    providerId: 'prov-1',
    examBoardId: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    provider: { id: 'prov-1', name: 'AWS' },
    examBoard: null,
    sections: [],
    ...overrides,
  };
}
