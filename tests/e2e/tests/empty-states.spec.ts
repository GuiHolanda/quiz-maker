import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

test.describe('empty states', () => {
  test('simulados list shows empty state when there are none', async ({ authedPage: page }) => {
    // Mock the simulados list endpoints to return empty arrays.
    // getCertSimulados() fetches GET /api/certification-simulados
    // getMockExams() fetches GET /api/mock-exams
    await page.route('**/api/certification-simulados', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ simulados: [] }),
        });
      } else {
        route.continue();
      }
    });
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
    // Mock the certifications list endpoint.
    // getCertifications() fetches GET /api/certification/certifications
    await page.route('**/api/certification/certifications', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ certifications: [] }),
        });
      } else {
        route.continue();
      }
    });
    await page.goto('/certifications/configure');
    await page.locator(tid(TID.wizardTabMine)).click();
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
  });
});
