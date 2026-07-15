import { test as base, Page } from '@playwright/test';
import {
  mockCertificationQuestions,
  mockPublicExamQuestions,
  mockAnswersResponse,
  mockFinishAttemptResponse,
  mockCertSimuladoResult,
  mockMockExamResult,
} from './mock-data';

type AuthFixtures = {
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    // ── Certification mocks ────────────────────────────────────────────────

    await page.route('**/api/certification/question-generator**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCertificationQuestions),
      });
    });

    // ensure-answers — always returns generated:0 (idempotent stub)
    await page.route('**/api/certification-simulados/**/answers', (route) => {
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

    // finishAttempt (PATCH) and result (GET) for cert simulados.
    // The server-side finishAttempt calls ensureAnswers when Answer rows are missing,
    // which would make a real OpenAI call in tests. Intercepting the PATCH prevents that.
    // The GET stub lets the result page render without hitting the real DB result.
    await page.route('**/api/certification-simulados/**/attempts/**', (route) => {
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
          body: JSON.stringify(mockCertSimuladoResult),
        });
      } else {
        route.continue();
      }
    });

    // ── Public exam mocks ──────────────────────────────────────────────────

    await page.route('**/api/public-exam/question-generator**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPublicExamQuestions),
      });
    });

    // ensure-answers for mock exams
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

    // finishAttempt (PATCH) and result (GET) for mock exams
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

    await use(page);
  },
});

export { expect } from '@playwright/test';
