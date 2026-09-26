import { test, expect } from '../fixtures/auth.fixture';

const RECONCILING = /Confirmando seu upgrade|Confirming your upgrade|Aplicando a mudança de plano|Applying your plan change/i;
const PENDING = /Verificação pendente|Verification pending/i;
const UPGRADED_TOAST = /Plano Tester ativado!|Tester plan activated!/i;
const ANY_UPGRADED_TOAST = /Plano .+ ativado!|.+ plan activated!/i;
const PLAN_UPDATED_TOAST = /^(Plano atualizado|Plan updated)$/i;
const CURRENT_PLAN_LABEL = /^(Plano atual|Current plan)$/i;
const SETTLED_BILLING_URL = /\/billing$/;

test.describe('billing return reconciliation', () => {
  test('RN-04: checkout return settles on the first read when the purchased plan is already active', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?upgraded=true&plan=tester');

    await expect(page.getByText(UPGRADED_TOAST)).toBeVisible();
    await expect(page).toHaveURL(SETTLED_BILLING_URL);
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
  });

  test('RN-07: a reload after the checkout return settled does not announce the upgrade again', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?upgraded=true&plan=tester');
    await expect(page).toHaveURL(SETTLED_BILLING_URL);

    await page.reload();

    await expect(page.getByText(CURRENT_PLAN_LABEL).first()).toBeVisible();
    await expect(page).toHaveURL(SETTLED_BILLING_URL);
    await expect(page.getByText(UPGRADED_TOAST)).toBeHidden();
  });

  test('RN-03: checkout return with a session this user does not own is never confirmed by the plan alone', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?upgraded=true&plan=tester&session_id=cs_test_not_this_users_session');

    await expect(page.getByText(PENDING)).toBeVisible();
    await expect(page.getByText(ANY_UPGRADED_TOAST)).toBeHidden();
    await expect(page).toHaveURL(/session_id=cs_test_not_this_users_session/);
  });

  test('RN-04: checkout return keeps waiting while the purchased plan is not active yet', async ({ authedPage: page }) => {
    await page.goto('/billing?upgraded=true&plan=pro');

    await expect(page.getByText(RECONCILING)).toBeVisible();
    await expect(page.getByText(ANY_UPGRADED_TOAST)).toBeHidden();
    await expect(page).toHaveURL(/upgraded=true&plan=pro/);
  });

  test('RN-06: portal return settles on the first read when the plan already changed', async ({ authedPage: page }) => {
    await page.goto('/billing?synced=1&from=pro');

    await expect(page.getByText(PLAN_UPDATED_TOAST)).toBeVisible();
    await expect(page).toHaveURL(SETTLED_BILLING_URL);
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
  });

  test('RN-06: portal return without a plan change settles without polling, banner or toast', async ({
    authedPage: page,
  }) => {
    await page.goto('/billing?synced=1&from=tester');

    await expect(page).toHaveURL(SETTLED_BILLING_URL);
    await expect(page.getByText(CURRENT_PLAN_LABEL).first()).toBeVisible();
    await expect(page.getByText(RECONCILING)).toBeHidden();
    await expect(page.getByText(PENDING)).toBeHidden();
    await expect(page.getByText(PLAN_UPDATED_TOAST)).toBeHidden();
  });
});
