import { expect, type Page } from '@playwright/test';
import { tid, TID } from './selectors';
import type { DomainConfig } from './journey-config';
import { injectFakeEventSource } from './fake-eventsource';
import { setupGenerationJobMocks } from './mocks';

// Navigate to the generation page, pick the vertical, select the seeded entity,
// generate (fake SSE → done). Leaves the page on /questions with the completed job card.
export async function generateQuestions(page: Page, domain: DomainConfig): Promise<void> {
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
  await expect(page.locator(tid(TID.questionGenCreateSimuladoBtn))).toBeVisible({ timeout: 10_000 });
}

// A prior step (e.g. generation job done) can leave the notification bell dialog open;
// it intercepts clicks meant for the form. Dismiss it before touching the create form.
export async function dismissNotificationDialog(page: Page): Promise<void> {
  const notificationDialog = page.getByRole('dialog').filter({ hasText: /Notifica/i });
  if (await notificationDialog.isVisible()) {
    await page.keyboard.press('Escape');
    await notificationDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  }
}

// Pick the scope card, then open the exam Select and choose the seeded exam.
export async function pickSimuladoScopeAndExam(page: Page, domain: DomainConfig): Promise<void> {
  const scopeTid =
    domain.type === 'certification' ? TID.simuladoScopeCertification : TID.simuladoScopePublicExam;
  await page.locator(tid(scopeTid)).click();

  const examSelect = page.locator(tid(TID.simuladoExamSelect));
  await expect(examSelect).toBeVisible({ timeout: 10_000 });

  // HeroUI Select trigger is a react-aria pressable — a plain .click() focuses it
  // but does not open the listbox under Playwright, so dispatch the click event.
  const option = page.getByRole('option', { name: new RegExp(domain.seedLabel, 'i') });
  await expect(async () => {
    await examSelect.dispatchEvent('click');
    await expect(option).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  await option.click();

  await expect(examSelect).toContainText(domain.seedLabel, { timeout: 10_000 });
}

// Create a simulado for the vertical with the given total. The /simulados page has no
// tabs — the create form is always visible at the top. Leaves the page on /simulados.
export async function createSimulado(page: Page, domain: DomainConfig, total = 3): Promise<void> {
  await page.goto('/simulados');
  await dismissNotificationDialog(page);

  await pickSimuladoScopeAndExam(page, domain);

  const totalInput = page.locator(tid(TID.simuladoTotalInput));
  await totalInput.fill('');
  await totalInput.fill(String(total));

  const createBtn = page.locator(tid(TID.simuladoCreateBtn));
  await expect(createBtn).toBeEnabled({ timeout: 10_000 });
  await createBtn.click();
  await expect(page.getByText(/Simulado criado|Mock exam created/i)).toBeVisible({ timeout: 15_000 });
}

// From the simulados table, start (or continue/retry) the attempt for the seeded entity's row.
// Returns the { simuladoId, attemptId } parsed from the resulting tentativa URL.
export async function startSimuladoAttempt(
  page: Page,
  domain: DomainConfig,
): Promise<{ simuladoId: string; attemptId: string }> {
  await page.goto('/simulados');
  const row = page
    .locator(`${tid(TID.simuladoRow)}[data-simulado-name*="${domain.seedLabel}"]`)
    .first();
  await row.locator(tid(TID.simuladoStartBtn)).click();
  await page.waitForURL(/\/tentativa\/\d+/);
  const match = page.url().match(/simulados\/(\d+)\/tentativa\/(\d+)/);
  return { simuladoId: match?.[1] ?? '', attemptId: match?.[2] ?? '' };
}

// The attempt screen shows one question at a time. Click an option (selection persists
// immediately — no submit step) then advance with "Próxima" until the last question.
export async function answerAllQuestions(page: Page): Promise<void> {
  await expect(page.locator(tid(TID.attemptOption)).first()).toBeVisible({ timeout: 10_000 });

  const total = await page.locator(tid(TID.attemptNavCell)).count();
  for (let i = 0; i < total; i++) {
    await page.locator(tid(TID.attemptOption)).first().click();
    await page.waitForTimeout(150);
    if (i < total - 1) {
      await page.locator(tid(TID.attemptNextBtn)).click();
      await page.waitForTimeout(150);
    }
  }
}

// Finalize the attempt (sidebar button → confirm modal) and wait for the result page.
export async function finalizeAttempt(page: Page): Promise<void> {
  await page.locator(tid(TID.attemptFinalizeBtn)).click();
  await page.locator(tid(TID.confirmFinishAttemptBtn)).click();
  await page.waitForURL(/\/resultado\//);
}

// From an in-progress attempt: open "Salvar e sair", discard the attempt, land on the list.
export async function exitAndDiscardAttempt(page: Page): Promise<void> {
  await page.locator(tid(TID.attemptExitBtn)).click();
  await page.locator(tid(TID.attemptDiscardLink)).click();
  await page.locator(tid(TID.confirmDiscardAttemptBtn)).click();
  await page.waitForURL(/\/simulados/);
}

// Assert the result page shows a score/percent and the topic breakdown.
export async function assertResult(page: Page, domain: DomainConfig): Promise<void> {
  await expect(page.locator(tid(TID.resultScore))).toBeVisible();
  await expect(page.locator(tid(TID.resultPercent))).toBeVisible();
  await expect(page.getByText(domain.seedTopic).first()).toBeVisible();
  await expect(page.locator(tid(TID.resultRetryBtn))).toBeVisible();
}
