import { test, expect } from '../fixtures/auth.fixture';

// The E2E user has plan 'tester' — these tests verify that admin routes enforce
// authorization and return 403 for non-admin callers.
// Full admin UI tests (promote flow, detail panel) require a separate admin user
// and are tracked in the backlog.

test.describe('admin catalog — authorization', () => {
  test('GET /api/admin/catalog retorna 403 para usuário não-admin', async ({ authedPage: page }) => {
    const response = await page.request.get('/api/admin/catalog');
    expect(response.status()).toBe(403);
  });

  test('PATCH /api/admin/catalog/[examId] retorna 403 para usuário não-admin', async ({ authedPage: page }) => {
    const response = await page.request.patch('/api/admin/catalog/any-exam-id', {
      data: {},
    });
    expect(response.status()).toBe(403);
  });
});
