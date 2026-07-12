import { test, expect } from '../fixtures/auth.fixture';
import { E2E_PUBLIC_EXAM_NAME, E2E_EXAM_BOARD, E2E_SUBJECT } from '../fixtures/mock-data';

test('public exam full flow: configure -> questions -> simulado -> attempt -> result -> cancel', async ({
  authedPage: page,
}) => {
  // ── Step 1: Configure a new concurso ──────────────────────────────────────

  await page.goto('/public-exams/configure');

  // Switch to "Novo Concurso" tab
  await page.getByRole('tab', { name: /Novo Concurso/i }).click();

  // Step 1 — basic info: name + banca
  await page.getByLabel(/Nome do Concurso/i).fill(E2E_PUBLIC_EXAM_NAME);

  // Banca is an Autocomplete — type into the input element
  const bancaInput = page.getByLabel(/Banca/i).first();
  await bancaInput.fill(E2E_EXAM_BOARD);
  // Press Tab to dismiss the autocomplete dropdown and move focus away
  await bancaInput.press('Tab');
  // Wait briefly for dropdown animation to complete
  await page.waitForTimeout(500);

  // Click "Próximo: Definir Matérias" to advance to step 2
  await page.getByRole('button', { name: /Pr[oó]ximo.*Mat[eé]rias|Next.*Subject/i }).click({ force: true });

  // Step 2 — define subjects: add one subject with 100% weight
  await page.getByRole('button', { name: /Adicionar Mat[eé]ria|Add Subject/i }).click();

  // Fill in the subject name field (first instance after clicking add)
  const subjectNameInput = page.getByLabel(/Nome da Mat[eé]ria/i).first();
  await subjectNameInput.fill(E2E_SUBJECT);

  // Set minQuestions and maxQuestions to 100 so weightage is valid
  const percentInputs = page.getByRole('spinbutton');
  await percentInputs.first().fill('100');
  await percentInputs.nth(1).fill('100');

  // Click "Finalizar Concurso" to advance to step 3
  await page.getByRole('button', { name: /Finalizar Concurso|Finalize.*Exam/i }).click();

  // Step 3 — review and save
  await page.getByRole('button', { name: /Finalizar e Criar Concurso|Finalize and Create/i }).click();

  // Wait for redirect back to the list tab (toast appears, URL stays)
  await expect(page.getByRole('tab', { name: /Meus concursos|My.*Exams/i })).toBeVisible({ timeout: 10_000 });

  // ── Step 2: Generate questions ────────────────────────────────────────────

  await page.goto('/public-exams/questions?tab=generate');

  // Select exam — the PublicExamManager Select label is "Selecione um Concurso"
  const examSelect = page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first();
  await examSelect.click();
  await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();

  // Select subject
  const subjectSelect = page.getByRole('button', { name: /Selecione uma Mat[eé]ria|Select.*Subject/i }).first();
  await subjectSelect.click();
  await expect(page.getByRole('option', { name: new RegExp(E2E_SUBJECT, 'i') })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: new RegExp(E2E_SUBJECT, 'i') }).click();

  // Set number of questions before generating
  await page.getByLabel(/N[uú]mero de Quest[oõ]es|Number of Questions/i).fill('3');

  // Click generate (the mocked API will respond immediately)
  await page.getByRole('button', { name: /Gerar|Generate/i }).click();

  // Wait for generated questions list to appear
  await expect(page.getByText(/Selecionar tudo|Select all/i)).toBeVisible({ timeout: 30_000 });

  // Select all questions — use force click for HeroUI hidden checkbox input
  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click({ force: true });

  // Save selected questions
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected/i }).click();

  // Wait for save to complete (list disappears)
  await expect(page.getByText(/Selecionar tudo|Select all/i)).not.toBeVisible({ timeout: 15_000 });

  // ── Step 3: Create a simulado ─────────────────────────────────────────────

  await page.goto('/public-exams/simulados');

  // Switch to "Novo Simulado" / "New Mock Exam" tab
  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // The PublicExamsProvider restores selectedPublicExam from localStorage (set by step 2).
  // Wait for the form to finish loading (skeleton shows until getPublicExamBrowseSummary resolves).
  // We detect form readiness by the presence of the "Total de questões" input.
  const totalQuestionsInput = page.getByLabel(/Total de quest[oõ]es|Total questions/i);
  await expect(totalQuestionsInput).toBeVisible({ timeout: 10_000 });

  // If the exam wasn't restored from localStorage, select it manually.
  const examTrigger = page.locator('[data-slot="trigger"]').filter({ has: page.locator('[data-slot="value"]') }).first();
  const triggerText = await examTrigger.textContent().catch(() => '');
  if (!triggerText || triggerText.includes('Buscar concursos')) {
    await examTrigger.click();
    await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();
    await page.waitForTimeout(500);
  }

  // Fill total questions; the distribution useEffect fires when both fields are set
  await totalQuestionsInput.clear();
  await totalQuestionsInput.fill('3');
  await page.waitForTimeout(800);

  // The "Criar Simulado" button is enabled when selectedPublicExam is set and distribution is valid.
  // Wait for it to be enabled before clicking.
  await expect(page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i })).toBeEnabled({ timeout: 8_000 });
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for redirect back to list tab
  await expect(page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i })).toBeVisible({ timeout: 10_000 });

  // ── Step 4: Answer the simulado ───────────────────────────────────────────

  // Find the simulado card and click "Responder" / "Answer"
  // (or "Continuar" if there's an in-progress attempt from a prior run)
  const respondButton = page.getByRole('button', { name: /Responder|Continuar|Answer/i }).first();
  await expect(respondButton).toBeVisible({ timeout: 10_000 });
  await respondButton.click();

  // Wait for the attempt page (URL contains /tentativa/)
  await page.waitForURL(/\/tentativa\//, { timeout: 15_000 });

  // Wait for questions to load
  await expect(page.locator('[role="radiogroup"]').first()).toBeVisible({ timeout: 10_000 });

  // Same dispatchEvent approach as certification spec
  const radioGroups = page.locator('[role="radiogroup"]');
  const count = await radioGroups.count();

  for (let i = 0; i < count; i++) {
    const group = radioGroups.nth(i);
    const firstInput = group.locator('input').first();
    await firstInput.dispatchEvent('click');
    await page.waitForTimeout(400);
    const submitBtn = page.locator('form:has([role="radiogroup"])').nth(i).locator('button[type="submit"]');
    if (await submitBtn.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(300);
    }
  }

  await page.waitForTimeout(800);

  // Wait for "Finalizar Simulado" to become enabled before clicking
  await expect(page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i })).toBeEnabled({ timeout: 5_000 });

  // Click "Finalizar Simulado" / "Finish Exam"
  await page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i }).click();

  // Wait for result page
  await page.waitForURL(/\/resultado\//, { timeout: 15_000 });

  // ── Step 5: Analyze result ────────────────────────────────────────────────

  // Score should be visible (pattern: "X / Y acertos" or "X / Y correct")
  await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible({ timeout: 10_000 });

  // "Try again" / "Tentar novamente" button should be visible
  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();

  // ── Step 6: New attempt and cancel ───────────────────────────────────────

  // Click "Try again" to start a new attempt
  await page.getByRole('button', { name: /Tentar novamente|Try again/i }).click();

  // Wait for the new attempt page
  await page.waitForURL(/\/tentativa\//, { timeout: 15_000 });

  // Click "Cancelar tentativa" / "Cancel attempt"
  await page.getByRole('button', { name: /Cancelar tentativa|Cancel attempt/i }).click();

  // The discard confirmation modal should appear
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar esta tentativa\?|Discard this attempt\?/i)).toBeVisible();

  // Click "Descartar tentativa" / "Discard attempt" to confirm
  await page.getByRole('button', { name: /Descartar tentativa|Discard attempt/i }).click();

  // Should navigate back to simulados list
  await page.waitForURL(/\/public-exams\/simulados/, { timeout: 10_000 });
  await expect(page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i })).toBeVisible({ timeout: 10_000 });
});
