import { expect, test } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

test.describe('unified exams list', () => {
  test('switches tabs, searches, clears filters, expands domains, and deep-links to /questions', async ({
    authedPage: page,
  }) => {
    await page.goto('/exams');

    await expect(page.getByTestId(TID.configureListSection)).toBeVisible();

    await page.getByRole('tab', { name: /concursos/i }).click();
    await page.getByRole('tab', { name: /todas/i }).click();

    await page.getByTestId(TID.examsSearch).fill('zzzz-no-such-exam-zzzz');
    await expect(page.getByText(/limpar filtros/i)).toBeVisible();
    await page.getByRole('button', { name: /limpar filtros/i }).click();
    await expect(page.getByTestId(TID.examsSearch)).toHaveValue('');

    const firstCard = page.locator(tid(TID.examCard)).first();
    const domainsToggle = firstCard.locator(tid(TID.examCardDomainsToggle));

    if (await domainsToggle.count()) {
      await domainsToggle.click();
      // The card's own readiness header already shows "PREPARO" — the domains panel repeats
      // the same label, so opening it must be asserted by count, not by a single toBeVisible().
      await expect(firstCard.getByText(/preparo/i)).toHaveCount(2);
    }

    await firstCard.locator(tid(TID.examCardMenuToggle)).click();
    const generateLink = firstCard.locator(tid(TID.examCardActionGenerate));

    await expect(generateLink).toHaveAttribute('href', /\/questions\?examId=/);
  });
});
