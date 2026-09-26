import { test, expect } from '../fixtures/auth.fixture';

const RECONCILING = /Confirmando seu upgrade|Confirming your upgrade/i;
const PENDING = /Verificação pendente|Verification pending/i;
const UPGRADED_TOAST = /Plano Tester ativado!|Tester plan activated!/i;
const PLAN_UPDATED_TOAST = /^(Plano atualizado|Plan updated)$/i;
const CURRENT_PLAN_LABEL = /^(Plano atual|Current plan)$/i;

test.describe('billing return reconciliation', () => {
  test('checkout return settles on the first read when the purchased plan is already active', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?upgraded=true&plan=tester');

    await expect(page.getByText(UPGRADED_TOAST)).toBeVisible();
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
  });

  test('checkout return keeps waiting while the purchased plan is not active yet', async ({ authedPage: page }) => {
    await page.goto('/billing?upgraded=true&plan=pro');

    await expect(page.getByText(RECONCILING)).toBeVisible();
    await expect(page.getByText(UPGRADED_TOAST)).toBeHidden();
  });

  test('portal return settles on the first read when the plan already changed', async ({ authedPage: page }) => {
    await page.goto('/billing?synced=1&from=pro');

    await expect(page.getByText(PLAN_UPDATED_TOAST)).toBeVisible();
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
  });

  test('portal return without a plan change checks silently instead of showing the upgrade banner', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?synced=1&from=tester');

    await expect(page.getByText(CURRENT_PLAN_LABEL).first()).toBeVisible();
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
    await expect(page.getByText(PLAN_UPDATED_TOAST)).toBeHidden();
  });
});
