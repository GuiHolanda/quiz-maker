import { test as base, Page } from '@playwright/test';
import {
  mockAnswersResponse,
  mockFinishAttemptResponse,
  mockMockExamResult,
  mockBrowseSummary,
} from './mock-data';

type AuthFixtures = {
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    // ── Mock-exam answer/attempt mocks (shared by both verticals) ────────────
    // Simulados for certifications AND public exams now route through /api/mock-exams/*.

    // ensure-answers — always returns generated:0 (idempotent stub)
    await page.route('**/api/mock-exams/**/answers', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAnswersResponse),
        });
      } else {
        route.continue();
      }
    });

    // finishAttempt (PATCH) and result (GET) for mock exams.
    // The server-side finishAttempt calls ensureAnswers when Answer rows are missing,
    // which would make a real OpenAI call in tests. Intercepting the PATCH prevents that.
    // The GET stub lets the result page render without hitting the real DB result.
    await page.route('**/api/mock-exams/**/attempts/**', (route) => {
      const method = route.request().method();

      if (method === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockFinishAttemptResponse),
        });
      } else if (method === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMockExamResult),
        });
      } else {
        route.continue();
      }
    });

    // ── Generation job save mock ──────────────────────────────────────────
    await page.route('**/api/generation-job/*/save', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ savedCount: 5 }),
        });
      } else {
        route.continue();
      }
    });

    // ── Usage history mock (empty — avoids real DB reads) ─────────────────
    await page.route('**/api/usage/history**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, limit: 10 }),
      });
    });

    // ── Browse summary mock — lets NewMockExamForm render the creation form
    //    instead of the EmptyState. Without this, totalSavedQuestions stays null
    //    until the real DB responds, and the form may show a skeleton or empty state.
    //    Unified endpoint returns { exams: [{ id, name, type, referenceName, totalCount, sections }] }.
    await page.route('**/api/exam/browse-questions/summary**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBrowseSummary),
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
