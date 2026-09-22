import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

const EMPTY_HOME = {
  kpis: {
    streakDays: 0,
    questionsThisWeek: 0,
    questionsWeekDelta: 0,
    avgAccuracy: null,
    avgAccuracyDelta: null,
    simuladosTotal: 0,
    simuladosOpen: 0,
  },
  resume: null,
  examsInProgress: [],
  weakDomains: [],
  quickActions: { bankCount: 0, wrongOpenCount: 0 },
  activity: [],
};

test.describe('dashboard', () => {
  test('renders the início hub with data from the seeded attempt', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRoot))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardKpis))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardExamsProgress))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardQuickActions))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardActivity))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardCredits))).toBeVisible();

    // Seeded finished attempt (3 days ago) shows up in the activity feed.
    await expect(page.locator(tid(TID.dashboardActivity)).locator(tid(TID.emptyState))).toHaveCount(0);

    // No unfinished attempt is seeded, so the resume card is not rendered.
    await expect(page.locator(tid(TID.dashboardResume))).toHaveCount(0);

    // Seeded exams (cert + concurso) have saved questions, so they list here.
    await expect(page.locator(tid(TID.dashboardExamsProgress)).locator(tid(TID.emptyState))).toHaveCount(0);
  });

  test('shows empty states across the hub when the user has no data', async ({ authedPage: page }) => {
    await page.route('**/api/dashboard/stats', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_HOME) });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRoot))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardResume))).toHaveCount(0);
    await expect(page.locator(tid(TID.dashboardExamsProgress)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardWeakDomains)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardActivity)).locator(tid(TID.emptyState))).toBeVisible();
  });
});
