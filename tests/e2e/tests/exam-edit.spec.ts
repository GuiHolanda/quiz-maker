import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';

for (const domain of ALL_DOMAINS) {
  test.describe(`exam edit — ${domain.type}`, () => {
    test('editing a saved exam in the unified editor persists the change', async ({ authedPage: page }) => {
      // Seed a dedicated exam via the real API (not the shared globalSetup fixtures) so this
      // test can safely rename it without affecting other specs that depend on the seed name.
      const examName = `E2E Edit Target ${domain.type} ${Date.now()}`;
      const createRes = await page.request.post('/api/exam/save-exam', {
        data: {
          type: domain.type,
          name: examName,
          key: 'EDIT-01',
          totalQuestions: 40,
          sections: [{ name: 'Section A', minQuestions: 100, maxQuestions: 100 }],
          ...(domain.type === 'certification'
            ? { provider: { name: 'E2E Edit Provider' } }
            : { examBoard: { name: 'E2E Edit Board' }, role: 'E2E Role', year: 2024 }),
        },
      });

      expect(createRes.ok()).toBeTruthy();
      const { exam } = await createRes.json();

      try {
        await page.goto(`/exams?type=${domain.type}`);
        await page.getByRole('button', { name: examName }).click();
        await page.locator(tid(TID.examDetailEditBtn)).click();
        await page.waitForURL(new RegExp(`/exams/${exam.id}/edit$`));

        const nameInput = page.locator(tid(TID.examEditorNameInput));

        await expect(nameInput).toHaveValue(examName);

        const updatedName = `${examName} (edited)`;

        await nameInput.fill(updatedName);
        await page.locator(tid(TID.examEditorSaveBtn)).click();

        await page.waitForURL(`**/exams?type=${domain.type}`);
        await expect(page.getByRole('button', { name: updatedName })).toBeVisible();
      } finally {
        await page.request.delete(`/api/exam/save-exam?examId=${exam.id}`);
      }
    });
  });
}
