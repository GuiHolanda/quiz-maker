import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/auth.fixture';
import { mockMockExamResult } from '../fixtures/mock-data';
import { clearQuestionReports, findFeedback, findQuestionReports, seedCertQuestions } from '../support/db-seed';
import { ALL_DOMAINS } from '../support/journey-config';
import { dismissNotificationDialog, exitAndDiscardAttempt, pickSimuladoScopeAndExam } from '../support/flows';
import { tid, TID } from '../support/selectors';

const REPORT_URL = '**/api/feedback/question-report';
const REPORT_SENT = /Reporte enviado|Report sent/i;
const ALREADY_REPORTED = /Você já reportou esta questão|You already reported this question/i;
const REASON_WRONG_KEY = /gabarito está errado|answer key is wrong/i;
const REASON_REQUIRED = /Escolha um motivo para continuar|Choose a reason to continue/i;
const COMMENT_TOO_LONG = /no máximo 1000|at most 1000/i;
const FEEDBACK_URL = '**/api/feedback';
const FEEDBACK_SENT = /Feedback enviado|Feedback sent/i;
const CATEGORY_BUG = /Algo não funciona|Something isn't working/i;
const CATEGORY_SUGGESTION = /^(Sugestão|Suggestion)$/i;
const CATEGORY_REQUIRED = /Escolha sobre o que é o feedback|Choose what the feedback is about/i;
const MESSAGE_REQUIRED = /Escreva uma mensagem para continuar|Write a message to continue/i;
const OPEN_MENU = /Abrir menu|Open menu/i;
const CONTEXT_NOTICE = /Enviamos junto a página|We send along the page/i;

const domain = ALL_DOMAINS[0];

async function pickWrongAnswerKeyReason(page: Page) {
  const reason = page.getByRole('radio', { name: REASON_WRONG_KEY });

  await reason.dispatchEvent('click');
  await expect(reason).toBeChecked();
}

async function pickCategory(page: Page, name: RegExp) {
  const category = page.getByRole('radio', { name });

  await category.dispatchEvent('click');
  await expect(category).toBeChecked();
}

test.describe('report a question', () => {
  test.beforeEach(async () => {
    await clearQuestionReports();
  });

  test('reports from the question bank, then is told the question was already reported', async ({
    authedPage: page,
  }) => {
    const text = `REPORT_BANK_${Date.now()}: which service stores objects?`;

    await seedCertQuestions([text]);
    await page.goto('/question-bank');
    await page.locator(tid(TID.questionBankSearch)).fill('REPORT_BANK_');

    const card = page.locator(tid(TID.questionBankCard)).filter({ hasText: text });
    const modal = page.locator(tid(TID.questionReportModal));

    await expect(card).toBeVisible();
    await card.locator(tid(TID.questionReportBtn)).click();
    await expect(modal).toBeVisible();

    await page.locator(tid(TID.questionReportSubmitBtn)).click();
    await expect(page.getByText(REASON_REQUIRED)).toBeVisible();

    await pickWrongAnswerKeyReason(page);
    await page.locator(tid(TID.questionReportComment)).fill('O gabarito indica B, mas a correta é A.');
    await page.locator(tid(TID.questionReportSubmitBtn)).click();

    await expect(page.getByText(REPORT_SENT)).toBeVisible();
    await expect(modal).toBeHidden();

    const [saved, ...others] = await findQuestionReports({ questionText: text });

    expect(others).toHaveLength(0);
    expect(saved).toMatchObject({
      reason: 'wrong_answer_key',
      comment: 'O gabarito indica B, mas a correta é A.',
      surface: 'question_bank',
      status: 'open',
      mockExamAttemptId: null,
      notifiedAt: null,
    });

    await card.locator(tid(TID.questionReportBtn)).click();
    await pickWrongAnswerKeyReason(page);
    await page.locator(tid(TID.questionReportSubmitBtn)).click();

    await expect(page.getByText(ALREADY_REPORTED)).toBeVisible();
    await expect(modal).toBeVisible();
    expect(await findQuestionReports({ questionText: text })).toHaveLength(1);
  });

  test('blocks a comment over the limit without calling the API', async ({ authedPage: page }) => {
    const text = `REPORT_LIMIT_${Date.now()}: which service runs functions?`;
    let requests = 0;

    await page.route(REPORT_URL, (route) => {
      requests += 1;

      return route.fallback();
    });
    await seedCertQuestions([text]);
    await page.goto('/question-bank');
    await page.locator(tid(TID.questionBankSearch)).fill('REPORT_LIMIT_');
    await page.locator(tid(TID.questionBankCard)).filter({ hasText: text }).locator(tid(TID.questionReportBtn)).click();

    await pickWrongAnswerKeyReason(page);
    await page.locator(tid(TID.questionReportComment)).fill('a'.repeat(1001));
    await page.locator(tid(TID.questionReportSubmitBtn)).click();

    await expect(page.getByText(COMMENT_TOO_LONG)).toBeVisible();
    await expect(page.locator(tid(TID.questionReportModal))).toBeVisible();
    expect(requests).toBe(0);
  });

  test('reports from inside a timed simulado without stopping the clock or leaving the attempt', async ({
    authedPage: page,
  }) => {
    await page.goto('/simulados');
    await dismissNotificationDialog(page);
    await pickSimuladoScopeAndExam(page, domain);

    const totalInput = page.locator(tid(TID.simuladoTotalInput));

    await totalInput.fill('');
    await totalInput.fill('3');
    await page.locator(tid(TID.simuladoTimePersonalizado)).click();
    await page.locator(tid(TID.simuladoCustomMinutesInput)).fill('15');
    await page.locator(tid(TID.simuladoCreateBtn)).click();
    await page.locator(tid(TID.simuladoGenerationStartBtn)).click({ timeout: 20_000 });
    await page.waitForURL(/\/tentativa\/\d+/);

    const attemptId = Number(page.url().match(/tentativa\/(\d+)/)?.[1]);
    const timer = page.locator(tid(TID.simuladoTimer));
    const modal = page.locator(tid(TID.questionReportModal));

    await expect(timer).toBeVisible();
    await page.locator(tid(TID.questionReportBtn)).click();
    await expect(modal).toBeVisible();

    const timeWhenOpened = await timer.textContent();

    await expect.poll(() => timer.textContent(), { timeout: 10_000 }).not.toBe(timeWhenOpened);

    await pickWrongAnswerKeyReason(page);
    await page.locator(tid(TID.questionReportComment)).fill('a b c d');
    await expect(page.locator(`${tid(TID.attemptOption)}[aria-checked="true"]`)).toHaveCount(0);
    await page.locator(tid(TID.questionReportSubmitBtn)).click();

    await expect(page.getByText(REPORT_SENT)).toBeVisible();
    await expect(modal).toBeHidden();
    await expect(page).toHaveURL(/\/tentativa\/\d+/);
    await expect(page.locator(tid(TID.attemptDiscardLink))).toHaveCount(0);

    const [saved] = await findQuestionReports({ mockExamAttemptId: attemptId });

    expect(saved).toMatchObject({ surface: 'attempt', reason: 'wrong_answer_key', status: 'open' });

    await exitAndDiscardAttempt(page);
  });

  test('reports from the review of a finished simulado, sending the attempt it came from', async ({
    authedPage: page,
  }) => {
    const [firstQuestion] = mockMockExamResult.questions;
    let sent: unknown = null;

    await page.route(REPORT_URL, (route) => {
      sent = route.request().postDataJSON();

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'stub-report', status: 'open', createdAt: new Date().toISOString() }),
      });
    });

    await page.goto('/simulados/1/resultado/1');
    await dismissNotificationDialog(page);
    await page
      .getByRole('button', { name: new RegExp(firstQuestion.examQuestion.text.slice(0, 24)) })
      .first()
      .click();
    await page.locator(tid(TID.questionReportBtn)).first().click();

    await pickWrongAnswerKeyReason(page);
    await page.locator(tid(TID.questionReportSubmitBtn)).click();

    await expect(page.getByText(REPORT_SENT)).toBeVisible();
    expect(sent).toMatchObject({
      examQuestionId: firstQuestion.examQuestion.id,
      reason: 'wrong_answer_key',
      surface: 'review',
      mockExamAttemptId: 1,
    });
  });

  test('does not accept a report from an anonymous caller', async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const response = await anonymous.post('/api/feedback/question-report', {
      data: { examQuestionId: 1, reason: 'typo', surface: 'question_bank' },
      maxRedirects: 0,
    });

    expect(response.ok()).toBe(false);
    await anonymous.dispose();
  });
});

test.describe('send feedback', () => {
  test('sends feedback from the header, with plan, email and browser filled in by the server', async ({
    authedPage: page,
  }) => {
    const message = `FEEDBACK_E2E_${Date.now()}: o filtro do banco de questões não limpa.`;
    const modal = page.locator(tid(TID.feedbackModal));

    await page.goto('/question-bank');
    await page.locator(tid(TID.feedbackWidgetBtn)).click();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(CONTEXT_NOTICE);

    await page.locator(tid(TID.feedbackSubmitBtn)).click();
    await expect(page.getByText(CATEGORY_REQUIRED)).toBeVisible();
    await expect(page.getByText(MESSAGE_REQUIRED)).toBeVisible();

    await pickCategory(page, CATEGORY_BUG);
    await page.locator(tid(TID.feedbackMessage)).fill(message);
    await page.locator(tid(TID.feedbackSubmitBtn)).click();

    await expect(page.getByText(FEEDBACK_SENT)).toBeVisible();
    await expect(modal).toBeHidden();

    const [saved, ...others] = await findFeedback({ message });

    expect(others).toHaveLength(0);
    expect(saved).toMatchObject({
      category: 'bug',
      message,
      route: '/question-bank',
      status: 'open',
      notifiedAt: null,
    });
    expect(['pt', 'en']).toContain(saved.locale);
    expect(saved.email).toBeTruthy();
    expect(saved.plan).toBeTruthy();
    expect(saved.userAgent).toContain('Mozilla');
  });

  test('keeps the draft when the backdrop is clicked by accident', async ({ authedPage: page }) => {
    const draft = 'Um parágrafo longo que eu não quero reescrever.';
    const modal = page.locator(tid(TID.feedbackModal));

    await page.goto('/question-bank');
    await page.locator(tid(TID.feedbackWidgetBtn)).click();
    await page.locator(tid(TID.feedbackMessage)).fill(draft);
    await page.mouse.click(5, 5);
    await page.waitForTimeout(1_000);

    await expect(modal).toBeVisible();
    await expect(page.locator(tid(TID.feedbackMessage))).toHaveValue(draft);
  });

  test('opens the feedback dialog from the mobile drawer, where the header is hidden', async ({ authedPage: page }) => {
    let sent: unknown = null;

    await page.route(FEEDBACK_URL, (route) => {
      sent = route.request().postDataJSON();

      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'stub' }) });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/question-bank');

    await expect(page.locator(tid(TID.feedbackWidgetBtn))).toBeHidden();
    await page.getByRole('button', { name: OPEN_MENU }).click();
    await page.locator(`${tid(TID.feedbackSidebarBtn)}:visible`).click();
    await expect(page.locator(tid(TID.feedbackModal))).toBeVisible();

    await pickCategory(page, CATEGORY_SUGGESTION);
    await page.locator(tid(TID.feedbackMessage)).fill('Queria filtrar simulados por data.');
    await page.locator(tid(TID.feedbackSubmitBtn)).click();

    await expect(page.getByText(FEEDBACK_SENT)).toBeVisible();
    expect(sent).toMatchObject({
      category: 'suggestion',
      message: 'Queria filtrar simulados por data.',
      route: '/question-bank',
    });
  });

  test('does not accept feedback from an anonymous caller', async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const response = await anonymous.post('/api/feedback', {
      data: { category: 'bug', message: 'anônimo' },
      maxRedirects: 0,
    });

    expect(response.ok()).toBe(false);
    await anonymous.dispose();
  });
});
