import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';

for (const domain of ALL_DOMAINS) {
  test.describe(`wizard validation — ${domain.type}`, () => {
    test('discard draft resets the wizard title field', async ({ authedPage: page }) => {
      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.wizardTitleInput)).fill('Draft to discard');
      await page.locator(tid(TID.wizardDiscardBtn)).first().click();
      await page.locator(tid(TID.confirmDiscardBtn)).click();
      await expect(page.locator(tid(TID.wizardTitleInput))).toHaveValue('');
    });

    test('cannot advance past step 1 without a title', async ({ authedPage: page }) => {
      await page.goto(domain.configureUrl);
      // clear any pre-filled title
      await page.locator(tid(TID.wizardTitleInput)).clear();
      await page.locator(tid(TID.wizardNextBtn)).click();
      // still on step 1 — the title input remains visible
      await expect(page.locator(tid(TID.wizardTitleInput))).toBeVisible();
    });
  });
}
