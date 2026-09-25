import { afterEach, beforeEach, vi, type MockInstance } from 'vitest';

import { buildInternalAlert, EmailService, escapeHtml } from '@/features/services/email.service';

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

  it('RN-19: exceção do Resend (rede fora do ar) vira false e log, sem lançar', async () => {
    send.mockRejectedValue(new Error('ECONNRESET'));

    await expect(new EmailService().sendInternalAlert(ALERT)).resolves.toBe(false);
    expect(warnedEvents()).toEqual(['email.internal_alert_failed']);
  });
});
