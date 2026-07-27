import { test, expect } from '../fixtures/auth.fixture';
import { E2E_CERT_LABEL, E2E_CERT_TOPIC, E2E_PUBLIC_EXAM_NAME, E2E_SUBJECT } from '../fixtures/mock-data';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Injects a fake EventSource into the page that immediately fires a 'done' event
 * for any /api/generation-job/:id/stream URL, then mocks the POST endpoint.
 *
 * Playwright's route.fulfill cannot stream SSE events incrementally — the browser
 * EventSource requires a real persistent HTTP connection. Instead we stub the
 * global EventSource so it fires events synchronously from in-page JS.
 */
async function setupGenerationJobMocks(
  page: import('@playwright/test').Page,
  savedCount: number,
  topicName: string,
) {
  const donePayload = JSON.stringify({
    doneTopics: 1,
    totalTopics: 1,
    queuedTopics: 0,
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
        if (url.includes('/api/generation-job/') && url.includes('/stream')) {
          setTimeout(() => {
            const evt = new MessageEvent('done', { data: payload });
            this.dispatchEvent(evt);
          }, 100);
        }
      }

      close() { this.readyState = 2; }

      addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        super.addEventListener(type, listener, options);
        if (type === 'done' && this.url.includes('/api/generation-job/') && this.url.includes('/stream')) {
          setTimeout(() => {
            const evt = new MessageEvent('done', { data: payload });
            super.dispatchEvent(evt);
          }, 150);
        }
      }
    }
    (window as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
  }, donePayload);

  // Mock POST /api/generation-job — return jobId immediately
  await page.route('**/api/generation-job', (route) => {
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
  await page.route('**/api/generation-job/**', (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else {
      route.continue();
    }
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Generation Job — certification', () => {
  test('distribution table → generate → done notification', async ({
    authedPage: page,
  }) => {
    await setupGenerationJobMocks(page, 3, E2E_CERT_TOPIC);

    await page.goto('/questions?type=certification');
    await expect(page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Selecione uma Certificação|Select a Certification/i }).click();
    await expect(page.getByRole('option', { name: E2E_CERT_LABEL })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: E2E_CERT_LABEL }).click();

    // Distribution table appears automatically with the topic
    await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible({ timeout: 8_000 });

    const generateBtn = page.getByRole('button', { name: /^Gerar$|^Generate$/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Done state: InlineAlert turns green
    await expect(page.getByText(/Geração concluída|Generation complete|Questões prontas|Questions ready/i).first()).toBeVisible({ timeout: 15_000 });

    // Bell badge shows unread notification
    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    await bellButton.click();
    await expect(page.getByText(/Prova Completa gerada|Full Exam Generated/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('link', { name: /Criar simulado|Create exam/i }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('cancel button resets generating state', async ({
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
    await page.route('**/api/generation-job', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobId: 'e2e-cancel-job' }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
      }
    });
    await page.route('**/api/generation-job/**', (route) => {
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

    await expect(page.getByText(E2E_CERT_TOPIC)).toBeVisible({ timeout: 8_000 });

    const generateBtn = page.getByRole('button', { name: /^Gerar$|^Generate$/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    // Cancel button appears in the active job status
    const cancelBtn = page.getByRole('button', { name: /^Cancelar$|^Cancel$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await cancelBtn.click();

    await expect(cancelBtn).not.toBeVisible({ timeout: 5_000 });
    expect(deleteCalled).toBe(true);
  });
});

test.describe('Generation Job — concurso público', () => {
  test('distribute → generate → done → CTA opens concurso tab', async ({
    authedPage: page,
  }) => {
    await setupGenerationJobMocks(page, 3, E2E_SUBJECT);

    await page.goto('/questions?type=public_exam');
    await expect(page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Selecione um Concurso|Select.*exam/i }).first().click();
    await expect(page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') })).toBeVisible({ timeout: 8_000 });
    await page.getByRole('option', { name: new RegExp(E2E_PUBLIC_EXAM_NAME, 'i') }).click();

    await expect(page.getByText(E2E_SUBJECT)).toBeVisible({ timeout: 8_000 });

    const generateBtn = page.getByRole('button', { name: /^Gerar$|^Generate$/i });
    await expect(generateBtn).toBeVisible({ timeout: 5_000 });
    await generateBtn.click();

    await expect(page.getByText(/Geração concluída|Generation complete|Questões prontas|Questions ready/i).first()).toBeVisible({ timeout: 15_000 });

    const bellButton = page.locator('button[aria-label*="otifica"]');
    await expect(bellButton.locator('.bg-danger')).toBeVisible({ timeout: 5_000 });

    await bellButton.click();
    await expect(page.getByText(/Prova Completa gerada|Full Exam Generated/i).first()).toBeVisible({ timeout: 5_000 });

    const ctaLink = page.getByRole('link', { name: /Criar simulado|Create exam/i }).first();
    await expect(ctaLink).toBeVisible({ timeout: 3_000 });
    await ctaLink.click();

    await expect(page).toHaveURL(/\/simulados/, { timeout: 10_000 });
    const concursoOption = page.getByTestId('type-option-concurso');
    await expect(concursoOption).toBeVisible({ timeout: 8_000 });
    await expect(concursoOption).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });
  });
});

// ─── Helpers para testes de reconexão SSE ────────────────────────────────────

async function injectNeverDoneEventSource(page: import('@playwright/test').Page) {
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
}

test.describe('Generation Job — reconexão SSE após reload', () => {
  test('restaura job running após reload e exibe botão cancelar', async ({
    authedPage: page,
  }) => {
    const runningJobPayload = {
      id: 'e2e-reload-job',
      status: 'running',
      type: 'certification',
      refKey: 'reload-cert',
      refName: E2E_CERT_LABEL,
      examBoardName: null,
      totalTopics: 1,
      doneTopics: 0,
      queuedTopics: 0,
      savedCount: 0,
      topics: [
        {
          id: 'reload-topic-1',
          topicName: E2E_CERT_TOPIC,
          questionCount: 5,
          status: 'running',
          savedCount: 0,
          errorMessage: null,
        },
      ],
    };

    // GET /api/generation-job (list) returns the active job
    await page.route('**/api/generation-job', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([runningJobPayload]),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobId: 'e2e-reload-job' }),
        });
      }
    });

    // DELETE mock for the cancel button
    await page.route('**/api/generation-job/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      } else {
        route.continue();
      }
    });

    // EventSource never fires — job stays "running" visually
    await injectNeverDoneEventSource(page);

    await page.goto('/questions?type=certification');

    // Cancel button must be visible (proves the job was restored as active)
    const cancelBtn = page.getByRole('button', { name: /^Cancelar$|^Cancel$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 15_000 });
  });

  test('restaura job awaiting_review após reload e exibe UI de conclusão', async ({
    authedPage: page,
  }) => {
    const awaitingJobPayload = {
      id: 'e2e-awaiting-job',
      status: 'awaiting_review',
      type: 'certification',
      refKey: 'awaiting-cert',
      refName: E2E_CERT_LABEL,
      examBoardName: null,
      totalTopics: 1,
      doneTopics: 1,
      queuedTopics: 0,
      savedCount: 0,
      topics: [
        {
          id: 'awaiting-topic-1',
          topicName: E2E_CERT_TOPIC,
          questionCount: 3,
          status: 'done',
          savedCount: 0,
          errorMessage: null,
        },
      ],
    };

    // GET /api/generation-job (list) returns awaiting_review job
    await page.route('**/api/generation-job', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([awaitingJobPayload]),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobId: 'e2e-awaiting-job' }),
        });
      }
    });

    // No EventSource injection needed — awaiting_review should not open a new stream
    await page.goto('/questions?type=certification');

    // Completion UI must be visible — awaiting_review shows the review card with action buttons
    await expect(
      page.getByText(/Aguardando revisão|Awaiting review/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
