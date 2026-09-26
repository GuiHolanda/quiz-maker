import { afterEach, beforeEach, vi, type MockInstance } from 'vitest';

import {
  buildFeedbackAlert,
  buildInternalAlert,
  buildQuestionReportAlert,
  EmailService,
  escapeHtml,
} from '@/features/services/email.service';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const INBOX = 'inbox@certifiqueai.test';

const ALERT = {
  subject: 'Reporte de questão — Gabarito errado',
  heading: 'Novo reporte de questão',
  rows: [
    { label: 'Exame', value: 'AWS SAA-C03' },
    { label: 'Usuário', value: 'ana@example.com' },
  ],
  body: 'O gabarito indica B, mas a correta é C.',
};

describe('escapeHtml', () => {
  it('escapa os cinco caracteres que abrem brecha em HTML', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });

  it('escapa o & primeiro, sem escapar duas vezes o que já é entidade', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('não mexe em texto comum nem em acentos', () => {
    expect(escapeHtml('Questão sobre coração — ok')).toBe('Questão sobre coração — ok');
  });
});

describe('buildInternalAlert', () => {
  it('RN-21: escapa HTML no título, nos rótulos, nos valores e no corpo', () => {
    const { html } = buildInternalAlert({
      subject: 'Assunto',
      heading: '<b>título</b>',
      rows: [{ label: '<i>rótulo</i>', value: '<script>alert(1)</script>' }],
      body: '<img src=x onerror=alert(1)>',
    });

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>título</b>');
    expect(html).not.toContain('<i>rótulo</i>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('RN-21: o assunto leva o prefixo fixo do produto', () => {
    expect(buildInternalAlert(ALERT).subject).toBe('[CertifiqueAI] Reporte de questão — Gabarito errado');
  });

  it('RN-21: o assunto nunca carrega quebra de linha, mesmo que o texto tenha', () => {
    const { subject } = buildInternalAlert({ ...ALERT, subject: 'linha 1\r\nBcc: alguem@x.com\nlinha 3' });

    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe('[CertifiqueAI] linha 1 Bcc: alguem@x.com linha 3');
  });

  it('RN-21: o assunto é truncado para não crescer sem limite', () => {
    const { subject } = buildInternalAlert({ ...ALERT, subject: 'x'.repeat(500) });

    expect(subject.length).toBeLessThanOrEqual('[CertifiqueAI] '.length + 150);
  });

  it('preserva as quebras de linha do corpo como <br> depois de escapar', () => {
    const { html } = buildInternalAlert({ ...ALERT, body: 'linha 1\nlinha <2>' });

    expect(html).toContain('linha 1<br>linha &lt;2&gt;');
  });

  it('mostra cada rótulo e cada valor no HTML', () => {
    const { html } = buildInternalAlert(ALERT);

    for (const { label, value } of ALERT.rows) {
      expect(html).toContain(label);
      expect(html).toContain(value);
    }
  });

  it('usa o layout de e-mail do produto', () => {
    const { html } = buildInternalAlert(ALERT);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('CertifiqueAI');
  });

  it('gera a versão em texto puro com "rótulo: valor", sem escapar', () => {
    const { text } = buildInternalAlert({
      ...ALERT,
      rows: [{ label: 'Nota', value: 'a < b' }],
    });

    expect(text).toContain('Novo reporte de questão');
    expect(text).toContain('Nota: a < b');
    expect(text).toContain('O gabarito indica B, mas a correta é C.');
  });

  it('funciona sem corpo', () => {
    const { html, text } = buildInternalAlert({ subject: 'S', heading: 'H', rows: [{ label: 'A', value: 'B' }] });

    expect(html).toContain('H');
    expect(text).toContain('A: B');
  });
});

describe('buildQuestionReportAlert', () => {
  const REPORT = {
    examQuestionId: 12,
    reason: 'wrong_answer_key',
    surface: 'review',
    examName: 'AWS SAA-C03',
    sectionName: 'Design Resilient Architectures',
    topicName: 'S3',
    questionText: 'Qual serviço oferece armazenamento de objetos?',
    comment: 'O gabarito indica B, mas a correta é C.',
  };
  const REPORTER = { email: 'ana@example.com', plan: 'pro' };

  const rowsOf = (alert: ReturnType<typeof buildQuestionReportAlert>) =>
    Object.fromEntries(alert.rows.map(({ label, value }) => [label, value]));

  it('RN-21: o assunto usa só o rótulo fixo do motivo, nunca o comentário do usuário', () => {
    const alert = buildQuestionReportAlert({ report: REPORT, reopened: false, reporter: REPORTER });

    expect(alert.subject).toBe('Reporte de questão — Gabarito errado');
    expect(alert.subject).not.toContain('wrong_answer_key');
    expect(alert.subject).not.toContain(REPORT.comment);
  });

  it.each([
    ['wrong_answer_key', 'Gabarito errado'],
    ['ambiguous_statement', 'Enunciado ambíguo'],
    ['out_of_scope', 'Fora do escopo'],
    ['typo', 'Erro de português ou digitação'],
    ['duplicate_options', 'Alternativas repetidas'],
    ['other', 'Outro problema'],
  ])('traduz o motivo %s para "%s"', (reason, label) => {
    const alert = buildQuestionReportAlert({ report: { ...REPORT, reason }, reopened: false, reporter: REPORTER });

    expect(rowsOf(alert)['Motivo']).toBe(label);
    expect(alert.subject).toContain(label);
  });

  it('um motivo desconhecido não vaza para o assunto', () => {
    const alert = buildQuestionReportAlert({
      report: { ...REPORT, reason: '<b>hack</b>' },
      reopened: false,
      reporter: REPORTER,
    });

    expect(alert.subject).toBe('Reporte de questão — Não classificado');
  });

  it('RN-12: marca o assunto e o título como reaberto', () => {
    const alert = buildQuestionReportAlert({ report: REPORT, reopened: true, reporter: REPORTER });

    expect(alert.subject).toBe('Reporte reaberto — Gabarito errado');
    expect(alert.heading).toBe('Reporte de questão reaberto');
  });

  it('lista o contexto completo do reporte', () => {
    const rows = rowsOf(buildQuestionReportAlert({ report: REPORT, reopened: false, reporter: REPORTER }));

    expect(rows).toEqual({
      Motivo: 'Gabarito errado',
      Exame: 'AWS SAA-C03',
      Seção: 'Design Resilient Architectures',
      Tópico: 'S3',
      Superfície: 'Revisão do simulado',
      Questão: '#12',
      Usuário: 'ana@example.com',
      Plano: 'pro',
    });
  });

  it('omite seção e tópico quando a questão não os tem', () => {
    const rows = rowsOf(
      buildQuestionReportAlert({
        report: { ...REPORT, sectionName: null, topicName: null },
        reopened: false,
        reporter: REPORTER,
      })
    );

    expect(rows).not.toHaveProperty('Seção');
    expect(rows).not.toHaveProperty('Tópico');
  });

  it('mostra o usuário como desconhecido quando ele não foi encontrado', () => {
    const rows = rowsOf(buildQuestionReportAlert({ report: REPORT, reopened: false, reporter: null }));

    expect(rows['Usuário']).toBe('Desconhecido');
  });

  it('põe o enunciado e o comentário no corpo', () => {
    const { body } = buildQuestionReportAlert({ report: REPORT, reopened: false, reporter: REPORTER });

    expect(body).toBe(`${REPORT.questionText}\n\nComentário do usuário:\n${REPORT.comment}`);
  });

  it('sem comentário, o corpo tem só o enunciado', () => {
    const { body } = buildQuestionReportAlert({
      report: { ...REPORT, comment: null },
      reopened: false,
      reporter: REPORTER,
    });

    expect(body).toBe(REPORT.questionText);
  });

  it('RN-21: o resultado passa pelo escape do buildInternalAlert (texto do usuário não vira HTML)', () => {
    const alert = buildQuestionReportAlert({
      report: { ...REPORT, comment: '<script>alert(1)</script>' },
      reopened: false,
      reporter: REPORTER,
    });

    expect(buildInternalAlert(alert).html).not.toContain('<script>');
  });
});

describe('buildFeedbackAlert', () => {
  const FEEDBACK = {
    category: 'bug',
    message: 'O filtro não limpa.\nTentei duas vezes.',
    email: 'ana@example.com',
    plan: 'pro',
    route: '/question-bank',
    locale: 'pt',
    userAgent: 'Mozilla/5.0 (Macintosh)',
  };

  const rowsOf = (alert: ReturnType<typeof buildFeedbackAlert>) =>
    Object.fromEntries(alert.rows.map(({ label, value }) => [label, value]));

  it('RN-21: o assunto usa só o rótulo fixo da categoria, nunca a mensagem', () => {
    const alert = buildFeedbackAlert({ ...FEEDBACK, message: 'URGENTE <b>leia</b>' });

    expect(alert.subject).toBe('Feedback — Bug');
    expect(buildInternalAlert(alert).subject).toBe('[CertifiqueAI] Feedback — Bug');
  });

  it('uma categoria desconhecida não vaza para o assunto', () => {
    expect(buildFeedbackAlert({ ...FEEDBACK, category: 'algo <script>' }).subject).toBe(
      'Feedback — Não classificado'
    );
  });

  it('lista categoria, usuário, plano, rota, idioma e navegador', () => {
    expect(rowsOf(buildFeedbackAlert(FEEDBACK))).toEqual({
      Categoria: 'Bug',
      Usuário: 'ana@example.com',
      Plano: 'pro',
      Rota: '/question-bank',
      Idioma: 'pt',
      Navegador: 'Mozilla/5.0 (Macintosh)',
    });
  });

  it('campos de contexto ausentes aparecem como travessão', () => {
    const rows = rowsOf(
      buildFeedbackAlert({ ...FEEDBACK, email: null, plan: null, route: null, locale: null, userAgent: null })
    );

    expect(rows).toMatchObject({ Usuário: 'Desconhecido', Plano: '—', Rota: '—', Idioma: '—', Navegador: '—' });
  });

  it('a mensagem vai no corpo', () => {
    expect(buildFeedbackAlert(FEEDBACK).body).toBe(FEEDBACK.message);
  });

  it('Q-04: responde para o e-mail do usuário', () => {
    expect(buildFeedbackAlert(FEEDBACK).replyTo).toBe('ana@example.com');
  });

  it('Q-04: sem e-mail do usuário não define replyTo', () => {
    expect(buildFeedbackAlert({ ...FEEDBACK, email: null }).replyTo).toBeUndefined();
  });

  it('RN-21: mensagem, rota e navegador passam pelo escape do HTML', () => {
    const { html } = buildInternalAlert(
      buildFeedbackAlert({
        ...FEEDBACK,
        message: '<img src=x onerror=alert(1)>',
        route: '/<script>',
        userAgent: '"><svg>',
      })
    );

    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('"><svg>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('EmailService.sendInternalAlert', () => {
  let warn: MockInstance<typeof console.warn>;

  const warnedEvents = () => warn.mock.calls.map(([line]) => JSON.parse(String(line)).event);

  beforeEach(() => {
    send.mockReset();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_FROM_EMAIL', 'no-reply@certifiqueai.test');
    vi.stubEnv('FEEDBACK_INBOX_EMAIL', INBOX);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('envia para o endereço configurado e devolve true quando o Resend confirma', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const sent = await new EmailService().sendInternalAlert(ALERT);

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: INBOX,
        from: expect.stringContaining('no-reply@certifiqueai.test'),
        subject: '[CertifiqueAI] Reporte de questão — Gabarito errado',
        html: expect.stringContaining('AWS SAA-C03'),
        text: expect.stringContaining('Exame: AWS SAA-C03'),
      })
    );
  });

  it('RN-20: sem FEEDBACK_INBOX_EMAIL não envia nada, devolve false e avisa no log', async () => {
    vi.stubEnv('FEEDBACK_INBOX_EMAIL', '');

    const sent = await new EmailService().sendInternalAlert(ALERT);

    expect(sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(warnedEvents()).toEqual(['email.internal_alert_skipped']);
  });

  it('RN-20: uma variável só com espaços conta como ausente', async () => {
    vi.stubEnv('FEEDBACK_INBOX_EMAIL', '   ');

    expect(await new EmailService().sendInternalAlert(ALERT)).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('RN-20: lê a variável a cada envio, sem fixá-la na construção', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    const service = new EmailService();

    expect(await service.sendInternalAlert(ALERT)).toBe(true);

    vi.stubEnv('FEEDBACK_INBOX_EMAIL', '');

    expect(await service.sendInternalAlert(ALERT)).toBe(false);
  });

  it('RN-19: erro devolvido pelo Resend vira false e log, sem lançar', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'domínio não verificado' } });

    await expect(new EmailService().sendInternalAlert(ALERT)).resolves.toBe(false);
    expect(warnedEvents()).toEqual(['email.internal_alert_failed']);
  });

  it('sendQuestionReportAlert envia o reporte montado para o endereço configurado', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const sent = await new EmailService().sendQuestionReportAlert({
      report: {
        examQuestionId: 12,
        reason: 'typo',
        surface: 'question_bank',
        examName: 'AWS SAA-C03',
        sectionName: 'Design',
        topicName: null,
        questionText: 'Enunciado',
        comment: null,
      },
      reopened: false,
      reporter: { email: 'ana@example.com', plan: 'pro' },
    });

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: INBOX,
        subject: '[CertifiqueAI] Reporte de questão — Erro de português ou digitação',
        text: expect.stringContaining('Usuário: ana@example.com'),
      })
    );
  });

  it('RN-19: exceção do Resend (rede fora do ar) vira false e log, sem lançar', async () => {
    send.mockRejectedValue(new Error('ECONNRESET'));

    await expect(new EmailService().sendInternalAlert(ALERT)).resolves.toBe(false);
    expect(warnedEvents()).toEqual(['email.internal_alert_failed']);
  });
  it('Q-04: repassa o replyTo ao Resend quando o alerta o define', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    await new EmailService().sendInternalAlert({ ...ALERT, replyTo: 'ana@example.com' });

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: INBOX, replyTo: 'ana@example.com' }));
  });

  it('Q-04: sem replyTo o campo não é enviado ao Resend', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    await new EmailService().sendInternalAlert(ALERT);

    expect(send.mock.calls[0][0]).not.toHaveProperty('replyTo');
  });

  it('sendFeedbackAlert envia o feedback montado, respondendo para o usuário', async () => {
    send.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const sent = await new EmailService().sendFeedbackAlert({
      category: 'suggestion',
      message: 'Filtrar simulados por data.',
      email: 'ana@example.com',
      plan: 'pro',
      route: '/simulados',
      locale: 'pt',
      userAgent: null,
    });

    expect(sent).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: INBOX,
        replyTo: 'ana@example.com',
        subject: '[CertifiqueAI] Feedback — Sugestão',
        text: expect.stringContaining('Filtrar simulados por data.'),
      })
    );
  });
});
