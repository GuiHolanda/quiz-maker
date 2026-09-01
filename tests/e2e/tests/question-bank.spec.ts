import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../support/constants';

const BANK_Q1 = 'BANK_Q1: object storage service?';

function seedQuestions(texts: string[]) {
  return {
    type: 'certification',
    questions: texts.map((text) => ({
      examName: E2E_CERT_LABEL,
      sectionName: E2E_CERT_TOPIC,
      text,
      topic: E2E_CERT_TOPIC,
      difficulty: 'medium',
      correctCount: 1,
      options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
    })),
  };
}

test.describe('question bank', () => {
  test('seed → verify → search → delete', async ({ authedPage: page }) => {
    const res = await page.request.post('/api/exam/save-questions', {
      data: seedQuestions([BANK_Q1, 'BANK_Q2: compute service?', 'BANK_Q3: relational db?']),
    });
    expect(res.ok()).toBeTruthy();

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
    const res = await page.request.post('/api/exam/save-questions', {
      data: seedQuestions(['BANK_SEARCH: seed for empty-state test']),
    });
    expect(res.ok()).toBeTruthy();

    await page.goto('/question-bank');
    await expect(page.locator(tid(TID.questionBankSearch))).toBeVisible();
    await page.locator(tid(TID.questionBankSearch)).fill('zzz-no-such-question-zzz');
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
    // the filter bar stays visible even when the search returns zero results
    await expect(page.locator(tid(TID.questionBankSearch))).toBeVisible();
  });

  test('select questions → bulk delete', async ({ authedPage: page }) => {
    const texts = ['BULK_A: first to remove', 'BULK_B: second to remove'];
    const res = await page.request.post('/api/exam/save-questions', { data: seedQuestions(texts) });
    expect(res.ok()).toBeTruthy();

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
