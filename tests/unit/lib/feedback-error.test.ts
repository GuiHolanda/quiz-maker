import { resolveFeedbackError } from '@/lib/feedback-error';

const httpError = (status: number, data: Record<string, unknown> = {}) => ({ response: { status, data } });

describe('resolveFeedbackError', () => {
  describe('muitos envios', () => {
    it('RN-25: HTTP 429 vira "muitos envios"', () => {
      expect(resolveFeedbackError(httpError(429), 'feedback')).toEqual({
        titleKey: 'feedback.rateLimitedTitle',
        descriptionKey: 'feedback.rateLimitedDescription',
      });
    });

    it('RN-25: o código rate_limited vira "muitos envios" mesmo que o status venha diferente', () => {
      const err = httpError(500, { code: 'rate_limited' });

      expect(resolveFeedbackError(err, 'question_report').titleKey).toBe('feedback.rateLimitedTitle');
    });
  });

  describe('já reportada', () => {
    it('RN-25: already_reported no reporte vira "já reportada"', () => {
      const err = httpError(409, { code: 'already_reported' });

      expect(resolveFeedbackError(err, 'question_report')).toEqual({
        titleKey: 'feedback.alreadyReportedTitle',
        descriptionKey: 'feedback.alreadyReportedDescription',
      });
    });

    it('RN-25: already_reported não existe no feedback geral e cai no erro genérico dele', () => {
      const err = httpError(409, { code: 'already_reported' });

      expect(resolveFeedbackError(err, 'feedback').titleKey).toBe('feedback.sendErrorTitle');
    });

    it('RN-25: um 409 sem código (violação de unicidade genérica) é erro genérico, não "já reportada"', () => {
      expect(resolveFeedbackError(httpError(409), 'question_report').titleKey).toBe('feedback.reportErrorTitle');
    });
  });

  describe('erro genérico por tipo', () => {
    it.each([
      ['question_report', 'feedback.reportErrorTitle', 'feedback.reportErrorDescription'],
      ['feedback', 'feedback.sendErrorTitle', 'feedback.sendErrorDescription'],
    ] as const)('RN-25: %s cai em %s', (kind, titleKey, descriptionKey) => {
      expect(resolveFeedbackError(httpError(500), kind)).toEqual({ titleKey, descriptionKey });
    });

    it.each([
      ['erro de rede sem resposta', new Error('Network Error')],
      ['undefined', undefined],
      ['null', null],
      ['string solta', 'boom'],
    ])('RN-25: %s cai no erro genérico', (_label, err) => {
      expect(resolveFeedbackError(err, 'feedback').titleKey).toBe('feedback.sendErrorTitle');
    });
  });

  it('RN-25: nunca repassa a mensagem do servidor, só chaves do namespace feedback', () => {
    const err = httpError(429, { code: 'rate_limited', message: 'Muitas requisições. Tente novamente em 30s.' });
    const { titleKey, descriptionKey } = resolveFeedbackError(err, 'feedback');

    expect([titleKey, descriptionKey].every((key) => key.startsWith('feedback.'))).toBe(true);
  });
});
