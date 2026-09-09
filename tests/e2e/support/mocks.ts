import type { Page } from '@playwright/test';

// POST /api/generation-job → returns a jobId so the client opens the SSE stream.
// DELETE /api/generation-job/:id → records the cancel call for assertions.
export async function setupGenerationJobMocks(
  page: Page,
  opts: { jobId?: string } = {}
): Promise<{ deleteCalled: () => boolean }> {
  const jobId = opts.jobId ?? 'e2e-job-1';
  let deleted = false;

  await page.route('**/api/generation-job', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jobId }) });
    } else {
      route.continue();
    }
  });

  await page.route('**/api/generation-job/*', (route) => {
    if (route.request().method() === 'DELETE') {
      deleted = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else {
      route.continue();
    }
  });

  return { deleteCalled: () => deleted };
}

// Forces POST /api/generation-job to fail with a given status (quota=403, error=500).
export async function mockGenerationJobFailure(page: Page, status: number, message: string): Promise<void> {
  await page.route('**/api/generation-job', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'error', message }) });
    } else {
      route.continue();
    }
  });
}

// Aborts the generation-job POST to simulate a client timeout (ECONNABORTED path).
export async function mockGenerationTimeout(page: Page, routeGlob: string): Promise<void> {
  await page.route(routeGlob, (route) => route.abort('timedout'));
}

// GET /api/generation-job → returns an array with one running job,
// used by reconnect-after-reload tests.
// Note: the GET endpoint takes no query params — it filters by authenticated user server-side.
export async function mockActiveJobOnLoad(
  page: Page,
  job: { jobId: string; status: 'running'; topicName: string }
): Promise<void> {
  await page.route('**/api/generation-job', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: job.jobId,
            status: 'running',
            doneTopics: 0,
            totalTopics: 1,
            queuedTopics: 0,
            savedCount: 0,
            type: 'certification',
            refKey: 'E2E-CERT',
            refName: 'E2E Certification',
            examBoardName: null,
            topics: [
              {
                id: 'e2e-topic-1',
                topicName: job.topicName,
                questionCount: 3,
                status: 'running',
                savedCount: 0,
                errorMessage: null,
                errorType: null,
              },
            ],
          },
        ]),
      });
    } else {
      route.continue();
    }
  });
}

// POST /api/exam/auto-config/identify → serves a queued sequence of responses (repeats the
// last one once exhausted), each optionally delayed so the 'identifying' loading state stays
// observable long enough for a test to assert on it or cancel mid-flight.
export async function mockIdentify(
  page: Page,
  responses: readonly { readonly status: number; readonly body: unknown; readonly delayMs?: number }[]
): Promise<{ callCount: () => number; requests: () => Record<string, unknown>[] }> {
  let call = 0;
  const requests: Record<string, unknown>[] = [];

  await page.route('**/api/exam/auto-config/identify', async (route) => {
    const response = responses[Math.min(call, responses.length - 1)];

    call += 1;
    requests.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    if (response.delayMs) await new Promise((r) => setTimeout(r, response.delayMs));
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  return { callCount: () => call, requests: () => requests };
}

// POST /api/exam/auto-config → returns a jobId without ever running the real pipeline, so a
// disambiguation pick can be exercised without spending a real LLM call. Pair with
// injectNeverDoneEventSource so the resulting SSE connection never advances past this point.
export async function mockCreateAutoConfigJob(page: Page, jobId = 'e2e-auto-config-job'): Promise<void> {
  await page.route('**/api/exam/auto-config', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ jobId }) });
    } else {
      route.continue();
    }
  });
}

// POST /api/exam/auto-config/locate-edital — same queued-sequence shape as mockIdentify.
// public_exam's confirmRole always calls this before creating the job, so every test that
// exercises role confirmation needs a route registered here, even when the case under test
// doesn't care about its result (an empty { editais: [], targetYearFound: false } is fine).
export async function mockLocateEdital(
  page: Page,
  responses: readonly { readonly status: number; readonly body: unknown; readonly delayMs?: number }[]
): Promise<{ callCount: () => number; requests: () => Record<string, unknown>[] }> {
  let call = 0;
  const requests: Record<string, unknown>[] = [];

  await page.route('**/api/exam/auto-config/locate-edital', async (route) => {
    const response = responses[Math.min(call, responses.length - 1)];

    call += 1;
    requests.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    if (response.delayMs) await new Promise((r) => setTimeout(r, response.delayMs));
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  return { callCount: () => call, requests: () => requests };
}
