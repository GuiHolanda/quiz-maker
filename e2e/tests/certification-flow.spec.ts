import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_KEY, E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../fixtures/mock-data';

test('full certification journey: configure → questions → simulado → answer → result → retry & cancel', async ({
  authedPage: page,
}) => {
  // ─── Step 1: Configure a new certification (3-step wizard) ───────────────

  await page.goto('/certifications/configure');

  // Switch to "New Certification" tab (PT: "Nova Certificação" / EN: "Add new Certification")
  await page.getByRole('tab', { name: /Nova Certifica|Add new Certification/i }).click();

  // Step 1 — fill basic info
  await page.getByLabel(/Título da Certificação|Certification Title/i).fill(E2E_CERT_LABEL);

  // Advance to Step 2 via the "Definir Tópicos / Define Topics" button
  await page.getByRole('button', { name: /Definir Tópicos|Define Topics/i }).click();

  // Step 2 — add a topic
  await page.getByLabel(/Nome do Tópico|Topic Name/i).fill(E2E_CERT_TOPIC);
  await page.getByRole('button', { name: /Adicionar tópico|Add topic/i }).click();

  // Advance to Step 3 via "Finalizar Certificação / Finalize Certification"
  await page.getByRole('button', { name: /Finalizar Certificação|Finalize Certification/i }).click();

  // Step 3 — create the certification
  await page
    .getByRole('button', { name: /Finalizar e Criar Certificação|Finalize & Create Certification/i })
    .click();

  // Wait for success: either a toast or navigation away from step 3
  await expect(page.getByRole('tab', { name: /Minhas certifica|My certifications/i })).toBeVisible({
    timeout: 10_000,
  });

  // ─── Step 2: Generate questions ──────────────────────────────────────────

  await page.goto('/certifications/questions');

  // Select the certification we just created
  await page.getByLabel(/Selecione uma Certificação|Select a Certification/i).click();
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Select the topic
  await page.getByLabel(/Selecione um Tópico|Select a Topic/i).click();
  await page.getByRole('option', { name: E2E_CERT_TOPIC }).click();

  // Set number of questions (use 3 to stay within mock data)
  const numQuestionsInput = page.getByLabel(/Número de Questões|Number of Questions/i);
  await numQuestionsInput.fill('3');

  // Click Generate — API is mocked, returns 3 questions immediately
  await page.getByRole('button', { name: /Gerar|Generate/i }).click();

  // Wait for the generated questions list to appear
  await expect(page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i })).toBeVisible({
    timeout: 15_000,
  });

  // Select all generated questions
  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click();

  // Save selected questions
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected questions/i }).click();

  // Wait for success toast or list to clear
  await page.waitForTimeout(1_500);

  // ─── Step 3: Create a simulado ────────────────────────────────────────────

  await page.goto('/certifications/simulados');

  // Switch to the "New Mock Exam" tab (PT: likely "Novo Simulado" / EN: "New Mock Exam")
  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // Select certification
  await page.getByLabel(/Selecione uma Certificação|Select a Certification/i).click();
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Set total questions to 3
  await page.getByLabel(/Total de questões|Total Questions/i).fill('3');

  // Click "Criar Simulado / Create Mock Exam"
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for the simulado to be created — switch to the list tab
  await page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i }).click();

  // The new simulado should appear in the list; click "Responder / Answer"
  const answerButton = page.getByRole('button', { name: /Responder|Answer/i }).first();
  await expect(answerButton).toBeVisible({ timeout: 10_000 });
  await answerButton.click();

  // Should navigate to the attempt page
  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // ─── Step 4: Answer the simulado ──────────────────────────────────────────

  // For each question, click the first radio option then confirm (save)
  const radioGroups = page.locator('[role="radiogroup"]');
  const groupCount = await radioGroups.count();

  for (let i = 0; i < groupCount; i++) {
    const group = radioGroups.nth(i);
    // Click the first radio button in this group
    await group.getByRole('radio').first().click();

    // The confirm/save button appears after a selection — click it if visible
    const saveButton = page.getByRole('button', { name: /Salvar|Save|Submit/i }).first();
    const isSaveVisible = await saveButton.isVisible().catch(() => false);
    if (isSaveVisible) {
      await saveButton.click();
      await page.waitForTimeout(300);
    }
  }

  // Re-check all radio groups are answered and click save per question if needed
  // (some questions may need an explicit confirm after radio selection)
  const submitButtons = page.locator('button[type="submit"]');
  const submitCount = await submitButtons.count();
  for (let i = 0; i < submitCount; i++) {
    const btn = submitButtons.nth(i);
    const isVisible = await btn.isVisible().catch(() => false);
    if (isVisible) {
      await btn.click();
      await page.waitForTimeout(300);
    }
  }

  // Click "Finalizar Simulado / Finish Exam"
  await page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i }).click();

  // Wait for redirect to the result page
  await expect(page).toHaveURL(/\/resultado\//, { timeout: 15_000 });

  // ─── Step 5: Analyze result ───────────────────────────────────────────────

  // The score should be visible — matches "{N} / {M} acertos" (PT) or "{N} / {M} correct" (EN)
  await expect(page.getByText(/\d+\s*\/\s*\d+\s*(acertos|correct)/i)).toBeVisible({ timeout: 10_000 });

  // "Tentar novamente / Try again" button should be present
  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();

  // ─── Step 6: New attempt and cancel ──────────────────────────────────────

  // Click "Tentar novamente / Try again"
  await page.getByRole('button', { name: /Tentar novamente|Try again/i }).click();

  // Should open a new attempt page
  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // Cancel the attempt — button "Cancelar tentativa / Cancel attempt"
  await page.getByRole('button', { name: /Cancelar tentativa|Cancel attempt/i }).click();

  // A modal should appear asking to discard
  // Title: "Descartar esta tentativa? / Discard this attempt?"
  await expect(page.getByText(/Descartar esta tentativa\?|Discard this attempt\?/i)).toBeVisible({ timeout: 5_000 });

  // Confirm discard: "Descartar tentativa / Discard attempt"
  await page.getByRole('button', { name: /Descartar tentativa|Discard attempt/i }).click();

  // Should navigate back to the simulados list
  await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
  await expect(page).not.toHaveURL(/\/tentativa\//, { timeout: 5_000 });
});
