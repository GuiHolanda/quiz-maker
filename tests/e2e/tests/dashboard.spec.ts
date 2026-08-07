import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

const EMPTY_STATS = {
  totalSimuladosCompleted: 0,
  bestScore: null,
  recentSessions: [],
  scoreTrend: [],
  domainBreakdown: [],
};

test.describe('dashboard', () => {
  test('shows all sections with data when completed attempts exist', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRoot))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardKpiRibbon))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardFocusAreas))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardRecentSessions))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardDomainBreakdown))).toBeVisible();

    // Seeded attempt (score=67) should appear as a session row
    await expect(page.locator(tid(TID.dashboardSessionRow)).first()).toBeVisible();
  });

  test('shows empty states in all sections when no attempts exist', async ({ authedPage: page }) => {
    await page.route('**/api/dashboard/stats', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(EMPTY_STATS),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRecentSessions)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardFocusAreas)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardDomainBreakdown)).locator(tid(TID.emptyState))).toBeVisible();
  });
});
