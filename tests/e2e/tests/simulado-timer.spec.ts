import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';
import { ALL_DOMAINS } from '../support/journey-config';
import { dismissNotificationDialog, pickSimuladoScopeAndExam } from '../support/flows';

const domain = ALL_DOMAINS[0];

test.describe('simulado timer', () => {
  test('countdown is visible when the simulado has a time limit', async ({ authedPage: page }) => {
    await page.goto('/simulados');
    await dismissNotificationDialog(page);

    await pickSimuladoScopeAndExam(page, domain);

    const totalInput = page.locator(tid(TID.simuladoTotalInput));
    await totalInput.fill('');
    await totalInput.fill('3');

    await page.locator(tid(TID.simuladoTimePersonalizado)).click();
    const minutesInput = page.locator(tid(TID.simuladoCustomMinutesInput));
    await expect(minutesInput).toBeVisible();
    await minutesInput.fill('15');
    await expect(page.getByText('15min').first()).toBeVisible();

    const createBtn = page.locator(tid(TID.simuladoCreateBtn));
    await expect(createBtn).toBeEnabled({ timeout: 10_000 });
    await createBtn.click();

    const startBtn = page.locator(tid(TID.simuladoGenerationStartBtn));
    await expect(startBtn).toBeVisible({ timeout: 20_000 });
    await startBtn.click();

    await page.waitForURL(/\/tentativa\/\d+/);
    await expect(page.locator(tid(TID.simuladoTimer))).toBeVisible();
  });
});
