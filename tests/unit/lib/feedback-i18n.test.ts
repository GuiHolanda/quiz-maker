import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FEEDBACK_CATEGORIES, QUESTION_REPORT_REASONS } from '@/config/constants';
import { WORKSPACE_MESSAGE_PREFIXES } from '@/config/i18n-prefixes';
import { parseProperties } from '@/lib/i18n/properties-parser';
import { resolveFeedbackError, type FeedbackErrorKind } from '@/lib/feedback-error';

const load = (language: 'pt' | 'en') =>
  parseProperties(readFileSync(join(process.cwd(), 'public', 'messages', `${language}.properties`), 'utf-8'));

const pt = load('pt');
const en = load('en');
const feedbackKeys = (messages: Record<string, string>) =>
  Object.keys(messages)
    .filter((key) => key.startsWith('feedback.'))
    .sort();

const EXPECTED_KEYS = [
  'reportQuestion',
  'reportQuestionAria',
  'reportModalTitle',
  'reportModalSubtitle',
  'reasonLabel',
  'reasonWrongAnswerKey',
  'reasonAmbiguousStatement',
  'reasonOutOfScope',
  'reasonTypo',
  'reasonDuplicateOptions',
  'reasonOther',
  'commentLabel',
  'commentPlaceholder',
  'commentHelper',
  'commentTooLong',
  'reasonRequired',
  'submitReport',
  'reportSuccessTitle',
  'reportSuccessDescription',
  'reportErrorTitle',
  'reportErrorDescription',
  'alreadyReportedTitle',
  'alreadyReportedDescription',
  'rateLimitedTitle',
  'rateLimitedDescription',
  'navLabel',
  'widgetAria',
  'widgetTitle',
  'widgetSubtitle',
  'categoryLabel',
  'categoryBug',
  'categorySuggestion',
  'categoryPraise',
  'categoryQuestion',
  'messageLabel',
  'messagePlaceholder',
  'messageRequired',
  'messageTooLong',
  'contextNotice',
  'send',
  'sendSuccessTitle',
  'sendSuccessDescription',
  'sendErrorTitle',
  'sendErrorDescription',
].map((name) => `feedback.${name}`);

describe('i18n do feedback', () => {
  it('RF-07: contém exatamente as chaves previstas no SDD, em português', () => {
    expect(feedbackKeys(pt)).toEqual([...EXPECTED_KEYS].sort());
  });

  it('RF-07: português e inglês têm exatamente as mesmas chaves', () => {
    expect(feedbackKeys(en)).toEqual(feedbackKeys(pt));
  });

  it.each([
    ['português', pt],
    ['inglês', en],
  ])('RF-07: nenhuma chave está vazia em %s', (_language, messages) => {
    const empty = feedbackKeys(messages).filter((key) => !messages[key]?.trim());

    expect(empty).toEqual([]);
  });

  it('RF-07: os placeholders {max} são os mesmos nos dois idiomas', () => {
    const withMax = (messages: Record<string, string>) =>
      feedbackKeys(messages).filter((key) => messages[key].includes('{max}'));

    expect(withMax(en)).toEqual(withMax(pt));
    expect(withMax(pt)).toEqual(['feedback.commentHelper', 'feedback.commentTooLong', 'feedback.messageTooLong']);
  });

  it('RF-07: todo motivo de reporte aponta para um rótulo que existe nos dois idiomas', () => {
    const missing = QUESTION_REPORT_REASONS.filter(({ labelKey }) => !pt[labelKey] || !en[labelKey]);

    expect(missing).toEqual([]);
  });

  it('RF-07: toda categoria de feedback aponta para um rótulo que existe nos dois idiomas', () => {
    const missing = FEEDBACK_CATEGORIES.filter(({ labelKey }) => !pt[labelKey] || !en[labelKey]);

    expect(missing).toEqual([]);
  });

  it('RF-07: toda chave que o resolvedor de erro pode devolver existe nos dois idiomas', () => {
    const kinds: FeedbackErrorKind[] = ['question_report', 'feedback'];
    const errors = [
      { response: { status: 429, data: { code: 'rate_limited' } } },
      { response: { status: 409, data: { code: 'already_reported' } } },
      { response: { status: 500, data: {} } },
      new Error('Network Error'),
    ];
    const returned = kinds.flatMap((kind) =>
      errors.flatMap((err) => {
        const { titleKey, descriptionKey } = resolveFeedbackError(err, kind);

        return [titleKey, descriptionKey];
      })
    );
    const missing = returned.filter((key) => !pt[key] || !en[key]);

    expect(missing).toEqual([]);
  });

  it('o workspace declara o prefixo feedback; sem isso a tela mostraria a chave crua', () => {
    expect(WORKSPACE_MESSAGE_PREFIXES).toContain('feedback');
  });
});
