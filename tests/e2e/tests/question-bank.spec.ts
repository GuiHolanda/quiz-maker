import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../support/constants';

const BANK_Q1 = 'BANK_Q1: object storage service?';

test.describe('question bank', () => {
  test('seed → verify → search → delete', async ({ authedPage: page }) => {
    // Seed 3 questions via the real save-questions API (no UI generation).
    // The route accepts { questions: AIQuestion[] } where certificationTitle is per-question.
    const res = await page.request.post('/api/certification/save-questions', {
      data: {
        questions: [
          {
            certificationTitle: E2E_CERT_LABEL,
            text: BANK_Q1,
            topic: E2E_CERT_TOPIC,
            difficulty: 'hard',
            correctCount: 1,
            options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
          },
          {
            certificationTitle: E2E_CERT_LABEL,
            text: 'BANK_Q2: compute service?',
            topic: E2E_CERT_TOPIC,
            difficulty: 'easy',
            correctCount: 1,
            options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CDN' },
          },
          {
            certificationTitle: E2E_CERT_LABEL,
            text: 'BANK_Q3: relational db?',
            topic: E2E_CERT_TOPIC,
            difficulty: 'medium',
            correctCount: 1,
            options: { A: 'Dynamo', B: 'Redshift', C: 'RDS', D: 'Cache' },
          },
        ],
      },
    });
    expect(res.ok()).toBeTruthy();

    await page.goto('/question-bank');
    await expect(page.locator(tid(TID.questionBankCard)).filter({ hasText: BANK_Q1 })).toBeVisible();

    // search narrows to one card
    await page.locator(tid(TID.questionBankSearch)).fill('BANK_Q1');
    // wait for debounce + network
    await expect(page.locator(tid(TID.questionBankCard))).toHaveCount(1, { timeout: 10000 });

    // delete it
    await page.locator(tid(TID.questionBankCard)).filter({ hasText: BANK_Q1 })
      .locator(tid(TID.questionBankDeleteBtn)).click();
    await page.locator(tid(TID.confirmDeleteBtn)).click();
    await expect(page.locator(tid(TID.questionBankCard)).filter({ hasText: BANK_Q1 })).toHaveCount(0);
  });

  test('search with no match shows the empty state', async ({ authedPage: page }) => {
    await page.goto('/question-bank');
    await page.locator(tid(TID.questionBankSearch)).fill('zzz-no-such-question-zzz');
    await expect(page.locator(tid(TID.emptyState))).toBeVisible();
  });
});
