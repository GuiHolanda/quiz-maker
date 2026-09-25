import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';
import { dismissNotificationDialog } from '../support/flows';

const CONCURSO_NAME = 'E2E Concurso Only';
const NO_CERTIFICATIONS = /Nenhuma certificação criada ainda|No certifications yet/;

const onlyPublicExam = {
  id: 'e2e-concurso-only-id',
  type: 'public_exam',
  name: CONCURSO_NAME,
  role: 'Analista',
  totalQuestions: 10,
  examBoard: { id: 'e2e-board-id', name: 'CEBRASPE' },
  sections: [{ id: 'e2e-section-id', name: 'Direito Constitucional', minQuestions: 0, maxQuestions: 100, topics: [] }],
};

const selectedConcurso = (page: Page) => page.getByText(CONCURSO_NAME, { exact: true });

async function stubExams(page: Page, exams: readonly unknown[]) {
  await page.route('**/api/exam/exams', (route) => {
    if (route.request().method() !== 'GET') return route.continue();

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ exams }) });
  });
}

const stubUserWithOnlyAPublicExam = (page: Page) => stubExams(page, [onlyPublicExam]);

test.describe('generate questions — scope with only public exams', () => {
  test('opens on the public exam instead of the empty certification state', async ({ authedPage: page }) => {
    await stubUserWithOnlyAPublicExam(page);

    await page.goto('/questions');
    await dismissNotificationDialog(page);

    await expect(selectedConcurso(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(NO_CERTIFICATIONS)).toHaveCount(0);
  });

  test('keeps the type picker so the user can switch away from an empty requested scope', async ({ authedPage: page }) => {
    await stubUserWithOnlyAPublicExam(page);

    await page.goto('/questions?type=certification');
    await dismissNotificationDialog(page);

    await expect(page.getByText(NO_CERTIFICATIONS)).toBeVisible({ timeout: 15_000 });

    await page.locator(tid(TID.typeOptionPublicExam)).click();

    await expect(selectedConcurso(page)).toBeVisible();
    await expect(page.getByText(NO_CERTIFICATIONS)).toHaveCount(0);
  });

  test('ignores an unknown type in the URL instead of crashing the empty state', async ({ authedPage: page }) => {
    await stubExams(page, []);

    await page.goto('/questions?type=nonsense');
    await dismissNotificationDialog(page);

    await expect(page.getByText(NO_CERTIFICATIONS)).toBeVisible({ timeout: 15_000 });
  });
});
