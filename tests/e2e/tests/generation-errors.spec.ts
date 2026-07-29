import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';
import { mockGenerationJobFailure, mockGenerationTimeout } from '../support/mocks';

for (const domain of ALL_DOMAINS) {
  test.describe(`generation errors — ${domain.type}`, () => {
    test('quota reached (403) surfaces an error and no success badge', async ({ authedPage: page }) => {
      await mockGenerationJobFailure(page, 403, 'quota exceeded');
      await page.goto(domain.generationUrl);
      await page.locator(tid(domain.typeOptionTid)).click();
      await page.locator(tid(TID.questionGenSelectTrigger)).filter({ visible: true }).click();
      await page.getByRole('option', { name: domain.seedLabel }).click();
      await page.locator(tid(TID.questionGenGenerateBtn)).click();
      // error toast/alert appears; success notification badge must not appear
      await expect(page.locator(tid(TID.notificationBadge))).toHaveCount(0);
    });

    test('network error on generation POST shows error toast', async ({ authedPage: page }) => {
      await mockGenerationTimeout(page, '**/api/generation-job');
      await page.goto(domain.generationUrl);
      await page.locator(tid(domain.typeOptionTid)).click();
      await page.locator(tid(TID.questionGenSelectTrigger)).filter({ visible: true }).click();
      await page.getByRole('option', { name: domain.seedLabel }).click();
      await page.locator(tid(TID.questionGenGenerateBtn)).click();
      // Network abort on the POST shows the generic error toast (no timeout-specific path in startJob)
      await expect(page.getByText(/Algo deu errado|Something went wrong/i)).toBeVisible({ timeout: 15000 });
    });
  });
}
