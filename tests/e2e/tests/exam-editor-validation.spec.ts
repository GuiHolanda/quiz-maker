import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';

for (const domain of ALL_DOMAINS) {
  test.describe(`exam editor validation — ${domain.type}`, () => {
    test('discard clears the draft and returns to the seed picker', async ({ authedPage: page }) => {
      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).click();
      await page.locator(tid(TID.examEditorNameInput)).fill('Draft to discard');
      await page.locator(tid(TID.examEditorDiscardBtn)).click();
      await page.locator(tid(TID.confirmDiscardBtn)).click();
      // Back on the seed picker — reloading no longer resumes the discarded draft.
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();
      await page.reload();
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();
    });

    test('save stays disabled until the exam has a name', async ({ authedPage: page }) => {
      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).click();
      await expect(page.locator(tid(TID.examEditorNameInput))).toHaveValue('');
      await expect(page.locator(tid(TID.examEditorSaveBtn))).toBeDisabled();

      await page.locator(tid(TID.examEditorNameInput)).fill('Draft exam name');
      // Name alone still isn't enough — key/provider/totalQuestions are also required.
      await expect(page.locator(tid(TID.examEditorSaveBtn))).toBeDisabled();
    });
  });
}
