import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

const MOCK_TEMPLATE = {
  id: 'tmpl-catalog-1',
  type: 'certification',
  name: 'AWS Solutions Architect Associate',
  role: null,
  year: null,
  key: 'AWS-SAA-C03',
  totalQuestions: 65,
  examDurationMinutes: 130,
  passingScore: 72,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  provider: { id: 'p1', name: 'AWS', fullName: 'Amazon Web Services' },
  examBoard: null,
  sections: [
    {
      id: 's1',
      name: 'Cloud Concepts',
      minQuestions: 24,
      maxQuestions: 30,
      topics: [
        { id: 't1', name: 'VPC' },
        { id: 't2', name: 'S3' },
      ],
    },
  ],
  poolQuestionCount: 42,
  isSubscribed: false,
};

const MOCK_FORKED_EXAM = {
  id: 'forked-exam-1',
  type: 'certification',
  name: 'AWS Solutions Architect Associate',
  role: null,
  year: null,
  key: 'AWS-SAA-C03',
  totalQuestions: 65,
  examDurationMinutes: 130,
  passingScore: 72,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  provider: { id: 'p1', name: 'AWS', fullName: 'Amazon Web Services' },
  examBoard: null,
  sections: [
    {
      id: 's2',
      name: 'Cloud Concepts',
      minQuestions: 24,
      maxQuestions: 30,
      topics: [
        { id: 't3', name: 'VPC' },
        { id: 't4', name: 'S3' },
      ],
    },
  ],
};

test.describe('catalog', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    // ExamsProvider always fetches exams on mount — stub it to avoid real DB calls.
    await page.route('**/api/exam/exams**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ exams: [] }) });
      } else {
        route.continue();
      }
    });
  });

  test('exibe templates com contagem de questões do pool', async ({ authedPage: page }) => {
    await page.route('**/api/exam/catalog', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ templates: [MOCK_TEMPLATE] }) });
    });

    await page.goto('/exams/catalog?type=certification');

    await expect(page.locator(tid(TID.examCard))).toBeVisible();
    await expect(page.locator(tid(TID.catalogPoolChip))).toBeVisible();
    await expect(page.locator(tid(TID.catalogPoolChip))).toContainText('42');
  });

  test('fork bem-sucedido: card fica visível com tag Inscrito', async ({ authedPage: page }) => {
    await page.route('**/api/exam/catalog', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ templates: [MOCK_TEMPLATE] }) });
    });
    await page.route('**/api/exam/fork-exam', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ exam: MOCK_FORKED_EXAM }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/exams/catalog?type=certification');
    await expect(page.locator(tid(TID.examCard))).toBeVisible();

    await page.locator(tid(TID.examCard)).click();
    await expect(page.locator(tid(TID.catalogForkConfirmBtn))).toBeVisible();
    await page.locator(tid(TID.catalogForkConfirmBtn)).click();

    // After fork the template stays in the list — now showing the enrolled chip.
    await expect(page.locator(tid(TID.catalogEnrolledChip))).toBeVisible({ timeout: 8_000 });
    await expect(page.locator(tid(TID.examCard))).toBeVisible();
  });

  test('fork com erro: card permanece visível', async ({ authedPage: page }) => {
    await page.route('**/api/exam/catalog', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ templates: [MOCK_TEMPLATE] }) });
    });
    await page.route('**/api/exam/fork-exam', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Limite de exames atingido' }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/exams/catalog?type=certification');
    await expect(page.locator(tid(TID.examCard))).toBeVisible();

    await page.locator(tid(TID.examCard)).click();
    await expect(page.locator(tid(TID.catalogForkConfirmBtn))).toBeVisible();
    await page.locator(tid(TID.catalogForkConfirmBtn)).click();

    // On error the card is NOT removed — it stays visible.
    await expect(page.locator(tid(TID.examCard))).toBeVisible({ timeout: 8_000 });
  });

  test('exibe empty state quando não há templates para o tipo', async ({ authedPage: page }) => {
    await page.route('**/api/exam/catalog', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/exams/catalog?type=certification');

    await expect(page.locator(tid(TID.illustratedEmptyState))).toBeVisible();
    await expect(page.locator(tid(TID.catalogForkBtn))).not.toBeVisible();
  });
});
