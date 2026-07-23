import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_KEY, E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../fixtures/mock-data';

test('full certification journey: configure → questions → simulado → answer → result → retry & cancel', async ({
  authedPage: page,
}) => {
  // ─── Step 1: Configure a new certification (3-step wizard) ───────────────

  await page.goto('/certifications/configure');

  await page.getByRole('tab', { name: /Nova Certifica|Add new Certification/i }).click();

  // Step 1 — basic info
  await page.getByLabel(/Título da Certificação|Certification Title/i).fill(E2E_CERT_LABEL);
  // "Código da Certificação" in PT / "Certification Code" in EN
  await page.getByLabel(/Código da Certificação|Certification Code/i).fill(E2E_CERT_KEY);

  // Fill required totalQuestions field
  const totalQuestionsInput = page.getByLabel(/Total de Quest|Total Questions/i);
  await expect(totalQuestionsInput).toBeVisible({ timeout: 8_000 });
  await totalQuestionsInput.fill('65');

  // Advance to Step 2
  await page.getByRole('button', { name: /Definir Tópicos|Define Topics/i }).click();

  // Step 2 — add one topic
  await page.getByRole('button', { name: /Adicionar Domínio|Add Domain/i }).click();
  await page.getByLabel(/Nome do Domínio|Topic Name/i).first().fill(E2E_CERT_TOPIC);

  // Set min=0, max=100 so weightage is valid
  const weightInputs = page.getByRole('spinbutton');
  await weightInputs.first().fill('0');
  await weightInputs.nth(1).fill('100');

  // Advance to Step 3
  await page.getByRole('button', { name: /Finalizar Certificação|Finalize Certification/i }).click();

  // Step 3 — create
  await page.getByRole('button', { name: /Finalizar e Criar Certificação|Finalize & Create Certification/i }).click();

  // Wait for the tab to become SELECTED — this only happens inside onBackToLibrary(),
  // which is called after the save API returns. If we only check toBeVisible() the tab
  // is always present and the assertion passes before the save completes, causing the
  // browser to abort the in-flight API request on the next page.goto().
  await expect(
    page.getByRole('tab', { name: /Minhas certifica|My certifications/i }),
  ).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });

  // ─── Step 2: Generate questions ──────────────────────────────────────────

  await page.goto('/questions?type=certification');

  // Select the certification
  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Select the topic
  await page.getByRole('button', { name: /Selecione um Tópico|Select a Topic/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_TOPIC })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: E2E_CERT_TOPIC }).click();

  // Set question count
  await page.getByLabel(/Número de Questões|Number of Questions/i).fill('3');

  // Generate — API is mocked, returns 3 questions immediately
  await page.getByRole('button', { name: /^Gerar$|^Generate$/i }).click();

  // Wait for the list to appear (mock API is synchronous so this is fast)
  await expect(page.getByText(/E2E Question/i).first()).toBeVisible({ timeout: 15_000 });

  // Select all
  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click({ force: true });

  // Save
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected questions/i }).click();

  // Wait for the list to disappear (questions cleared after save)
  await expect(page.getByText(/E2E Question/i).first()).not.toBeVisible({ timeout: 15_000 });

  // ─── Step 2b: Verify the success banner appears after save ───────────────

  // After save, the simulados banner appears confirming questions were saved
  await expect(
    page.getByText(/Questões salvas|Questions saved/i),
  ).toBeVisible({ timeout: 5_000 });

  // ─── Step 3: Create a simulado ────────────────────────────────────────────

  await page.goto('/simulados');

  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // Certification is the default selection in the type picker.
  // If the picker is present, just wait for the cert form to mount.
  const typePicker = page.getByRole('group', { name: /Que tipo de simulado\?|What kind of mock exam\?/i });
  const hasPicker = await typePicker.isVisible().catch(() => false);
  if (hasPicker) {
    await expect(page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i })).toBeVisible({
      timeout: 8_000,
    });
  }

  // Select certification
  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Set total questions
  const totalInput = page.getByLabel(/Total de questões|Total Questions/i);
  await expect(totalInput).toBeVisible({ timeout: 8_000 });
  await totalInput.fill('3');

  // Create button becomes enabled once a valid distribution exists
  await expect(page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i })).toBeEnabled({ timeout: 8_000 });
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for creation success then switch to list tab
  await page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i }).click();

  const answerButton = page.getByRole('button', { name: /Responder|Continuar|Answer/i }).first();
  await expect(answerButton).toBeVisible({ timeout: 10_000 });
  await answerButton.click();

  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // ─── Step 4: Answer the simulado ──────────────────────────────────────────

  await expect(page.locator('[role="radiogroup"]').first()).toBeVisible({ timeout: 10_000 });

  const radioGroups = page.locator('[role="radiogroup"]');
  const groupCount = await radioGroups.count();

  for (let i = 0; i < groupCount; i++) {
    const group = radioGroups.nth(i);

    // 1. Select an option via dispatchEvent (bypasses HeroUI opacity check)
    await group.locator('input').first().dispatchEvent('click');

    // 2. Wait for the submit button to appear — it renders only after a selection is made
    const card = group.locator('xpath=ancestor::form').first();
    const submitBtn = card.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });

    // 3. Submit via dispatchEvent (same reason as above)
    await submitBtn.dispatchEvent('click');

    // Brief pause to let React commit the confirmed answer state
    await page.waitForTimeout(200);
  }

  // "Finalizar Simulado" becomes enabled only when all questions are confirmed (canFinish)
  const finalizeBtn = page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i });
  await expect(finalizeBtn).toBeEnabled({ timeout: 10_000 });
  await finalizeBtn.click();

  // finishAttempt PATCH is mocked → 200. Page then navigates to result.
  await expect(page).toHaveURL(/\/resultado\//, { timeout: 15_000 });

  // ─── Step 5: Analyze result ───────────────────────────────────────────────

  // Result GET is mocked → stub with score=2/3
  await expect(page.getByText(/\d+\s*\/\s*\d+\s*(acertos|correct)/i)).toBeVisible({ timeout: 10_000 });

  // Score percentage (strict mode: use first() since the % appears in both the score card and the topic breakdown chip)
  await expect(page.getByText(/\d+%/i).first()).toBeVisible();

  // Topic breakdown accordion should be visible
  await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible();

  // "Tentar novamente / Try again" button
  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();

  // ─── Step 6: New attempt and cancel ──────────────────────────────────────

  await page.getByRole('button', { name: /Tentar novamente|Try again/i }).click();

  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // Cancel the attempt
  await page.getByRole('button', { name: /Cancelar tentativa|Cancel attempt/i }).click();

  // Discard modal appears
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar esta tentativa\?|Discard this attempt\?/i)).toBeVisible();

  // Confirm discard
  await page.getByRole('button', { name: /Descartar tentativa|Discard attempt/i }).click();

  // Back to simulados list
  await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
  await expect(page).not.toHaveURL(/\/tentativa\//, { timeout: 5_000 });
});

test('certification wizard: discard draft cancels and returns to list', async ({ authedPage: page }) => {
  await page.goto('/certifications/configure');

  await page.getByRole('tab', { name: /Nova Certifica|Add new Certification/i }).click();

  // Fill some info so the "Discard Draft" button becomes visible (hasDraft = true)
  await page.getByLabel(/Título da Certificação|Certification Title/i).fill('Cert Para Descartar');

  // Discard button should be visible after filling
  const discardBtn = page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i });
  await expect(discardBtn).toBeVisible();
  await discardBtn.click();

  // Confirmation modal appears
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar rascunho\?|Discard draft\?/i)).toBeVisible();

  // Confirm
  await page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i }).last().click();

  // Should navigate back to the "Minhas certificações" tab
  await expect(page.getByRole('tab', { name: /Minhas certifica|My certifications/i })).toBeVisible({
    timeout: 5_000,
  });
});
