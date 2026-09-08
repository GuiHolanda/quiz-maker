import { expect, test } from '../fixtures/auth.fixture';
import { E2E_CERT_LABEL, E2E_PUBLIC_EXAM_NAME } from '../support/constants';
import { tid, TID } from '../support/selectors';

test.describe('unified exams list', () => {
  test('switches tabs, searches, clears filters, expands domains, and deep-links to /questions', async ({
    authedPage: page,
  }) => {
    await page.goto('/exams');

    await expect(page.getByTestId(TID.configureListSection)).toBeVisible();

    const certCard = page.locator(tid(TID.examCard)).filter({ hasText: E2E_CERT_LABEL });
    const publicCard = page.locator(tid(TID.examCard)).filter({ hasText: E2E_PUBLIC_EXAM_NAME });

    await expect(certCard).toBeVisible();
    await expect(publicCard).toBeVisible();

    await page.getByRole('tab', { name: /concursos/i }).click();
    await expect(publicCard).toBeVisible();
    await expect(certCard).not.toBeVisible();

    await page.getByRole('tab', { name: /todas/i }).click();
    await expect(certCard).toBeVisible();
    await expect(publicCard).toBeVisible();

    await page.getByTestId(TID.examsSearch).fill('zzzz-no-such-exam-zzzz');
    await expect(page.getByText(/limpar filtros/i)).toBeVisible();
    await expect(certCard).not.toBeVisible();
    await expect(publicCard).not.toBeVisible();

    await page.getByRole('button', { name: /limpar filtros/i }).click();
    await expect(page.getByTestId(TID.examsSearch)).toHaveValue('');
    await expect(certCard).toBeVisible();

    // The seeded certification exam always has one section, so the domains toggle is
    // guaranteed to render for it — no need for a count()-guarded skip branch.
    const domainsToggle = certCard.locator(tid(TID.examCardDomainsToggle));

    await expect(domainsToggle).toBeVisible();
    await domainsToggle.click();
    // The card's own readiness header already shows "PREPARO" — the domains panel repeats
    // the same label, so opening it must be asserted by count, not by a single toBeVisible().
    await expect(certCard.getByText(/preparo/i)).toHaveCount(2);

    await certCard.locator(tid(TID.examCardMenuToggle)).click();
    await certCard.locator(tid(TID.examCardActionGenerate)).click();

    await page.waitForURL(/\/questions\?examId=/);
    // Proves the async-hydration deep-link fix (Tasks 15-17): /questions must resolve the
    // examId query param to the actual pre-selected exam, not just navigate to the URL.
    await expect(page.locator(tid(TID.questionGenSelectTrigger)).filter({ visible: true })).toContainText(
      E2E_CERT_LABEL
    );
  });
});
