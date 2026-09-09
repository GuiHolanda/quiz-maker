import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';
import { seedCertQuestions } from '../support/db-seed';

const BANK_Q1 = 'BANK_Q1: object storage service?';

test.describe('question bank', () => {
  test('seed → verify → search → delete', async ({ authedPage: page }) => {
    await seedCertQuestions([BANK_Q1, 'BANK_Q2: compute service?', 'BANK_Q3: relational db?']);

    await page.goto('/question-bank');
    await expect(page.locator(tid(TID.questionBankCard)).filter({ hasText: BANK_Q1 })).toBeVisible();

    // filters are always visible now — search narrows to one card
    await page.locator(tid(TID.questionBankSearch)).fill('BANK_Q1');
    await expect(page.locator(tid(TID.questionBankCard))).toHaveCount(1, { timeout: 10000 });

    await page
      .locator(tid(TID.questionBankCard))
      .filter({ hasText: BANK_Q1 })
      .locator(tid(TID.questionBankDeleteBtn))
      .click();
    await page.locator(tid(TID.confirmDeleteBtn)).click();
    await expect(page.locator(tid(TID.questionBankCard)).filter({ hasText: BANK_Q1 })).toHaveCount(0);
  });

  test('search with no match shows the empty state', async ({ authedPage: page }) => {
    await seedCertQuestions(['BANK_SEARCH: seed for empty-state test']);

    await page.goto('/question-bank');
    await expect(page.locator(tid(TID.questionBankSearch))).toBeVisible();
    await page.locator(tid(TID.questionBankSearch)).fill('zzz-no-such-question-zzz');
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
    // the filter bar stays visible even when the search returns zero results
    await expect(page.locator(tid(TID.questionBankSearch))).toBeVisible();
  });

  test('select questions → bulk delete', async ({ authedPage: page }) => {
    const texts = ['BULK_A: first to remove', 'BULK_B: second to remove'];
    await seedCertQuestions(texts);

    await page.goto('/question-bank');
    await page.locator(tid(TID.questionBankSearch)).fill('BULK_');
    await expect(page.locator(tid(TID.questionBankCard))).toHaveCount(2, { timeout: 10000 });

    for (const text of texts) {
      await page
        .locator(tid(TID.questionBankCard))
        .filter({ hasText: text })
        .locator(tid(TID.questionBankCardCheckbox))
        .click();
    }

    await expect(page.locator(tid(TID.questionBankBulkBar))).toBeVisible();
    await page.locator(tid(TID.questionBankBulkDelete)).click();
    await page.locator(tid(TID.confirmBulkDeleteBtn)).click();

    await expect(page.locator(tid(TID.questionBankCard))).toHaveCount(0);
  });
});
