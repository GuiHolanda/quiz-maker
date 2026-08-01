import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

test.describe('empty states', () => {
  test('simulados list shows empty state when there are none', async ({ authedPage: page }) => {
    // Simulados for both verticals now come from a single source: getMockExams() → GET /api/mock-exams.
    await page.route('**/api/mock-exams', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ mockExams: [] }),
        });
      } else {
        route.continue();
      }
    });
    await page.goto('/simulados');
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
  });

  test('certifications list shows empty state when there are none', async ({ authedPage: page }) => {
    // The configure page's ExamsProvider fetches getExams() → GET /api/exam/exams.
    await page.route('**/api/exam/exams', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ exams: [] }),
        });
      } else {
        route.continue();
      }
    });
    await page.goto('/certifications/configure');
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
  });
});
