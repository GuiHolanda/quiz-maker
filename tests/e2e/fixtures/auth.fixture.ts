import { test as base, Page } from '@playwright/test';
import {
  mockCertificationQuestions,
  mockPublicExamQuestions,
  mockAnswersResponse,
  mockFinishAttemptResponse,
  mockCertSimuladoResult,
  mockMockExamResult,
} from './mock-data';
import { E2E_CERT_KEY, E2E_CERT_LABEL, E2E_CERT_TOPIC, E2E_PUBLIC_EXAM_NAME, E2E_EXAM_BOARD, E2E_SUBJECT } from '../support/constants';

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

    // ── Browse summary mocks — let NewCertSimuladoForm / NewMockExamForm
    //    render the creation form instead of the EmptyState.
    //    Without these mocks, totalSavedQuestions stays null until the real
    //    DB responds, and the form may show a skeleton or empty state.
    await page.route('**/api/certification/browse-questions/summary**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          certifications: [
            {
              key: E2E_CERT_KEY,
              label: E2E_CERT_LABEL,
              totalCount: 3,
              topics: [{ name: E2E_CERT_TOPIC, questionCount: 3 }],
            },
          ],
        }),
      });
    });

    await page.route('**/api/public-exam/browse-questions/summary**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          publicExams: [
            {
              id: 'e2e-exam-id',
              name: E2E_PUBLIC_EXAM_NAME,
              examBoardName: E2E_EXAM_BOARD,
              totalCount: 3,
              subjects: [{ name: E2E_SUBJECT, questionCount: 3 }],
            },
          ],
        }),
      });
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
