import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_KEY, E2E_CERT_LABEL, E2E_CERT_TOPIC, E2E_PUBLIC_EXAM_NAME, E2E_SUBJECT } from '../fixtures/mock-data';
import { buildFullExamJobDoneEvent } from '../fixtures/mock-data';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Injects a fake EventSource into the page that immediately fires a 'done' event
 * for any /api/full-exam-job/:id/stream URL, then mocks the POST endpoint.
 *
 * Playwright's route.fulfill cannot stream SSE events incrementally — the browser
 * EventSource requires a real persistent HTTP connection. Instead we stub the
 * global EventSource so it fires events synchronously from in-page JS.
 */
async function setupFullExamMocks(
  page: import('@playwright/test').Page,
  savedCount: number,
  topicName: string,
) {
  const donePayload = JSON.stringify({
    doneTopics: 1,
    totalTopics: 1,
    savedCount,
    topics: [{ id: 'e2e-topic-1', topicName, questionCount: savedCount, status: 'done', savedCount, errorMessage: null }],
  });

  // Override EventSource before any page script runs
  await page.addInitScript((payload) => {
    class FakeEventSource extends EventTarget {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSED = 2;
      readyState = 1;
      url: string;
      withCredentials = false;
      onerror: ((e: Event) => void) | null = null;
      onmessage: ((e: MessageEvent) => void) | null = null;
      onopen: ((e: Event) => void) | null = null;

      constructor(url: string) {
        super();
        this.url = url;
        // Only intercept the stream endpoint
        if (url.includes('/api/full-exam-job/') && url.includes('/stream')) {
          setTimeout(() => {
            const evt = new MessageEvent('done', { data: payload });
            this.dispatchEvent(evt);
          }, 100);
        }
      }

      close() { this.readyState = 2; }

      addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        super.addEventListener(type, listener, options);
        // Re-fire done immediately if already registered after construction
        if (type === 'done' && this.url.includes('/api/full-exam-job/') && this.url.includes('/stream')) {
          setTimeout(() => {
            const evt = new MessageEvent('done', { data: payload });
            super.dispatchEvent(evt);
          }, 150);
        }
      }
    }
    (window as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
  }, donePayload);

  // Mock POST /api/full-exam-job — return jobId immediately
  await page.route('**/api/full-exam-job', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'e2e-job-fake-123' }),
      });
    } else {
      // GET active job — no active job
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    }
  });

  // Mock DELETE (cancel)
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
  test('full exam mode: toggle → distribution table → generate → done notification', async ({
    authedPage: page,
  }) => {
    await setupFullExamMocks(page, 3, E2E_CERT_TOPIC);

    await page.goto('/questions?type=certification');
    await expect(page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
    await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

    const toggle = page.getByTestId('full-exam-toggle');
    await expect(toggle).toBeVisible({ timeout: 5_000 });
    await toggle.dispatchEvent('click');

    await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible({ timeout: 8_000 });

    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Done state: InlineAlert turns green
    await expect(page.getByText(/Geração concluída|Generation complete/i)).toBeVisible({ timeout: 15_000 });

    // Bell badge shows unread notification
    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    // Open notification dropdown and verify content
    await bellButton.click();
    await expect(page.getByText(/Prova Completa gerada|Full Exam Generated/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('link', { name: /Criar simulado|Create exam/i }).first()).toBeVisible({ timeout: 3_000 });
  });



  test('full exam mode: cancel button resets generating state', async ({
    authedPage: page,
  }) => {
    // Stream that never fires done — verifies cancel works regardless
    await page.addInitScript(() => {
      class NeverDoneEventSource extends EventTarget {
        static CONNECTING = 0; static OPEN = 1; static CLOSED = 2;
        readyState = 1; url: string; withCredentials = false;
        onerror: ((e: Event) => void) | null = null;
        onmessage: ((e: MessageEvent) => void) | null = null;
        onopen: ((e: Event) => void) | null = null;
        constructor(url: string) { super(); this.url = url; }
        close() { this.readyState = 2; }
      }
      (window as unknown as { EventSource: typeof NeverDoneEventSource }).EventSource = NeverDoneEventSource;
    });

    let deleteCalled = false;
    await page.route('**/api/full-exam-job', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobId: 'e2e-cancel-job' }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
      }
    });
    await page.route('**/api/full-exam-job/**', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/questions?type=certification');
    await expect(page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
    await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

    const toggle = page.getByTestId('full-exam-toggle');
    await expect(toggle).toBeVisible({ timeout: 5_000 });
    await toggle.dispatchEvent('click');

    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // InlineAlert with cancel button appears
    const cancelBtn = page.getByRole('button', { name: /^Cancelar$|^Cancel$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await cancelBtn.click();

    // InlineAlert disappears (isBatchGenerating = false, batchDone = false)
    await expect(cancelBtn).not.toBeVisible({ timeout: 5_000 });
    expect(deleteCalled).toBe(true);
  });
});

test.describe('Full Exam Job — concurso público', () => {
  test('full exam mode: toggle → distribute → generate → done → CTA opens concurso tab', async ({
    authedPage: page,
  }) => {
    await setupFullExamMocks(page, 3, E2E_SUBJECT);

    await page.goto('/questions?type=public_exam');
    await expect(page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first().click();
    await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();

    const toggle = page.getByTestId('full-exam-toggle');
    await expect(toggle).toBeVisible({ timeout: 5_000 });
    await toggle.dispatchEvent('click');

    await expect(page.getByText(E2E_SUBJECT)).toBeVisible({ timeout: 8_000 });

    const generateBtn = page.getByRole('button', { name: /Gerar Prova Completa|Generate Full Exam/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    await expect(page.getByText(/Geração concluída|Generation complete/i)).toBeVisible({ timeout: 15_000 });

    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    await bellButton.click();
    await expect(page.getByText(/Prova Completa gerada|Full Exam Generated/i).first()).toBeVisible({ timeout: 5_000 });

    const ctaLink = page.getByRole('link', { name: /Criar simulado|Create exam/i }).first();
    await expect(ctaLink).toBeVisible({ timeout: 3_000 });
    await ctaLink.click();

    // Lands on simulados new tab with concurso pre-selected
    await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
    const concursoOption = page.getByTestId('type-option-concurso');
    await expect(concursoOption).toBeVisible({ timeout: 8_000 });
    await expect(concursoOption).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });
  });
});


// ─── Helpers ─────────────────────────────────────────────────────────────────

