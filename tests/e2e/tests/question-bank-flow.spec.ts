import { test, expect } from '../fixtures/auth.fixture';
import {
  E2E_CERT_KEY,
  E2E_CERT_LABEL,
  E2E_CERT_TOPIC,
} from '../fixtures/mock-data';

/**
 * Question Bank E2E — 4 steps:
 *
 * 1. Ensure a certification exists.
 * 2. Generate and save 3 questions with BANK-specific text (distinct from cert-flow.spec).
 * 3. Verify visible in /question-bank, test filters and search.
 * 4. Delete one and verify it disappears.
 *
 * Key design decision: we override the question-generator mock with texts containing
 * "_BANK_" so these questions are never confused with the ones saved by cert-flow.spec
 * (which may be referenced by a simulado and would fail with FK 500 on delete).
 */

const BANK_Q1 = 'BANK_Q1: Which service provides object storage in S3?';
const BANK_Q2 = 'BANK_Q2: Which service provides compute in EC2?';
const BANK_Q3 = 'BANK_Q3: Which service is a managed relational database RDS?';

const BANK_TOPIC = 'BANK_ONLY_TOPIC';

const bankMockQuestions = [
  {
    id: 9801,
    certificationTitle: E2E_CERT_LABEL,
    text: BANK_Q1,
    correctCount: 1,
    topic: BANK_TOPIC,
    difficulty: 'medium',
    options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
    topicSubarea: undefined,
  },
  {
    id: 9802,
    certificationTitle: E2E_CERT_LABEL,
    text: BANK_Q2,
    correctCount: 1,
    topic: BANK_TOPIC,
    difficulty: 'easy',
    options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' },
    topicSubarea: undefined,
  },
  {
    id: 9803,
    certificationTitle: E2E_CERT_LABEL,
    text: BANK_Q3,
    correctCount: 1,
    topic: BANK_TOPIC,
    difficulty: 'hard',
    options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' },
    topicSubarea: undefined,
  },
];

// Close a HeroUI multi-select dropdown by clicking outside (Escape reverts in React Aria)
async function closeDropdown(page: import('@playwright/test').Page) {
  await page.getByRole('heading', { name: /Banco de Questões|Question Bank/i }).click();
  await page.waitForTimeout(300);
}

test('question bank: generate questions → verify in bank → filter → search → delete', async ({
  authedPage: page,
}, testInfo) => {
  testInfo.setTimeout(90_000);

  // Override the generator mock with BANK-specific texts
  await page.route('**/api/certification/question-generator**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bankMockQuestions),
    });
  });

  // ── Step 1: Ensure certification exists ──────────────────────────────────

  await page.goto('/certifications/configure');
  const certListTab = page.getByRole('tab', { name: /Minhas certifica|My certifications/i });
  await certListTab.click();

  let certAlreadyExists = false;
  try {
    await expect(page.getByText(E2E_CERT_LABEL).first()).toBeVisible({ timeout: 5_000 });
    certAlreadyExists = true;
  } catch {
    certAlreadyExists = false;
  }

  if (!certAlreadyExists) {
    await page.getByRole('tab', { name: /Nova Certifica|Add new Certification/i }).click();
    await page.getByLabel(/Título da Certificação|Certification Title/i).fill(E2E_CERT_LABEL);
    await page.getByLabel(/Código da Certificação|Certification Code/i).fill(E2E_CERT_KEY);
    await page.getByRole('button', { name: /Definir Tópicos|Define Topics/i }).click();
    await page.getByRole('button', { name: /Adicionar Domínio|Add Domain/i }).click();
    await page.getByLabel(/Nome do Domínio|Topic Name/i).first().fill(E2E_CERT_TOPIC);
    const weightInputs = page.getByRole('spinbutton');
    await weightInputs.first().fill('0');
    await weightInputs.nth(1).fill('100');
    await page.getByRole('button', { name: /Finalizar Certificação|Finalize Certification/i }).click();
    await page.getByRole('button', { name: /Finalizar e Criar Certificação|Finalize & Create Certification/i }).click();
    await expect(certListTab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
  }

  // ── Step 2: Generate and save 3 BANK questions ───────────────────────────

  await page.goto('/certifications/questions');

  await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

  await page.getByRole('button', { name: /Selecione um Tópico|Select a Topic/i }).click();
  await expect(page.getByRole('option', { name: E2E_CERT_TOPIC })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: E2E_CERT_TOPIC }).click();

  await page.getByLabel(/Número de Questões|Number of Questions/i).fill('3');
  await page.getByRole('button', { name: /^Gerar$|^Generate$/i }).click();

  // Verify BANK-specific texts appear (not the cert-flow texts)
  await expect(page.getByText('BANK_Q1').first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('checkbox', { name: /Selecionar tudo|Select all/i }).click({ force: true });
  await page.getByRole('button', { name: /Salvar Questões Selecionadas|Save Selected questions/i }).click();

  await expect(page.getByText(/Questões salvas|Questions saved/i)).toBeVisible({ timeout: 15_000 });

  // ── Step 3: Verify in Question Bank ──────────────────────────────────────

  await page.goto('/question-bank');

  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(BANK_Q2).first()).toBeVisible();
  await expect(page.getByText(BANK_Q3).first()).toBeVisible();

  // ── Step 3a: Filter by source ─────────────────────────────────────────────

  await page.getByRole('button', { name: /Todas as fontes|All sources/i }).first().click();
  await expect(page.getByRole('option', { name: new RegExp(E2E_CERT_LABEL, 'i') })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: new RegExp(E2E_CERT_LABEL, 'i') }).click();
  await closeDropdown(page);

  await expect(page.getByRole('button', { name: /Limpar filtros|Clear filters/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(BANK_Q1).first()).toBeVisible();

  await page.getByRole('button', { name: /Limpar filtros|Clear filters/i }).click();
  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 8_000 });

  // ── Step 3b: Filter by difficulty=hard ───────────────────────────────────
  // BANK_Q3 has difficulty=hard; Q1=medium, Q2=easy

  await page.getByRole('button', { name: /Dificuldade|Difficulty/i }).first().click();
  await expect(page.getByRole('option', { name: /Difícil|Hard/i })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('option', { name: /Difícil|Hard/i }).click();
  await closeDropdown(page);

  await expect(page.getByRole('button', { name: /Limpar filtros|Clear filters/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(BANK_Q3).first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(BANK_Q1).first()).not.toBeVisible();
  await expect(page.getByText(BANK_Q2).first()).not.toBeVisible();

  await page.getByRole('button', { name: /Limpar filtros|Clear filters/i }).click();
  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 8_000 });

  // ── Step 3c: Free text search ─────────────────────────────────────────────

  const searchInput = page.getByPlaceholder('Buscar questões…');
  await searchInput.fill('BANK_Q1');

  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(BANK_Q2).first()).not.toBeVisible();
  await expect(page.getByText(BANK_Q3).first()).not.toBeVisible();

  // Navigate fresh to clear search — avoids useDeferredValue abort race condition
  await page.goto('/question-bank');
  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(BANK_Q2).first()).toBeVisible();
  await expect(page.getByText(BANK_Q3).first()).toBeVisible();

  // ── Step 4: Delete BANK_Q1 ────────────────────────────────────────────────
  // Navigate fresh so there's no pending search state, then target BANK_Q1
  // by its unique text. BANK questions are never referenced by a simulado,
  // so the DELETE won't hit a FK constraint.

  await page.goto('/question-bank');
  await expect(page.getByText(BANK_Q1).first()).toBeVisible({ timeout: 10_000 });

  const q1Card = page
    .locator('.bg-content1.border.border-default-200.rounded-xl')
    .filter({ hasText: BANK_Q1 })
    .first();
  await expect(q1Card).toBeVisible();

  await q1Card.getByRole('button', { name: /Excluir questão|Delete question/i }).click();

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  const confirmDeleteBtn = page.getByRole('dialog').getByRole('button', { name: /^Excluir$|^Delete$/i });
  await expect(confirmDeleteBtn).toBeVisible({ timeout: 5_000 });

  const [deleteResponse] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        (resp.url().includes('/api/certification/browse-questions') ||
          resp.url().includes('/api/public-exam/browse-questions')) &&
        resp.request().method() === 'DELETE',
      { timeout: 10_000 },
    ),
    confirmDeleteBtn.click(),
  ]);

  expect(deleteResponse.status()).toBe(200);

  await expect(page.getByText(/Questão excluída|Question deleted/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(BANK_Q1).first()).not.toBeVisible({ timeout: 8_000 });

  // Navigate clean to verify Q2 and Q3 are still present
  await page.goto('/question-bank');
  await expect(page.getByText(BANK_Q2).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(BANK_Q3).first()).toBeVisible();
});
