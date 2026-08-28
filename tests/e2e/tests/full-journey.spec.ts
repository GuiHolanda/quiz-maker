import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';
import {
  generateAndSaveQuestions,
  createSimulado,
  startSimuladoAttempt,
  answerAllQuestions,
  finalizeAttempt,
  assertResult,
} from '../support/flows';

for (const domain of ALL_DOMAINS) {
  test.describe(`full journey — ${domain.type}`, () => {
    test('generate → save → simulado → answer → result → retry → cancel', async ({ authedPage: page }) => {
      await generateAndSaveQuestions(page, domain);
      await createSimulado(page, domain, 3);
      const { attemptId } = await startSimuladoAttempt(page, domain);
      expect(attemptId).not.toBe('');
      await answerAllQuestions(page);
      await finalizeAttempt(page);
      await assertResult(page, domain);

      // retry then cancel back to the list
      await page.locator(tid(TID.resultRetryBtn)).click();
      await page.waitForURL(/\/tentativa\//);
      await page.locator(tid(TID.attemptCancelBtn)).click();
      await page.locator(tid(TID.confirmDiscardAttemptBtn)).click();
      await page.waitForURL(/\/simulados/);
    });
  });
}
