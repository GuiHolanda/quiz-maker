import { test, expect } from '../fixtures/auth.fixture';
import { mockMockExamResult } from '../fixtures/mock-data';
import { tid, TID } from '../support/selectors';
import { dismissNotificationDialog } from '../support/flows';

const RESULT_URL = '/simulados/1/resultado/1';

function resultWithoutGabarito(questionIndexes: number[]) {
  return {
    ...mockMockExamResult,
    questions: mockMockExamResult.questions.map((question, index) =>
      questionIndexes.includes(index)
        ? { ...question, examQuestion: { ...question.examQuestion, answer: null } }
        : question
    ),
  };
}

test.describe('simulado result — gabarito and load errors', () => {
  test('hides the score and offers a retry when questions still lack their gabarito', async ({ authedPage: page }) => {
    let resultRequests = 0;

    await page.route('**/api/mock-exams/**/attempts/**', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      resultRequests += 1;

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resultWithoutGabarito([0, 1])) });
    });
    await page.route('**/api/mock-exams/**/answers', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ generated: 0, remaining: 2 }) })
    );

    await page.goto(RESULT_URL);
    await dismissNotificationDialog(page);

    const notice = page.locator(tid(TID.emptyState));

    await expect(notice).toBeVisible({ timeout: 15_000 });
    await expect(notice).toContainText('2');
    await expect(page.locator(tid(TID.resultPercent))).toHaveCount(0);

    const requestsBeforeRetry = resultRequests;

    await notice.getByRole('button', { name: /tentar novamente|try again/i }).click();
    await expect.poll(() => resultRequests).toBeGreaterThan(requestsBeforeRetry);
  });

  test('completes the gabarito before showing the result', async ({ authedPage: page }) => {
    let gabaritoReady = false;

    await page.route('**/api/mock-exams/**/attempts/**', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(gabaritoReady ? mockMockExamResult : resultWithoutGabarito([0, 1])),
      });
    });
    await page.route('**/api/mock-exams/**/answers', (route) => {
      gabaritoReady = true;

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ generated: 2, remaining: 0 }) });
    });

    await page.goto(RESULT_URL);
    await dismissNotificationDialog(page);

    await expect(page.locator(tid(TID.resultPercent))).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(tid(TID.emptyState))).toHaveCount(0);
  });

  test('shows an error with a retry when the result cannot be loaded, then recovers', async ({ authedPage: page }) => {
    let resultRequests = 0;

    await page.route('**/api/mock-exams/**/attempts/**', (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      resultRequests += 1;

      if (resultRequests === 1) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Database error' }) });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMockExamResult) });
    });

    await page.goto(RESULT_URL);
    await dismissNotificationDialog(page);

    const errorState = page.locator(tid(TID.emptyState));

    await expect(errorState).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(tid(TID.resultPercent))).toHaveCount(0);

    await errorState.getByRole('button', { name: /tentar novamente|try again/i }).click();

    await expect(page.locator(tid(TID.resultPercent))).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(tid(TID.emptyState))).toHaveCount(0);
  });
});
