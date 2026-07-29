import type { Page } from '@playwright/test';

// POST /api/generation-job → returns a jobId so the client opens the SSE stream.
// DELETE /api/generation-job/:id → records the cancel call for assertions.
export async function setupGenerationJobMocks(
  page: Page,
  opts: { jobId?: string } = {},
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

// GET /api/generation-job → returns an array with one job in the given state,
// used by reconnect-after-reload tests.
// Note: the GET endpoint takes no query params — it filters by authenticated user server-side.
export async function mockActiveJobOnLoad(
  page: Page,
  job: { jobId: string; status: 'running' | 'awaiting_review'; topicName: string },
): Promise<void> {
  await page.route('**/api/generation-job', (route) => {
    if (route.request().method() === 'GET') {
      const topicStatus = job.status === 'awaiting_review' ? 'done' : 'running';
      const doneTopics = job.status === 'awaiting_review' ? 1 : 0;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: job.jobId,
            status: job.status,
            doneTopics,
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
                status: topicStatus,
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

// Overrides the cert simulado result GET to return an all-wrong (0/3) result.
export async function mockCertResultAllWrong(page: Page): Promise<void> {
  await page.route('**/api/certification-simulados/**/attempts/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAllWrongCertResult()),
      });
    } else if (route.request().method() === 'PATCH') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    } else {
      route.continue();
    }
  });
}

function buildAllWrongCertResult() {
  return {
    attempt: {
      id: 1,
      simuladoId: 1,
      startedAt: '2026-07-28T00:00:00.000Z',
      finishedAt: '2026-07-28T00:00:00.000Z',
      score: 0,
      answers: [
        { simuladoQuestionId: 1, selectedOptions: ['B'] },
        { simuladoQuestionId: 2, selectedOptions: ['A'] },
        { simuladoQuestionId: 3, selectedOptions: ['A'] },
      ],
    },
    simulado: { id: 1, name: 'E2E Simulado', certKey: 'AWS-SAA-C03-E2E', certLabel: 'AWS Solutions Architect E2E' },
    questions: [
      {
        id: 1,
        order: 1,
        question: {
          id: 9001,
          text: 'E2E Question 1: Which service provides object storage?',
          correctCount: 1,
          topic: 'E2E Topic',
          options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
          answer: { correctOptions: ['A'] },
        },
      },
      {
        id: 2,
        order: 2,
        question: {
          id: 9002,
          text: 'E2E Question 2: Which service provides compute?',
          correctCount: 1,
          topic: 'E2E Topic',
          options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' },
          answer: { correctOptions: ['B'] },
        },
      },
      {
        id: 3,
        order: 3,
        question: {
          id: 9003,
          text: 'E2E Question 3: Which service is a managed relational database?',
          correctCount: 1,
          topic: 'E2E Topic',
          options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' },
          answer: { correctOptions: ['C'] },
        },
      },
    ],
    topicBreakdown: [{ topicName: 'E2E Topic', correct: 0, total: 3 }],
  };
}
