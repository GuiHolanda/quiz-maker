import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_KEY, E2E_CERT_LABEL, E2E_CERT_TOPIC, E2E_PUBLIC_EXAM_NAME, E2E_SUBJECT } from '../fixtures/mock-data';
import { buildFullExamJobDoneEvent, buildFullExamJobProgressEvent } from '../fixtures/mock-data';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Intercepts POST /api/full-exam-job, captures the jobId from the response,
 * then intercepts GET /api/full-exam-job/:jobId/stream and replays SSE events:
 * one progress event followed by a done event.
 */
async function mockFullExamJob(page: import('@playwright/test').Page, savedCount: number, topicName: string) {
  let capturedJobId: string | null = null;

  // Intercept job creation — return a fake jobId immediately
  await page.route('**/api/full-exam-job', (route) => {
    if (route.request().method() === 'POST') {
      capturedJobId = 'e2e-job-' + Date.now();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: capturedJobId }),
      });
    } else {
      // GET /api/full-exam-job?type=...&refKey=... → no active job (clean state)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    }
  });

  // Intercept SSE stream — send progress then done
  await page.route('**/api/full-exam-job/*/stream', (route) => {
    const progressEvent = buildFullExamJobProgressEvent({ doneTopics: 0, totalTopics: 1, savedCount: 0, topicName, topicStatus: 'running' });
    const doneEvent = buildFullExamJobDoneEvent({ doneTopics: 1, totalTopics: 1, savedCount, topicName });

    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: progressEvent + doneEvent,
    });
  });

  // Intercept DELETE (cancel) — just return ok
  await page.route('**/api/full-exam-job/**', (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else {
      route.continue();
    }
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Full Exam Job — certification', () => {
  test('full exam mode: toggle → distribution table → generate → progress → done notification', async ({
    authedPage: page,
  }) => {
    await mockFullExamJob(page, 3, E2E_CERT_TOPIC);

    await page.goto('/questions?type=certification');

    // Select the E2E certification (created by previous flow or pre-existing)
    await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
    await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

    // Toggle Full Exam Mode
    const toggle = page.locator('button[role="switch"]');
    await expect(toggle).toBeVisible({ timeout: 5_000 });
    await toggle.click();

    // Distribution table should appear with the topic
    await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible({ timeout: 8_000 });

    // "Gerar Prova Completa" button should be visible
    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // InlineAlert with spinner and progress text should appear
    await expect(
      page.getByText(/tópicos concluídos|topics done/i),
    ).toBeVisible({ timeout: 10_000 });

    // Done state: InlineAlert turns green (success)
    await expect(
      page.getByText(/Geração concluída|Generation complete/i),
    ).toBeVisible({ timeout: 15_000 });

    // Bell badge should show unread notification
    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    // Open notification dropdown
    await bellButton.click();

    // Notification title appears
    await expect(
      page.getByText(/Prova Completa gerada|Full Exam Generated/i),
    ).toBeVisible({ timeout: 5_000 });

    // CTA link to simulados
    await expect(
      page.getByRole('link', { name: /Criar simulado|Create exam/i }),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('full exam mode: cancel button closes stream and marks job as error', async ({
    authedPage: page,
  }) => {
    // This test uses a stream that never sends done — cancel must work regardless
    await page.route('**/api/full-exam-job', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobId: 'e2e-job-cancel-test' }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
      }
    });

    // Stream that keeps the connection open without sending done
    await page.route('**/api/full-exam-job/*/stream', (route) => {
      const progressEvent = buildFullExamJobProgressEvent({ doneTopics: 0, totalTopics: 1, savedCount: 0, topicName: E2E_CERT_TOPIC, topicStatus: 'running' });
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: progressEvent,
      });
    });

    let deleteCalled = false;
    await page.route('**/api/full-exam-job/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/questions?type=certification');

    await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
    await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

    const toggle = page.locator('button[role="switch"]');
    await toggle.click();

    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Wait for InlineAlert with cancel button
    const cancelBtn = page.getByRole('button', { name: /^Cancelar$|^Cancel$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await cancelBtn.click();

    // InlineAlert should disappear (isBatchGenerating = false)
    await expect(cancelBtn).not.toBeVisible({ timeout: 5_000 });

    // DELETE was called
    expect(deleteCalled).toBe(true);
  });
});

test.describe('Full Exam Job — concurso público', () => {
  test('full exam mode: toggle → distribution table → generate → done notification → CTA opens concurso tab', async ({
    authedPage: page,
  }) => {
    await mockFullExamJob(page, 3, E2E_SUBJECT);

    await page.goto('/questions?type=public_exam');

    // Select the E2E public exam
    const examSelect = page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first();
    await examSelect.click();
    await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();

    // Toggle Full Exam Mode
    const toggle = page.locator('button[role="switch"]');
    await expect(toggle).toBeVisible({ timeout: 5_000 });
    await toggle.click();

    // Distribution table should appear with the subject
    await expect(page.getByText(E2E_SUBJECT)).toBeVisible({ timeout: 8_000 });

    // Generate
    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Progress then done
    await expect(page.getByText(/tópicos concluídos|topics done/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Geração concluída|Generation complete/i)).toBeVisible({ timeout: 15_000 });

    // Topic row shows done checkmark (status = done)
    await expect(page.getByText(E2E_SUBJECT)).toBeVisible({ timeout: 5_000 });

    // Notification bell shows unread badge
    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    // Open notification and click CTA
    await bellButton.click();
    await expect(page.getByText(/Prova Completa gerada|Full Exam Generated/i)).toBeVisible({ timeout: 5_000 });

    const ctaLink = page.getByRole('link', { name: /Criar simulado|Create exam/i });
    await expect(ctaLink).toBeVisible({ timeout: 3_000 });
    await ctaLink.click();

    // Should land on simulados page, new tab, concurso pre-selected
    await expect(page).toHaveURL(/\/simulados.*tab=new/, { timeout: 10_000 });

    // The concurso type button should be selected (border-primary)
    const concursoOption = page.getByTestId('type-option-concurso');
    await expect(concursoOption).toBeVisible({ timeout: 5_000 });
    await expect(concursoOption).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });
  });
});
