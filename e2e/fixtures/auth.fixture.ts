import { test as base, Page } from '@playwright/test';
import { mockCertificationQuestions, mockPublicExamQuestions, mockAnswersResponse } from './mock-data';

type AuthFixtures = {
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    // Mock certification question generation
    await page.route('**/api/certification/question-generator**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCertificationQuestions),
      });
    });

    // Mock cert answers (ensure-answers endpoint)
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

    // Mock public exam question generation
    await page.route('**/api/public-exam/question-generator**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPublicExamQuestions),
      });
    });

    // Mock mock-exam answers (ensure-answers endpoint)
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

    await use(page);
  },
});

export { expect } from '@playwright/test';
