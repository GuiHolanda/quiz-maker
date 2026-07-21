import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC } from '../fixtures/mock-data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createCertSimulado(page: import('@playwright/test').Page) {
  await page.goto('/simulados');
  await page.getByRole('tab', { name: /Novo Simulado|New Mock Exam/i }).click();

  // Wait for cert form (Certification is the default in the type picker)
  await expect(
    page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }),
  ).toBeVisible({ timeout: 8_000 });

  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  const totalInput = page.getByLabel(/Total de questões|Total Questions/i);
  await expect(totalInput).toBeVisible({ timeout: 8_000 });
  await totalInput.fill('3');

  await expect(page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i })).toBeEnabled({
    timeout: 8_000,
  });
  await page.getByRole('button', { name: /Criar Simulado|Create Mock Exam/i }).click();

  // Wait for creation success toast
  await expect(page.getByText(/Simulado criado|Mock exam created/i)).toBeVisible({ timeout: 10_000 });
}

// ─── Test: Delete a simulado ──────────────────────────────────────────────────

test('simulados: delete a simulado via trash icon and confirmation modal', async ({ authedPage: page }) => {
  await createCertSimulado(page);

  await page.goto('/simulados');

  const certCards = page.locator('[data-testid="simulado-card"]', { hasText: E2E_CERT_LABEL });

  // Wait for the provider to finish loading and the newly created card to appear
  await expect(certCards.first()).toBeVisible({ timeout: 10_000 });

  const countBefore = await certCards.count();
  expect(countBefore).toBeGreaterThan(0);

  // Open the trash modal on the first cert card
  const targetCard = certCards.first();
  await targetCard.getByRole('button', { name: /Delete|Excluir|Deletar/i }).click();

  // Confirmation modal appears
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible({ timeout: 5_000 });
  await expect(modal.getByText(/Delete mock exam|Excluir simulado|Deletar simulado/i)).toBeVisible();
  await expect(modal.getByText(/cannot be undone|não pode ser desfeita/i)).toBeVisible();

  // Confirm deletion
  await modal.getByRole('button', { name: /^Delete$|^Excluir$|^Deletar$/i }).click();

  // Modal closes and success toast appears
  await expect(modal).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Mock exam removed|Simulado removido|deleted/i)).toBeVisible({ timeout: 5_000 });

  // Card count decreased by 1
  await expect(certCards).toHaveCount(countBefore - 1, { timeout: 5_000 });
});

// ─── Test: View attempt history and navigate to result ───────────────────────

test('simulados: view attempt history modal and navigate to result page', async ({ authedPage: page }) => {
  await createCertSimulado(page);

  // Start the attempt and capture simuladoId + attemptId from the URL
  await page.goto('/simulados');
  const card = page.locator('[data-testid="simulado-card"]', { hasText: E2E_CERT_LABEL }).first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.getByRole('button', { name: /Responder|Answer/i }).click();
  await expect(page).toHaveURL(/\/tentativa\//, { timeout: 10_000 });

  // Extract /certifications/simulados/:simuladoId/tentativa/:attemptId
  const tentativaUrl = page.url();
  const urlMatch = tentativaUrl.match(/certifications\/simulados\/(\d+)\/tentativa\/(\d+)/);
  expect(urlMatch).toBeTruthy();
  const [, simuladoId, attemptId] = urlMatch!;

  // Navigate directly to the result page (bypasses finishAttempt DB write)
  // The GET mock in the fixture returns mockCertSimuladoResult for any .../attempts/... GET
  await page.goto(`/certifications/simulados/${simuladoId}/resultado/${attemptId}`);

  // Result page renders with score data
  await expect(page.getByText(/\d+\s*\/\s*\d+\s*(acertos|correct)/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible();
  await expect(page.getByRole('button', { name: /Tentar novamente|Try again/i })).toBeVisible();
});
