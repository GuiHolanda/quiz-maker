import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';
import { injectNeverDoneEventSource, injectFakeEventSource } from '../support/fake-eventsource';
import { setupGenerationJobMocks, mockActiveJobOnLoad } from '../support/mocks';

for (const domain of ALL_DOMAINS) {
  test.describe(`sse reconnect — ${domain.type}`, () => {
    test('cancel a running job calls DELETE and resets state', async ({ authedPage: page }) => {
      await injectNeverDoneEventSource(page);
      const { deleteCalled } = await setupGenerationJobMocks(page);
      await page.goto(domain.generationUrl);
      await page.locator(tid(domain.typeOptionTid)).click();
      await page.locator(tid(TID.questionGenSelectTrigger)).filter({ visible: true }).click();
      await page.getByRole('option', { name: domain.seedLabel }).click();
      await page.locator(tid(TID.questionGenGenerateBtn)).click();
      const cancel = page.locator(tid(TID.questionGenJobCancelBtn));
      await expect(cancel).toBeVisible({ timeout: 10000 });
      await cancel.click();
      await expect(cancel).toHaveCount(0);
      expect(deleteCalled()).toBe(true);
    });

    test('restores a running job after reload', async ({ authedPage: page }) => {
      await injectNeverDoneEventSource(page);
      await mockActiveJobOnLoad(page, { jobId: 'e2e-job-1', status: 'running', topicName: domain.seedTopic });
      await page.goto(domain.generationUrl);
      await page.reload();
      await expect(page.locator(tid(TID.questionGenJobCancelBtn))).toBeVisible({ timeout: 10000 });
    });

    test('restores an awaiting_review job after reload', async ({ authedPage: page }) => {
      await injectFakeEventSource(page, { topicName: domain.seedTopic });
      await mockActiveJobOnLoad(page, { jobId: 'e2e-job-1', status: 'awaiting_review', topicName: domain.seedTopic });
      await page.goto(domain.generationUrl);
      await page.reload();
      await expect(page.locator(tid(TID.questionGenSaveAllBtn))).toBeVisible({ timeout: 10000 });
    });
  });
}
