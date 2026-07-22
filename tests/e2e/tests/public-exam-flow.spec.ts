import { test, expect } from '../fixtures/auth.fixture';
import { E2E_PUBLIC_EXAM_NAME, E2E_EXAM_BOARD, E2E_SUBJECT } from '../fixtures/mock-data';

test('public exam full flow: configure → questions → simulado → answer → result → retry & cancel', async ({
  authedPage: page,
}) => {
  // ── Step 1: Configure a new concurso ──────────────────────────────────────

  await page.goto('/public-exams/configure');

  await page.getByRole('tab', { name: /Novo Concurso/i }).click();

  // Step 1 — basic info: name + banca
  await page.getByLabel(/Nome do Concurso/i).fill(E2E_PUBLIC_EXAM_NAME);

  // Banca is an Autocomplete with allowsCustomValue.
  // Fill → Escape (closes dropdown without clearing) → confirm the value persists.
  const bancaInput = page.getByLabel(/Banca/i).first();
  await bancaInput.fill(E2E_EXAM_BOARD);
  await bancaInput.press('Escape');
  await page.waitForTimeout(300);
  // Verify the value stayed
  await expect(bancaInput).toHaveValue(E2E_EXAM_BOARD);

  // Fill required totalQuestions field
  await page.getByLabel(/Total de Quest|Total Questions/i).fill('60');

  // Advance to Step 2 — "Próximo: Definir Matérias" (PT) / "Next: Define Subjects" (EN)
  await page.getByRole('button', { name: /Pr[oó]ximo.*Mat[eé]rias|Next.*Subject/i }).click();

  // Step 2 — add one subject
  await page.getByRole('button', { name: /Adicionar Mat[eé]ria|Add Subject/i }).click();

  const subjectNameInput = page.getByLabel(/Nome da Mat[eé]ria/i).first();
  await subjectNameInput.fill(E2E_SUBJECT);

  // Set min=100, max=100 so weightage is valid (only one subject)
  const percentInputs = page.getByRole('spinbutton');
  await percentInputs.first().fill('100');
  await percentInputs.nth(1).fill('100');

  // Advance to Step 3
  await page.getByRole('button', { name: /Finalizar Concurso|Finalize.*Exam/i }).click();

  // Step 3 — create
  await page.getByRole('button', { name: /Finalizar e Criar Concurso|Finalize and Create/i }).click();

  // Wait for the tab to become SELECTED — only happens after onBackToLibrary() fires,
  // which requires the save API to complete. toBeVisible() alone passes immediately since
  // the tab already exists, causing the browser to abort the in-flight save on the next goto().
  await expect(
    page.getByRole('tab', { name: /Meus concursos|My.*Exams/i }),
  ).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });

  // ── Step 2: Generate questions ────────────────────────────────────────────

  await page.goto('/public-exams/questions?tab=generate');

  // Select exam
  const examSelect = page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first();
  await examSelect.click();
  await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({
    timeout: 8_000,
  });
  await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();

  // Select subject
  const subjectSelect = page.getByRole('button', { name: /Selecione uma Mat[eé]ria|Select.*Subject/i }).first();
  await subjectSelect.click();
  await expect(page.getByRole('option', { name: new RegExp(E2E_SUBJECT, 'i') })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: new RegExp(E2E_SUBJECT, 'i') }).click();

  // Set question count
  await page.getByLabel(/N[uú]mero de Quest[oõ]es|Number of Questions/i).fill('3');

  // Generate — API is mocked
  await page.getByRole('button', { name: /^Gerar$|^Generate$/i }).click();

  // Wait for the generated list toolbar to appear
  await expect(page.getByText(/Selecionar tudo|Select all/i)).toBeVisible({ timeout: 30_000 });

  // Select all
  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click({ force: true });

  // Save
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected/i }).click();

  // Wait for list to clear (questions saved)
  await expect(page.getByText(/Selecionar tudo|Select all/i)).not.toBeVisible({ timeout: 15_000 });

  // ── Step 2b: Verify the success banner appears after save ────────────────

  // After save, the simulados banner appears confirming questions were saved
  await expect(
    page.getByText(/Questões salvas|Questions saved/i),
  ).toBeVisible({ timeout: 5_000 });

  // ── Step 3: Create a simulado ─────────────────────────────────────────────

  await page.goto('/simulados');

  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // Wait for the "Novo Simulado" tab panel to be fully loaded
  await expect(page.getByText(/Que tipo de simulado\?|What kind of mock exam\?/i)).toBeVisible({ timeout: 5_000 });

  // Click the Concurso type option
  await page.getByTestId('type-option-concurso').click();

  // Confirm the mock exam form has mounted
  await expect(page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i })).toBeVisible({
    timeout: 8_000,
  });

  // Wait for form to be ready (skeleton hides while provider loads)
  await expect(page.getByLabel(/Total de quest[oõ]es|Total questions/i)).toBeVisible({ timeout: 10_000 });

  // The PublicExamsProvider restores selectedPublicExam from localStorage (set in step 2).
  // Check if the exam is already pre-selected by inspecting the trigger's data-slot="value" child.
  // HeroUI Select renders the selected item text in a span[data-slot="value"]; it's empty/placeholder
  // text when nothing is selected. If the exam is already selected, clicking the trigger would
  // open the dropdown and clicking the option again would deselect it (React Aria toggle behaviour).
  const triggerValueSpan = page.locator('[data-slot="trigger"] [data-slot="value"]').first();
  const triggerText = await triggerValueSpan.textContent().catch(() => '');
  if (!triggerText || !triggerText.includes(E2E_PUBLIC_EXAM_NAME)) {
    await page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).click();
    const examListbox = page.getByRole('listbox');
    await expect(examListbox).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300);
    const examOption = page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') });
    await expect(examOption).toBeVisible({ timeout: 5_000 });
    await examOption.click();
    await page.waitForTimeout(300);
  }

  // Fill totalQuestions — triggers the distribution useEffect together with selectedPublicExam
  const totalQuestionsInput = page.getByLabel(/Total de quest[oõ]es|Total questions/i);
  await totalQuestionsInput.fill('3');

  // Wait for the distribution section to appear — it only renders when distribution.length > 0,
  // which proves both selectedPublicExam and totalQuestions are committed to state
  await expect(page.getByText(/Distribuição por matéria|Distribution by subject/i)).toBeVisible({
    timeout: 8_000,
  });

  // Create button is enabled once isDistributionValid === true
  await expect(page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i })).toBeEnabled({ timeout: 8_000 });
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for list tab to become visible (creation succeeded)
  await expect(page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i })).toBeVisible({ timeout: 10_000 });

  // ── Step 4: Answer the simulado ───────────────────────────────────────────

  const respondButton = page
    .locator('[data-testid="simulado-card"]', { hasText: E2E_PUBLIC_EXAM_NAME })
    .getByRole('button', { name: /Responder|Continuar|Answer/i })
    .first();
  await expect(respondButton).toBeVisible({ timeout: 10_000 });
  await respondButton.click();

  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 15_000 });

  await expect(page.locator('[role="radiogroup"]').first()).toBeVisible({ timeout: 10_000 });

  const radioGroups = page.locator('[role="radiogroup"]');
  const count = await radioGroups.count();

  for (let i = 0; i < count; i++) {
    const group = radioGroups.nth(i);

    // 1. Select an option
    await group.locator('input').first().dispatchEvent('click');

    // 2. Wait for submit button (rendered only after a selection is in state)
    const card = group.locator('xpath=ancestor::form').first();
    const submitBtn = card.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });

    // 3. Confirm the answer
    await submitBtn.dispatchEvent('click');
    await page.waitForTimeout(200);
  }

  // "Finalizar Simulado" enabled only when all confirmed (canFinish)
  const finalizeBtn = page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i });
  await expect(finalizeBtn).toBeEnabled({ timeout: 10_000 });
  await finalizeBtn.click();

  // finishAttempt PATCH is mocked → navigates to result
  await expect(page).toHaveURL(/\/resultado\//, { timeout: 15_000 });

  // ── Step 5: Analyze result ────────────────────────────────────────────────

  // Score from stub: 2 / 3
  await expect(page.getByText(/\d+\s*\/\s*\d+\s*(acertos|correct)/i)).toBeVisible({ timeout: 10_000 });

  // Subject breakdown accordion should be visible (use first() to avoid strict-mode ambiguity)
  await expect(page.getByText(E2E_SUBJECT).first()).toBeVisible();

  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();

  // ── Step 6: New attempt and cancel ───────────────────────────────────────

  await page.getByRole('button', { name: /Tentar novamente|Try again/i }).click();

  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 15_000 });

  // Cancel
  await page.getByRole('button', { name: /Cancelar tentativa|Cancel attempt/i }).click();

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar esta tentativa\?|Discard this attempt\?/i)).toBeVisible();

  await page.getByRole('button', { name: /Descartar tentativa|Discard attempt/i }).click();

  await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i })).toBeVisible({ timeout: 10_000 });
});

test('public exam wizard: discard draft cancels and returns to list', async ({ authedPage: page }) => {
  await page.goto('/public-exams/configure');

  await page.getByRole('tab', { name: /Novo Concurso/i }).click();

  // Fill name so hasDraft becomes true
  await page.getByLabel(/Nome do Concurso/i).fill('Concurso Para Descartar');

  const discardBtn = page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i });
  await expect(discardBtn).toBeVisible();
  await discardBtn.click();

  // Confirmation modal
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar rascunho\?|Discard draft\?/i)).toBeVisible();

  // Confirm
  await page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i }).last().click();

  // Back to list
  await expect(page.getByRole('tab', { name: /Meus concursos|My.*Exams/i })).toBeVisible({ timeout: 5_000 });
});
