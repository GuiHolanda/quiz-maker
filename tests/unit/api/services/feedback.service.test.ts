import { FEEDBACK_CATEGORIES } from '@/config/constants';
import { prismaMock } from '../__mocks__/prisma';
import { FeedbackService } from '@/app/api/feedback/feedback.service';

const USER_ID = 'user-1';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)';
const VALID_INPUT = {
  category: 'bug',
  message: 'O filtro do banco de questões não limpa.',
  route: '/question-bank',
  locale: 'pt',
};

const feedbackRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'feedback-1',
  userId: USER_ID,
  email: 'ana@example.com',
  plan: 'pro',
  category: 'bug',
  message: VALID_INPUT.message,
  route: '/question-bank',
  userAgent: USER_AGENT,
  locale: 'pt',
  status: 'open',
  notifiedAt: null,
  createdAt: new Date('2026-09-26T12:00:00Z'),
  updatedAt: new Date('2026-09-26T12:00:00Z'),
  ...overrides,
});

const savedData = () => prismaMock.feedback.create.mock.calls[0][0].data;

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    service = new FeedbackService(prismaMock as any);
    prismaMock.user.findUnique.mockResolvedValue({ email: 'ana@example.com', plan: 'pro' } as any);
    prismaMock.feedback.create.mockResolvedValue(feedbackRow() as any);
    prismaMock.feedback.update.mockResolvedValue(feedbackRow() as any);
  });

  describe('validação do payload', () => {
    it.each([
      ['null', null],
      ['array', []],
      ['string', 'bug'],
    ])('rejeita payload %s com 400', async (_label, input) => {
      await expect(service.create(USER_ID, input, USER_AGENT)).rejects.toMatchObject({ status: 400 });
      expect(prismaMock.feedback.create).not.toHaveBeenCalled();
    });

    it.each([
      ['fora da lista', 'complaint'],
      ['csat (backlog F4)', 'csat'],
      ['maiúsculas', 'BUG'],
      ['número', 1],
      ['ausente', undefined],
    ])('RN-13: rejeita category %s com 400', async (_label, category) => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, category }, USER_AGENT)).rejects.toMatchObject({
        status: 400,
      });
    });

    it.each(FEEDBACK_CATEGORIES.map(({ id }) => id))('RN-13: aceita a categoria %s', async (category) => {
      await service.create(USER_ID, { ...VALID_INPUT, category }, USER_AGENT);

      expect(savedData().category).toBe(category);
    });

    it.each([
      ['vazia', ''],
      ['só espaços', '   \n\t '],
      ['ausente', undefined],
      ['número', 42],
    ])('RN-14: rejeita message %s com 400', async (_label, message) => {
      await expect(service.create(USER_ID, { ...VALID_INPUT, message }, USER_AGENT)).rejects.toMatchObject({
        status: 400,
      });
    });

    it('RN-14: rejeita message com mais de 2000 caracteres após o trim', async () => {
      const message = 'a'.repeat(2001);

      await expect(service.create(USER_ID, { ...VALID_INPUT, message }, USER_AGENT)).rejects.toMatchObject({
        status: 400,
      });
    });

    it('RN-14: aceita 2000 caracteres cercados de espaços e grava a mensagem trimada', async () => {
      const content = 'a'.repeat(2000);

      await service.create(USER_ID, { ...VALID_INPUT, message: `  ${content}\n ` }, USER_AGENT);

      expect(savedData().message).toBe(content);
    });
  });

  describe('contexto automático', () => {
    it('RN-15: trunca a rota em 200 caracteres', async () => {
      await service.create(USER_ID, { ...VALID_INPUT, route: `/${'x'.repeat(300)}` }, USER_AGENT);

      expect(savedData().route).toHaveLength(200);
    });

    it.each([
      ['ausente', undefined],
      ['número', 7],
      ['vazia', '   '],
    ])('RN-15: rota %s vira null', async (_label, route) => {
      await service.create(USER_ID, { ...VALID_INPUT, route }, USER_AGENT);

      expect(savedData().route).toBeNull();
    });

    it.each(['pt', 'en'])('RN-15: grava o locale %s', async (locale) => {
      await service.create(USER_ID, { ...VALID_INPUT, locale }, USER_AGENT);

      expect(savedData().locale).toBe(locale);
    });

    it.each([
      ['de outro idioma', 'es'],
      ['com região', 'pt-BR'],
      ['número', 1],
      ['ausente', undefined],
    ])('RN-15: locale %s vira null', async (_label, locale) => {
      await service.create(USER_ID, { ...VALID_INPUT, locale }, USER_AGENT);

      expect(savedData().locale).toBeNull();
    });

    it('RN-15: trunca o user-agent em 300 caracteres', async () => {
      await service.create(USER_ID, VALID_INPUT, 'u'.repeat(500));

      expect(savedData().userAgent).toHaveLength(300);
    });

    it('RN-15: sem user-agent grava null', async () => {
      await service.create(USER_ID, VALID_INPUT, null);

      expect(savedData().userAgent).toBeNull();
    });
  });

  describe('snapshot e identidade', () => {
    it('RN-16: plan e email vêm do banco, ignorando campos homônimos do payload', async () => {
      await service.create(USER_ID, { ...VALID_INPUT, plan: 'admin', email: 'forjado@example.com' }, USER_AGENT);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: { email: true, plan: true },
      });
      expect(savedData()).toMatchObject({ plan: 'pro', email: 'ana@example.com' });
    });

    it('RN-16: usuário não encontrado grava email e plan nulos', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await service.create(USER_ID, VALID_INPUT, USER_AGENT);

      expect(savedData()).toMatchObject({ email: null, plan: null });
    });

    it('RN-18: o userId vem do argumento, nunca do payload', async () => {
      await service.create(USER_ID, { ...VALID_INPUT, userId: 'intruso' }, USER_AGENT);

      expect(savedData().userId).toBe(USER_ID);
    });

    it('aceita userId null (caminho anônimo futuro) sem consultar o User', async () => {
      await service.create(null, VALID_INPUT, USER_AGENT);

      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(savedData()).toMatchObject({ userId: null, email: null, plan: null });
    });
  });

  it('persiste categoria, mensagem, rota, locale e user-agent, sem status explícito', async () => {
    await service.create(USER_ID, VALID_INPUT, USER_AGENT);

    expect(savedData()).toEqual({
      userId: USER_ID,
      email: 'ana@example.com',
      plan: 'pro',
      category: 'bug',
      message: VALID_INPUT.message,
      route: '/question-bank',
      locale: 'pt',
      userAgent: USER_AGENT,
    });
  });

  it('RN-17: dois envios iguais geram dois registros', async () => {
    await service.create(USER_ID, VALID_INPUT, USER_AGENT);
    await service.create(USER_ID, VALID_INPUT, USER_AGENT);

    expect(prismaMock.feedback.create).toHaveBeenCalledTimes(2);
  });

  it('devolve o registro criado', async () => {
    await expect(service.create(USER_ID, VALID_INPUT, USER_AGENT)).resolves.toMatchObject({ id: 'feedback-1' });
  });

  it('RN-22: markNotified grava o instante do envio', async () => {
    await service.markNotified('feedback-1');

    expect(prismaMock.feedback.update).toHaveBeenCalledWith({
      where: { id: 'feedback-1' },
      data: { notifiedAt: expect.any(Date) },
    });
  });
});
