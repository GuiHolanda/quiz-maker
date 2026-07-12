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
  await page.getByLabel(/Código da Certificação|Exam Code/i).fill(E2E_CERT_KEY);

  // Advance to Step 2 via the "Definir Tópicos / Define Topics" button
  await page.getByRole('button', { name: /Definir Tópicos|Define Topics/i }).click();

  // Step 2 — add a domain (topic row), fill its name, and set max weight to 100
  await page.getByRole('button', { name: /Adicionar Domínio|Add topic/i }).click();
  await page.getByLabel(/Nome do Domínio|Topic Name/i).first().fill(E2E_CERT_TOPIC);
  // Set maxQuestions to 100 so weightage is valid (required to enable Finalizar button)
  const weightInputs = page.getByRole('spinbutton');
  await weightInputs.first().fill('0');
  await weightInputs.nth(1).fill('100');

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

  await page.goto('/certifications/questions?tab=generate');

  // Select the certification we just created
  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Select the topic
  await page.getByRole('button', { name: /Selecione um Tópico|Select a Topic/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_TOPIC })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: E2E_CERT_TOPIC }).click();

  // Set number of questions (use 3 to stay within mock data)
  const numQuestionsInput = page.getByLabel(/Número de Questões|Number of Questions/i);
  await numQuestionsInput.fill('3');

  // Click Generate — API is mocked, returns 3 questions immediately
  await page.getByRole('button', { name: /Gerar|Generate/i }).click();

  // Wait for the generated questions list to appear
  await expect(page.getByText(/E2E Question/i).first()).toBeVisible({ timeout: 15_000 });

  // Select all generated questions — use force click for HeroUI hidden checkbox input
  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click({ force: true });

  // Save selected questions
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected questions/i }).click();

  // Wait for success toast or list to clear
  await page.waitForTimeout(1_500);

  // ─── Step 3: Create a simulado ────────────────────────────────────────────

  await page.goto('/certifications/simulados');

  // Switch to the "New Mock Exam" tab (PT: likely "Novo Simulado" / EN: "New Mock Exam")
  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // Select certification
  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  // Set total questions to 3
  await page.getByLabel(/Total de questões|Total Questions/i).fill('3');

  // Click "Criar Simulado / Create Mock Exam"
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for the simulado to be created — switch to the list tab
  await page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i }).click();

  // The new simulado should appear in the list; click "Responder / Answer"
  // (or "Continuar" if there's an in-progress attempt from a prior run)
  const answerButton = page.getByRole('button', { name: /Responder|Continuar|Answer/i }).first();
  await expect(answerButton).toBeVisible({ timeout: 10_000 });
  await answerButton.click();

  // Should navigate to the attempt page
  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // ─── Step 4: Answer the simulado ──────────────────────────────────────────

  // HeroUI Radio hides the actual <input type="radio"> with opacity-[0.0001].
  // React Aria handles selection via pointer events on the wrapper element.
  // The most reliable approach: dispatch a native click event on each hidden radio input
  // via page.evaluate, which bypasses Playwright's actionability checks and directly
  // triggers React Aria's onChange → onValueChange → our applySelection handler.

  await page.evaluate(() => {
    const radioGroups = document.querySelectorAll('[role="radiogroup"]');
    radioGroups.forEach((group) => {
      const firstInput = group.querySelector('input[type="radio"]');
      if (firstInput) {
        firstInput.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        firstInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  await page.waitForTimeout(600);

  // After selecting, button[type="submit"] appears in each form — click them all
  const submitButtons = page.locator('form:has([role="radiogroup"]) button[type="submit"]');
  const btnCount = await submitButtons.count();
  for (let i = 0; i < btnCount; i++) {
    const btn = submitButtons.nth(i);
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(300);
    }
  }

  await page.waitForTimeout(800);

  // Wait for "Finalizar Simulado" to become enabled (all questions confirmed)
  await expect(page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i })).toBeEnabled({ timeout: 10_000 });

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
