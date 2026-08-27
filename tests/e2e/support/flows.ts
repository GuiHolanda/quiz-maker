import { expect, type Page } from '@playwright/test';
import { tid, TID } from './selectors';
import type { DomainConfig } from './journey-config';
import { injectFakeEventSource } from './fake-eventsource';
import { setupGenerationJobMocks } from './mocks';

// Navigate to the generation page, pick the vertical, select the seeded entity,
// generate (fake SSE → awaiting_review), then save all. Leaves the page on /questions.
export async function generateAndSaveQuestions(page: Page, domain: DomainConfig): Promise<void> {
  await injectFakeEventSource(page, { topicName: domain.seedTopic });
  await setupGenerationJobMocks(page);

  await page.goto(domain.generationUrl);
  await page.locator(tid(domain.typeOptionTid)).click();

  // Open the entity select and choose the seeded item by visible label.
  // Both cert and public_exam EntitySelects are always in the DOM (toggled via `hidden` class).
  // Use filter({ visible: true }) so we always click the one that is actually displayed.
  await page.locator(tid(TID.questionGenSelectTrigger)).filter({ visible: true }).click();
  await page.getByRole('option', { name: domain.seedLabel }).click();

  await page.locator(tid(TID.questionGenGenerateBtn)).click();
  await expect(page.locator(tid(TID.questionGenStatus))).toBeVisible();

  await page.locator(tid(TID.questionGenSaveAllBtn)).click();
  await expect(page.getByText(/Quest(õ|o)es salvas|Questions saved/i)).toBeVisible();
}

// Create a simulado for the vertical with the given total. Navigates to /simulados.
export async function createSimulado(page: Page, domain: DomainConfig, total = 3): Promise<void> {
  await page.goto('/simulados');
  await page.locator(tid(TID.simuladoTabNew)).click();

  // Dismiss any notification dropdown that may be open from a prior step (e.g. generation job done).
  // The notification bell dialog can intercept clicks intended for the select trigger.
  const notificationDialog = page.getByRole('dialog').filter({ hasText: /Notifica/i });
  if (await notificationDialog.isVisible()) {
    await page.keyboard.press('Escape');
    await notificationDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  }

  // The unified NewMockExamForm has a single EntitySelect over all exams (cert + concurso) —
  // there is no longer a type picker to select the vertical.
  // Scope all selectors to the tabpanel to avoid hitting other HeroUI triggers (e.g. notification bell).
  const panel = page.getByRole('tabpanel', { name: /Novo Simulado/i });

  // Wait for the entity Select trigger to be visible inside the tabpanel.
  // The notification bell is dismissed above so only the form's Select trigger remains.
  // The HeroUI trigger shows the selected value as text content when filled,
  // or just the placeholder/label text when empty.
  const trigger = panel.locator('button[data-slot="trigger"]').first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  const triggerText = await trigger.textContent() ?? '';
  if (!triggerText.includes(domain.seedLabel)) {
    await trigger.click();
    await page.getByRole('option', { name: domain.seedLabel }).click();
    // Wait for the trigger to reflect the selection before proceeding.
    await expect(trigger).toContainText(domain.seedLabel, { timeout: 5_000 });
  }

  // Clear and fill total — the field may have a prefill value from localStorage.
  const totalInput = page.locator(tid(TID.simuladoTotalInput));
  await totalInput.clear();
  await totalInput.fill(String(total));
  // Wait for the distribution useEffect to fire (depends on both selectedCert/exam and totalQuestions)
  // and make isDistributionValid true before attempting to click.
  await expect(page.locator(tid(TID.simuladoCreateBtn))).toBeEnabled({ timeout: 10_000 });
  await page.locator(tid(TID.simuladoCreateBtn)).click();
  await expect(page.getByText(/Simulado criado|Mock exam created/i)).toBeVisible();
}

// From the simulado list, start (or retry) the attempt for the seeded entity's card.
// Returns the { simuladoId, attemptId } parsed from the resulting tentativa URL.
export async function startAttempt(
  page: Page,
  domain: DomainConfig,
): Promise<{ simuladoId: string; attemptId: string }> {
  await page.goto('/simulados');
  await page.locator(tid(TID.simuladoTabMine)).click();
  const card = page.locator(tid(TID.simuladoCard)).filter({ hasText: domain.seedLabel }).first();
  await card.locator(tid(TID.simuladoAnswerBtn)).click();
  await page.waitForURL(/\/tentativa\/\d+/);
  const url = page.url();
  const match = url.match(/simulados\/(\d+)\/tentativa\/(\d+)/);
  return { simuladoId: match?.[1] ?? '', attemptId: match?.[2] ?? '' };
}

// Answer every question using the HeroUI Radio + Form submit workaround (dispatchEvent).
// Both the radio input (opacity ~0) and the react-aria submit button need dispatchEvent('click'):
// a plain .click() selects the radio but does NOT trigger the HeroUI <Form> submit, so the
// answer never persists (progress stays "0 answered" and the finalize button stays disabled).
export async function answerAllQuestions(page: Page): Promise<void> {
  await expect(page.locator('[role="radiogroup"]').first()).toBeVisible({ timeout: 10_000 });

  const groups = page.locator('[role="radiogroup"]');
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    const group = groups.nth(i);
    await group.locator('input').first().dispatchEvent('click');
    // The submit button only renders after React processes the radio selection.
    // Scope to the enclosing <form> so the submit is the one for this question.
    const submit = group.locator('xpath=ancestor::form').first().locator(tid(TID.answerSubmitBtn));
    await expect(submit).toBeVisible({ timeout: 5_000 });
    await submit.dispatchEvent('click');
    // Wait for the answer to be committed (answers state updates) before moving on.
    await page.waitForTimeout(300);
  }
}

// Finalize the attempt and wait for the result page.
export async function finalizeAttempt(page: Page): Promise<void> {
  await page.locator(tid(TID.attemptFinalizeBtn)).click();
  await page.waitForURL(/\/resultado\//);
}

// Assert the result page shows a score/percent and the topic breakdown.
export async function assertResult(page: Page, domain: DomainConfig): Promise<void> {
  await expect(page.locator(tid(TID.resultScore))).toBeVisible();
  await expect(page.locator(tid(TID.resultPercent))).toBeVisible();
  await expect(page.getByText(domain.seedTopic).first()).toBeVisible();
  await expect(page.locator(tid(TID.resultRetryBtn))).toBeVisible();
}
