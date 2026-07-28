import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../fixtures/mock-data';

// The certification (E2E_CERT_LABEL) and its 3 questions are seeded by globalSetup,
// so this flow starts at question generation — no wizard step needed.
test('full certification journey: questions → simulado → answer → result → retry & cancel', async ({
  authedPage: page,
}) => {
  // ─── Step 1: Generate questions (job mock → awaiting_review → save) ──────

  await page.addInitScript(() => {
    class FakeEventSource extends EventTarget {
      static CONNECTING = 0; static OPEN = 1; static CLOSED = 2;
      readyState = 1; url: string; withCredentials = false;
      onerror: ((e: Event) => void) | null = null;
      onmessage: ((e: MessageEvent) => void) | null = null;
      onopen: ((e: Event) => void) | null = null;
      constructor(url: string) {
        super();
        this.url = url;
        if (url.includes('/api/generation-job/') && url.includes('/stream')) {
          setTimeout(() => {
            this.dispatchEvent(new MessageEvent('awaiting_review', {
              data: JSON.stringify({
                doneTopics: 1,
                totalTopics: 1,
                topics: [{ id: 't1', topicName: 'E2E Topic', questionCount: 3, status: 'done', savedCount: 0, errorMessage: null }],
              }),
            }));
          }, 100);
        }
      }
      close() { this.readyState = 2; }
    }
    (window as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
  });

  await page.route('**/api/generation-job', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobId: 'e2e-cert-job' }) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.goto('/questions?type=certification');

  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible({ timeout: 8_000 });

  await page.getByRole('button', { name: /^Gerar$|^Generate$/i }).click();

  await expect(page.getByText(/Aguardando revis|Awaiting review/i)).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /Salvar todas|Save all/i }).click();

  await expect(page.getByText(/Questões salvas|Questions saved/i)).toBeVisible({ timeout: 10_000 });

  // ─── Step 2: Create a simulado ───────────────────────────────────────────

  await page.goto('/simulados');
  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // The cert is pre-filled by the SIMULADO_NEW_PREFILL_KEY set during save.
  // Wait for the distribution table to confirm the form is ready.
  await expect(page.getByText(/disponíveis|available/i).first()).toBeVisible({ timeout: 10_000 });

  // Ensure total does not exceed the 3 seeded questions.
  const totalInput = page.getByLabel(/Total de questões|Total Questions/i);
  await totalInput.fill('3');

  await expect(page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i })).toBeEnabled({ timeout: 8_000 });
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  await page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i }).click();

  const answerButton = page.getByRole('button', { name: /Responder|Continuar|Answer/i }).first();
  await expect(answerButton).toBeVisible({ timeout: 10_000 });
  await answerButton.click();

  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // ─── Step 3: Answer the simulado ─────────────────────────────────────────

  await expect(page.locator('[role="radiogroup"]').first()).toBeVisible({ timeout: 10_000 });

  const radioGroups = page.locator('[role="radiogroup"]');
  const groupCount = await radioGroups.count();

  for (let i = 0; i < groupCount; i++) {
    const group = radioGroups.nth(i);
    await group.locator('input').first().dispatchEvent('click');
    const submitBtn = group.locator('xpath=ancestor::form').first().locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 5_000 });
    await submitBtn.dispatchEvent('click');
    await page.waitForTimeout(200);
  }

  const finalizeBtn = page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i });
  await expect(finalizeBtn).toBeEnabled({ timeout: 10_000 });
  await finalizeBtn.click();

  await expect(page).toHaveURL(/\/resultado\//, { timeout: 15_000 });

  // ─── Step 4: Analyze result ───────────────────────────────────────────────

  await expect(page.getByText(/\d+\s*\/\s*\d+\s*(acertos|correct)/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/\d+%/i).first()).toBeVisible();
  await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible();
  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();

  // ─── Step 5: New attempt and cancel ──────────────────────────────────────

  await page.getByRole('button', { name: /Tentar novamente|Try again/i }).click();
  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  await page.getByRole('button', { name: /Cancelar tentativa|Cancel attempt/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar esta tentativa\?|Discard this attempt\?/i)).toBeVisible();
  await page.getByRole('button', { name: /Descartar tentativa|Discard attempt/i }).click();

  await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
  await expect(page).not.toHaveURL(/\/tentativa\//, { timeout: 5_000 });
});

test('certification wizard: discard draft cancels and returns to list', async ({ authedPage: page }) => {
  await page.goto('/certifications/configure');

  await page.getByRole('tab', { name: /Nova Certifica|Add new Certification/i }).click();

  await page.getByLabel(/Título da Certificação|Certification Title/i).fill('Cert Para Descartar');

  const discardBtn = page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i });
  await expect(discardBtn).toBeVisible();
  await discardBtn.click();

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Descartar rascunho\?|Discard draft\?/i)).toBeVisible();

  await page.getByRole('button', { name: /Descartar rascunho|Discard Draft/i }).last().click();

  await expect(page.getByRole('tab', { name: /Minhas certifica|My certifications/i })).toBeVisible({
    timeout: 5_000,
  });
});
