import {
  feedbackReducer,
  INITIAL_FEEDBACK_STATE,
  type FeedbackState,
  type QuestionReportTarget,
} from '@/features/reducers/feedback.reducer';

const BANK_TARGET: QuestionReportTarget = { examQuestionId: 12, surface: 'question_bank' };
const REVIEW_TARGET: QuestionReportTarget = { examQuestionId: 30, surface: 'review', mockExamAttemptId: 5 };

const reportOpen: FeedbackState = { reportTarget: BANK_TARGET, isFeedbackOpen: false, isBusy: false };
const feedbackOpen: FeedbackState = { reportTarget: null, isFeedbackOpen: true, isBusy: false };
const whileSending = (state: FeedbackState): FeedbackState => ({ ...state, isBusy: true });

describe('feedbackReducer', () => {
  it('começa com tudo fechado e sem envio em andamento', () => {
    expect(INITIAL_FEEDBACK_STATE).toEqual({ reportTarget: null, isFeedbackOpen: false, isBusy: false });
  });

  describe('abrir', () => {
    it('RN-23: abre o reporte com o alvo informado', () => {
      const next = feedbackReducer(INITIAL_FEEDBACK_STATE, { type: 'openQuestionReport', payload: REVIEW_TARGET });

      expect(next).toEqual({ reportTarget: REVIEW_TARGET, isFeedbackOpen: false, isBusy: false });
    });

    it('RN-23: abre o feedback geral', () => {
      const next = feedbackReducer(INITIAL_FEEDBACK_STATE, { type: 'openFeedback' });

      expect(next).toEqual({ reportTarget: null, isFeedbackOpen: true, isBusy: false });
    });

    it('RN-23: abrir o feedback fecha o reporte que estava aberto', () => {
      const next = feedbackReducer(reportOpen, { type: 'openFeedback' });

      expect(next).toEqual(feedbackOpen);
    });

    it('RN-23: abrir o reporte fecha o feedback que estava aberto', () => {
      const next = feedbackReducer(feedbackOpen, { type: 'openQuestionReport', payload: BANK_TARGET });

      expect(next).toEqual(reportOpen);
    });

    it('RN-23: reportar outra questão com o reporte aberto troca o alvo', () => {
      const next = feedbackReducer(reportOpen, { type: 'openQuestionReport', payload: REVIEW_TARGET });

      expect(next.reportTarget).toEqual(REVIEW_TARGET);
    });

    it('RN-23: ignora abrir o reporte enquanto há envio em andamento', () => {
      const sending = whileSending(feedbackOpen);

      expect(feedbackReducer(sending, { type: 'openQuestionReport', payload: BANK_TARGET })).toBe(sending);
    });

    it('RN-23: ignora abrir o feedback enquanto há envio em andamento', () => {
      const sending = whileSending(reportOpen);

      expect(feedbackReducer(sending, { type: 'openFeedback' })).toBe(sending);
    });
  });

  describe('enviar', () => {
    it('RN-23: marca o envio em andamento quando há um reporte aberto', () => {
      expect(feedbackReducer(reportOpen, { type: 'submitStarted' })).toEqual(whileSending(reportOpen));
    });

    it('RN-23: marca o envio em andamento quando há um feedback aberto', () => {
      expect(feedbackReducer(feedbackOpen, { type: 'submitStarted' })).toEqual(whileSending(feedbackOpen));
    });

    it('RN-23: ignora o início de envio sem nenhum diálogo aberto', () => {
      expect(feedbackReducer(INITIAL_FEEDBACK_STATE, { type: 'submitStarted' })).toBe(INITIAL_FEEDBACK_STATE);
    });

    it('RN-24: a falha libera o envio e mantém o reporte aberto para nova tentativa', () => {
      const next = feedbackReducer(whileSending(reportOpen), { type: 'submitFailed' });

      expect(next).toEqual(reportOpen);
    });

    it('RN-24: a falha libera o envio e mantém o feedback aberto para nova tentativa', () => {
      const next = feedbackReducer(whileSending(feedbackOpen), { type: 'submitFailed' });

      expect(next).toEqual(feedbackOpen);
    });

    it('RN-23: o sucesso volta ao estado inicial, inclusive limpando o envio em andamento', () => {
      const next = feedbackReducer(whileSending(reportOpen), { type: 'submitSucceeded' });

      expect(next).toEqual(INITIAL_FEEDBACK_STATE);
    });
  });

  describe('fechar', () => {
    it('fecha o reporte', () => {
      expect(feedbackReducer(reportOpen, { type: 'close' })).toEqual(INITIAL_FEEDBACK_STATE);
    });

    it('fecha o feedback', () => {
      expect(feedbackReducer(feedbackOpen, { type: 'close' })).toEqual(INITIAL_FEEDBACK_STATE);
    });

    it('RN-23: ignora fechar enquanto há envio em andamento', () => {
      const sending = whileSending(reportOpen);

      expect(feedbackReducer(sending, { type: 'close' })).toBe(sending);
    });
  });
});
