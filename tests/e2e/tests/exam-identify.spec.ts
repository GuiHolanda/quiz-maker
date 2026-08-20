import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';
import { injectNeverDoneEventSource } from '../support/fake-eventsource';
import { mockCreateAutoConfigJob, mockIdentify } from '../support/mocks';

const MATCHES = [
  { label: 'AWS Certified Solutions Architect – Associate', key: 'SAA-C03', provider: 'AWS', examBoard: null, role: null, year: null },
  { label: 'AWS Certified Cloud Practitioner', key: 'CLF-C02', provider: 'AWS', examBoard: null, role: null, year: null },
];

for (const domain of ALL_DOMAINS) {
  test.describe(`exam identification — ${domain.type}`, () => {
    test('cancelling during identification returns to the picker, and a late response does not resurrect it', async ({
      authedPage: page,
    }) => {
      await mockIdentify(page, [{ status: 200, body: { matches: [MATCHES[0]], clarification: null }, delayMs: 3000 }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      const cancelBtn = page.locator(tid(TID.seedLoadingCancelBtn));
      await expect(cancelBtn).toBeVisible({ timeout: 10000 });
      await cancelBtn.click();
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();

      // The mocked identify response is still in flight (3s delay) — wait past it and
      // confirm the picker holds instead of jumping to the loading screen or the editor.
      await page.waitForTimeout(3500);
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();
      await expect(cancelBtn).toHaveCount(0);
    });

    test('no match found offers an inline retry that re-submits the search', async ({ authedPage: page }) => {
      const identify = await mockIdentify(page, [
        { status: 200, body: { matches: [], clarification: 'Qual órgão ou provedor você quis dizer?' } },
        { status: 200, body: { matches: [], clarification: 'Ainda não encontrei — tente o código oficial da prova.' } },
      ]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.getByText('Qual órgão ou provedor você quis dizer?')).toBeVisible({ timeout: 10000 });
      // The recovery form is prefilled with the original query and reuses the same testids.
      await expect(page.locator(tid(TID.examSearchInput))).toHaveValue(domain.seedLabel);
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();

      await page.locator(tid(TID.examSearchInput)).fill(`${domain.seedLabel} refinado`);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.getByText('Ainda não encontrei — tente o código oficial da prova.')).toBeVisible({
        timeout: 10000,
      });
      expect(identify.callCount()).toBe(2);
    });

    test('an identify failure keeps the user on the loading screen with a retry and a way out', async ({
      authedPage: page,
    }) => {
      await mockIdentify(page, [{ status: 500, body: { error: 'boom' } }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.locator(tid(TID.examSearchInput))).toBeVisible({ timeout: 10000 });
      await expect(page.locator(tid(TID.seedLoadingCancelBtn))).toBeVisible();

      // Failure doesn't dead-end into a blank editor by itself — "start blank" is an explicit
      // choice, still reachable from the same recovery row as before.
      await page.locator(tid(TID.examSeedBlankBtn)).click();
      await expect(page.locator(tid(TID.examEditorNameInput))).toBeVisible();
    });

    test('several matches show a selectable list, and choosing one confirms the seed', async ({ authedPage: page }) => {
      await injectNeverDoneEventSource(page);
      await mockCreateAutoConfigJob(page);
      await mockIdentify(page, [{ status: 200, body: { matches: MATCHES, clarification: null } }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill('AWS');
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      const options = page.locator(tid(TID.seedIdentifyMatchOption));
      await expect(options).toHaveCount(MATCHES.length, { timeout: 10000 });
      await options.filter({ hasText: MATCHES[1].label }).click();

      // Picking a match confirms it immediately (before the — here neutered — pipeline
      // stream ever resolves): the list is replaced by the confirmed identification.
      await expect(options).toHaveCount(0);
      const [, chosen] = MATCHES;
      await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(chosen.label);
      await expect(page.getByText(chosen.key ?? '')).toBeVisible();
    });
  });
}
