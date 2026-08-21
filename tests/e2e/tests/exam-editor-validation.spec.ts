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

    test('AI seed provenance card survives a reload', async ({ authedPage: page }) => {
      const storageKey = domain.type === 'certification' ? 'NEW_CERTIFICATION_DRAFT' : 'NEW_PUBLIC_EXAM_DRAFT';
      const draft = {
        type: domain.type,
        name: 'Resumed AI Draft',
        key: 'AI-01',
        role: domain.type === 'public_exam' ? 'Analista' : null,
        year: domain.type === 'public_exam' ? 2024 : null,
        totalQuestions: 40,
        examDurationMinutes: null,
        passingScore: null,
        questionFormat: 'mc_5',
        provider: domain.type === 'certification' ? { name: 'E2E AI Provider' } : null,
        examBoard: domain.type === 'public_exam' ? { name: 'E2E AI Board' } : null,
        sections: [{ name: 'Section A', minQuestions: 100, maxQuestions: 100, topics: [] }],
      };

      // Mirrors what page.tsx writes after a real AI seed completes, skipping the AI call.
      await page.goto(domain.configureUrl);
      await page.evaluate(
        ({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)),
        {
          key: storageKey,
          payload: {
            draft,
            context: 'Fonte oficial confirmada para **Resumed AI Draft**.',
            sources: ['[Edital oficial](https://example.com/edital)'],
          },
        }
      );
      await page.reload();

      await expect(page.locator(tid(TID.examEditorNameInput))).toHaveValue('Resumed AI Draft');
      await expect(page.locator(tid(TID.examEditorProvenanceCard))).toBeVisible();
    });
  });
}
