import { Prisma } from '@prisma/client';

import { prismaMock } from '../__mocks__/prisma';
import { QuestionReportService } from '@/app/api/feedback/question-report/question-report.service';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const QUESTION = {
  id: 12,
  text: 'Qual serviço oferece armazenamento de objetos?',
  examName: 'AWS SAA-C03',
  sectionName: 'Design Resilient Architectures',
  topicName: 'S3',
  userId: USER_ID,
};

const VALID_INPUT = { examQuestionId: 12, reason: 'wrong_answer_key', surface: 'question_bank' };

const reportRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'report-1',
  examQuestionId: 12,
  userId: USER_ID,
  reason: 'wrong_answer_key',
  comment: null,
  questionText: QUESTION.text,
  examName: QUESTION.examName,
  sectionName: QUESTION.sectionName,
  topicName: QUESTION.topicName,
  surface: 'question_bank',
  mockExamAttemptId: null,
  status: 'open',
  resolutionNote: null,
  resolvedAt: null,
  notifiedAt: null,
  createdAt: new Date('2026-09-25T12:00:00Z'),
  updatedAt: new Date('2026-09-25T12:00:00Z'),
  ...overrides,
});

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });

describe('QuestionReportService', () => {
  let service: QuestionReportService;

  beforeEach(() => {
    service = new QuestionReportService(prismaMock as any);
    prismaMock.examQuestion.findUnique.mockResolvedValue(QUESTION as any);
    prismaMock.questionReport.findUnique.mockResolvedValue(null);
    prismaMock.questionReport.create.mockResolvedValue(reportRow() as any);
    prismaMock.questionReport.update.mockResolvedValue(reportRow() as any);
    prismaMock.mockExamAttempt.findFirst.mockResolvedValue({ id: 45 } as any);
    prismaMock.user.findUnique.mockResolvedValue({ email: 'ana@example.com', plan: 'pro' } as any);
  });

  describe('validação do payload', () => {
    it.each([
      ['string numérica', '12'],
      ['decimal', 1.5],
      ['zero', 0],
      ['negativo', -3],
      ['null', null],
      ['ausente', undefined],
    ])('RN-04: rejeita examQuestionId %s com 400', async (_label, examQuestionId) => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, examQuestionId })).rejects.toMatchObject({ status: 400 });
    });

    it.each([
      ['fora da lista', 'gabarito_errado'],
      ['número', 7],
      ['ausente', undefined],
    ])('RN-05: rejeita reason %s com 400', async (_label, reason) => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, reason })).rejects.toMatchObject({ status: 400 });
    });

    it.each(['wrong_answer_key', 'ambiguous_statement', 'out_of_scope', 'typo', 'duplicate_options', 'other'])(
      'RN-05: aceita o motivo %s',
      async (reason) => {
        await expect(service.create(USER_ID, { ...VALID_INPUT, reason })).resolves.toBeDefined();
      }
    );

    it.each([
      ['fora da lista', 'sidebar'],
      ['ausente', undefined],
    ])('RN-06: rejeita surface %s com 400', async (_label, surface) => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, surface })).rejects.toMatchObject({ status: 400 });
    });

    it.each([null, 'texto', 42, []])('rejeita um corpo que não é objeto (%j) com 400', async (input) => {
      await expect(service.create(USER_ID, input)).rejects.toMatchObject({ status: 400 });
    });

    it('rejeita antes de tocar o banco', async () => {
      await service.create(USER_ID, { ...VALID_INPUT, reason: 'nope' }).catch(() => undefined);

      expect(prismaMock.examQuestion.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.questionReport.create).not.toHaveBeenCalled();
    });
  });

  describe('comentário', () => {
    it('RN-07: aceita exatamente 1000 caracteres', async () => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, comment: 'a'.repeat(1000) })).resolves.toBeDefined();
    });

    it('RN-07: rejeita 1001 caracteres com 400', async () => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, comment: 'a'.repeat(1001) })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('RN-07: o limite vale depois do trim, então espaços nas pontas não contam', async () => {
      const comment = `   ${'a'.repeat(1000)}   `;

      await expect(service.create(USER_ID, { ...VALID_INPUT, comment })).resolves.toBeDefined();
      expect(prismaMock.questionReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ comment: 'a'.repeat(1000) }),
      });
    });

    it.each([
      ['ausente', undefined],
      ['null', null],
      ['vazio', ''],
      ['só espaços', '   \n  '],
    ])('RN-07: comentário %s é gravado como null', async (_label, comment) => {
      await service.create(USER_ID, { ...VALID_INPUT, comment });

      expect(prismaMock.questionReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ comment: null }),
      });
    });

    it('RN-07: rejeita comentário que não é texto com 400', async () => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, comment: 123 })).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('visibilidade da questão', () => {
    it('RN-08: 404 quando a questão não existe', async () => {
      prismaMock.examQuestion.findUnique.mockResolvedValue(null);

      await expect(service.create(USER_ID, VALID_INPUT)).rejects.toMatchObject({ status: 404 });
    });

    it('RN-08: 404, e não 403, quando a questão é de outro usuário, para não revelar que ela existe', async () => {
      prismaMock.examQuestion.findUnique.mockResolvedValue({ ...QUESTION, userId: OTHER_USER_ID } as any);

      await expect(service.create(USER_ID, VALID_INPUT)).rejects.toMatchObject({ status: 404 });
      expect(prismaMock.questionReport.create).not.toHaveBeenCalled();
    });

    it('RN-08: permite reportar uma questão de pool, sem dono', async () => {
      prismaMock.examQuestion.findUnique.mockResolvedValue({ ...QUESTION, userId: null } as any);

      await expect(service.create(USER_ID, VALID_INPUT)).resolves.toBeDefined();
    });

    it('busca a questão pelo id informado', async () => {
      await service.create(USER_ID, VALID_INPUT);

      expect(prismaMock.examQuestion.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 12 } }));
    });
  });

  describe('simulado de origem', () => {
    const INPUT_IN_ATTEMPT = { ...VALID_INPUT, surface: 'attempt', mockExamAttemptId: 45 };

    it('RN-09: com surface question_bank não aceita mockExamAttemptId (400)', async () => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, mockExamAttemptId: 45 })).rejects.toMatchObject({
        status: 400,
      });
    });

    it.each(['attempt', 'review'])('RN-09: aceita mockExamAttemptId com surface %s', async (surface) => {
      await service.create(USER_ID, { ...INPUT_IN_ATTEMPT, surface });

      expect(prismaMock.questionReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ mockExamAttemptId: 45, surface }),
      });
    });

    it.each([
      ['string numérica', '45'],
      ['decimal', 4.5],
      ['zero', 0],
    ])('RN-09: rejeita mockExamAttemptId %s com 400', async (_label, mockExamAttemptId) => {
      await expect(service.create(USER_ID, { ...INPUT_IN_ATTEMPT, mockExamAttemptId })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('RN-09: 404 quando a tentativa não é do usuário', async () => {
      prismaMock.mockExamAttempt.findFirst.mockResolvedValue(null);

      await expect(service.create(USER_ID, INPUT_IN_ATTEMPT)).rejects.toMatchObject({ status: 404 });
      expect(prismaMock.mockExamAttempt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 45, userId: USER_ID } })
      );
    });

    it('RN-09: sem mockExamAttemptId, grava null e não consulta tentativas', async () => {
      await service.create(USER_ID, VALID_INPUT);

      expect(prismaMock.mockExamAttempt.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.questionReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ mockExamAttemptId: null }),
      });
    });
  });

  describe('criação', () => {
    it('RN-10: grava o snapshot lido do banco e ignora campos homônimos e o userId do payload', async () => {
      await service.create(USER_ID, {
        ...VALID_INPUT,
        questionText: 'texto forjado',
        examName: 'exame forjado',
        sectionName: 'seção forjada',
        topicName: 'tópico forjado',
        userId: OTHER_USER_ID,
      });

      expect(prismaMock.questionReport.create).toHaveBeenCalledWith({
        data: {
          userId: USER_ID,
          examQuestionId: 12,
          reason: 'wrong_answer_key',
          comment: null,
          surface: 'question_bank',
          mockExamAttemptId: null,
          questionText: QUESTION.text,
          examName: QUESTION.examName,
          sectionName: QUESTION.sectionName,
          topicName: QUESTION.topicName,
        },
      });
    });

    it('RN-12: um reporte novo devolve reopened false e o registro criado', async () => {
      const result = await service.create(USER_ID, VALID_INPUT);

      expect(result.reopened).toBe(false);
      expect(result.report).toMatchObject({ id: 'report-1', status: 'open' });
      expect(prismaMock.questionReport.update).not.toHaveBeenCalled();
    });

    it('devolve o e-mail e o plano de quem reportou, só para o aviso ao time', async () => {
      const result = await service.create(USER_ID, VALID_INPUT);

      expect(result.reporter).toEqual({ email: 'ana@example.com', plan: 'pro' });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID }, select: { email: true, plan: true } })
      );
    });

    it('devolve reporter null quando o usuário não é encontrado', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      expect((await service.create(USER_ID, VALID_INPUT)).reporter).toBeNull();
    });
  });

  describe('reporte que já existe', () => {
    it('busca pelo par usuário e questão', async () => {
      await service.create(USER_ID, VALID_INPUT);

      expect(prismaMock.questionReport.findUnique).toHaveBeenCalledWith({
        where: { userId_examQuestionId: { userId: USER_ID, examQuestionId: 12 } },
      });
    });

    it.each(['open', 'triaged', 'accepted'])(
      'RN-11: reportar de novo com o reporte %s responde 409 already_reported',
      async (status) => {
        prismaMock.questionReport.findUnique.mockResolvedValue(reportRow({ status }) as any);

        await expect(service.create(USER_ID, VALID_INPUT)).rejects.toMatchObject({
          status: 409,
          body: { code: 'already_reported' },
        });
        expect(prismaMock.questionReport.create).not.toHaveBeenCalled();
        expect(prismaMock.questionReport.update).not.toHaveBeenCalled();
      }
    );

    it('RN-11: um status desconhecido é tratado como ativo, sem reabrir', async () => {
      prismaMock.questionReport.findUnique.mockResolvedValue(reportRow({ status: 'em_analise' }) as any);

      await expect(service.create(USER_ID, VALID_INPUT)).rejects.toMatchObject({ status: 409 });
    });

    it.each(['rejected', 'fixed'])(
      'RN-12: reportar de novo com o reporte %s reabre o mesmo registro',
      async (status) => {
        prismaMock.questionReport.findUnique.mockResolvedValue(
          reportRow({ status, resolvedAt: new Date(), resolutionNote: 'ok', notifiedAt: new Date() }) as any
        );

        const result = await service.create(USER_ID, {
          ...VALID_INPUT,
          reason: 'typo',
          comment: 'voltou a errar',
          surface: 'attempt',
          mockExamAttemptId: 45,
        });

        expect(result.reopened).toBe(true);
        expect(prismaMock.questionReport.create).not.toHaveBeenCalled();
        expect(prismaMock.questionReport.update).toHaveBeenCalledWith({
          where: { id: 'report-1' },
          data: {
            reason: 'typo',
            comment: 'voltou a errar',
            surface: 'attempt',
            mockExamAttemptId: 45,
            questionText: QUESTION.text,
            examName: QUESTION.examName,
            sectionName: QUESTION.sectionName,
            topicName: QUESTION.topicName,
            status: 'open',
            resolvedAt: null,
            resolutionNote: null,
            notifiedAt: null,
          },
        });
      }
    );

    it('RN-11: a corrida entre dois envios (P2002 no insert) vira 409 already_reported', async () => {
      prismaMock.questionReport.create.mockRejectedValue(p2002());

      await expect(service.create(USER_ID, VALID_INPUT)).rejects.toMatchObject({
        status: 409,
        body: { code: 'already_reported' },
      });
    });

    it('não engole outros erros do banco', async () => {
      const failure = new Error('conexão perdida');
      prismaMock.questionReport.create.mockRejectedValue(failure);

      await expect(service.create(USER_ID, VALID_INPUT)).rejects.toBe(failure);
    });
  });

  describe('markNotified', () => {
    it('RN-22: grava o instante do envio em notifiedAt', async () => {
      await service.markNotified('report-1');

      expect(prismaMock.questionReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { notifiedAt: expect.any(Date) },
      });
    });
  });
});
