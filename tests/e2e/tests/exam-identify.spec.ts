import { test, expect } from '../fixtures/auth.fixture';
import { ALL_DOMAINS } from '../support/journey-config';
import { tid, TID } from '../support/selectors';
import { injectNeverDoneEventSource } from '../support/fake-eventsource';
import { mockCreateAutoConfigJob, mockIdentify, mockLocateEdital } from '../support/mocks';

const MATCHES = [
  {
    label: 'AWS Certified Solutions Architect – Associate',
    key: 'SAA-C03',
    provider: 'AWS',
    examBoard: null,
    role: null,
    roles: [],
    year: null,
  },
  {
    label: 'AWS Certified Cloud Practitioner',
    key: 'CLF-C02',
    provider: 'AWS',
    examBoard: null,
    role: null,
    roles: [],
    year: null,
  },
];

for (const domain of ALL_DOMAINS) {
  test.describe(`exam identification — ${domain.type}`, () => {
    test('cancelling during identification returns to the picker, and a late response does not resurrect it', async ({
      authedPage: page,
    }) => {
      await mockIdentify(page, [{ status: 200, body: { matches: [MATCHES[0]], clarification: null }, delayMs: 3000 }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      const cancelBtn = page.locator(tid(TID.seedLoadingCancelBtn));
      await expect(cancelBtn).toBeVisible({ timeout: 10000 });
      await cancelBtn.click();
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();

      // The mocked identify response is still in flight (3s delay) — wait past it and
      // confirm the picker holds instead of jumping to the loading screen or the editor.
      await page.waitForTimeout(3500);
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();
      await expect(cancelBtn).toHaveCount(0);
    });

    test('no match found offers an inline retry that re-submits the search', async ({ authedPage: page }) => {
      const identify = await mockIdentify(page, [
        { status: 200, body: { matches: [], clarification: 'Qual órgão ou provedor você quis dizer?' } },
        { status: 200, body: { matches: [], clarification: 'Ainda não encontrei — tente o código oficial da prova.' } },
      ]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.getByText('Qual órgão ou provedor você quis dizer?')).toBeVisible({ timeout: 10000 });
      // The recovery form is prefilled with the original query and reuses the same testids.
      await expect(page.locator(tid(TID.examSearchInput))).toHaveValue(domain.seedLabel);
      await expect(page.locator(tid(TID.examSeedBlankBtn))).toBeVisible();

      await page.locator(tid(TID.examSearchInput)).fill(`${domain.seedLabel} refinado`);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.getByText('Ainda não encontrei — tente o código oficial da prova.')).toBeVisible({
        timeout: 10000,
      });
      expect(identify.callCount()).toBe(2);
    });

    test('an identify failure keeps the user on the loading screen with a retry and a way out', async ({
      authedPage: page,
    }) => {
      await mockIdentify(page, [{ status: 500, body: { error: 'boom' } }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill(domain.seedLabel);
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      await expect(page.locator(tid(TID.examSearchInput))).toBeVisible({ timeout: 10000 });
      await expect(page.locator(tid(TID.seedLoadingCancelBtn))).toBeVisible();

      // Failure doesn't dead-end into a blank editor by itself — "start blank" is an explicit
      // choice, still reachable from the same recovery row as before.
      await page.locator(tid(TID.examSeedBlankBtn)).click();
      await expect(page.locator(tid(TID.examEditorNameInput))).toBeVisible();
    });

    test('several matches show a selectable list, and choosing one confirms the seed', async ({ authedPage: page }) => {
      await injectNeverDoneEventSource(page);
      await mockCreateAutoConfigJob(page);
      await mockIdentify(page, [{ status: 200, body: { matches: MATCHES, clarification: null } }]);
      // Only exercised for public_exam (see the role-selection branch below), but harmless
      // to register for certification too — confirmRole/locate never fires on that path.
      await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false } }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill('AWS');
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      const options = page.locator(tid(TID.seedIdentifyMatchOption));
      await expect(options).toHaveCount(MATCHES.length, { timeout: 10000 });
      await options.filter({ hasText: MATCHES[1].label }).click();

      // public_exam requires a role selection step; MATCHES has roles: [], so the manual
      // input appears — fill it and confirm to proceed to the confirmed state.
      if (domain.type === 'public_exam') {
        await page.locator(tid(TID.seedIdentifyRoleInput)).fill('Analista Judiciário');
        await page.locator(tid(TID.seedIdentifyRoleConfirmBtn)).click();
      }

      // Picking a match confirms it immediately (cert) or after role selection (public_exam):
      // the list is replaced by the confirmed identification.
      await expect(options).toHaveCount(0);
      const [, chosen] = MATCHES;
      await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(chosen.label);
      await expect(page.getByText(chosen.key ?? '')).toBeVisible();
    });
  });
}

test('public_exam: shows role selection step and can pick a role from the list', async ({ authedPage: page }) => {
  const matchWithRoles = {
    label: 'TRF 2ª Região 2025',
    key: 'PGJ-001/2025',
    provider: null,
    examBoard: 'CEBRASPE',
    role: null,
    roles: ['Analista Judiciário', 'Técnico Judiciário'],
    year: 2025,
  };

  await injectNeverDoneEventSource(page);
  await mockCreateAutoConfigJob(page);
  await mockIdentify(page, [{ status: 200, body: { matches: [matchWithRoles], clarification: null } }]);
  await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false } }]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Single match for public_exam skips disambiguation and goes straight to role selection.
  const roleOptions = page.locator(tid(TID.seedIdentifyRoleOption));
  await expect(roleOptions).toHaveCount(2, { timeout: 10000 });

  // Clicking a role option confirms and proceeds to the loading-blueprint phase.
  await roleOptions.first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(matchWithRoles.label, { timeout: 10000 });
});

test('public_exam: locating the target-year edital skips straight to confirmed', async ({ authedPage: page }) => {
  const match = {
    label: 'TRF 1ª Região 2025',
    key: 'PGJ-001/2025',
    provider: null,
    examBoard: 'CEBRASPE',
    role: null,
    roles: ['Analista Judiciário'],
    year: 2025,
  };

  await injectNeverDoneEventSource(page);
  await mockCreateAutoConfigJob(page);
  await mockIdentify(page, [{ status: 200, body: { matches: [match], clarification: null } }]);
  await mockLocateEdital(page, [
    {
      status: 200,
      body: {
        editais: [
          {
            url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf',
            editalNumber: 'PGJ-001/2025',
            year: 2025,
            orgao: 'TRF 1ª Região',
            isOfficialDomain: true,
            coversRole: true,
          },
        ],
        targetYearFound: true,
      },
    },
  ]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  // No edital-not-found detour — the target-year edital was found, so the job is created
  // right away with it and the confirmed card shows without an intermediate decision.
  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
  await expect(page.locator(tid(TID.seedIdentifyPriorEditalOption))).toHaveCount(0);
});

test('public_exam: no target-year edital offers a prior-year model, and picking one confirms', async ({
  authedPage: page,
}) => {
  const match = {
    label: 'TRF 1ª Região 2026',
    key: null,
    provider: null,
    examBoard: 'CEBRASPE',
    role: null,
    roles: ['Analista Judiciário'],
    year: 2026,
  };

  await injectNeverDoneEventSource(page);
  await mockCreateAutoConfigJob(page);
  await mockIdentify(page, [{ status: 200, body: { matches: [match], clarification: null } }]);
  await mockLocateEdital(page, [
    {
      status: 200,
      body: {
        editais: [
          {
            url: 'https://www.trf1.jus.br/editais/edital-002-2021.pdf',
            editalNumber: 'PGJ-002/2021',
            year: 2021,
            orgao: 'TRF 1ª Região',
            isOfficialDomain: true,
            coversRole: true,
          },
        ],
        targetYearFound: false,
      },
    },
  ]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  const priorOptions = page.locator(tid(TID.seedIdentifyPriorEditalOption));
  await expect(priorOptions).toHaveCount(1, { timeout: 10000 });
  await priorOptions.first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
});

test('public_exam: continuing without a located edital still confirms the seed', async ({ authedPage: page }) => {
  const match = {
    label: 'TRF 1ª Região 2026',
    key: null,
    provider: null,
    examBoard: 'CEBRASPE',
    role: null,
    roles: ['Analista Judiciário'],
    year: 2026,
  };

  await injectNeverDoneEventSource(page);
  await mockCreateAutoConfigJob(page);
  await mockIdentify(page, [{ status: 200, body: { matches: [match], clarification: null } }]);
  await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false } }]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  // Nothing found at all (no target-year, no prior-year) — locateEditalStep skips the
  // decision screen entirely and proceeds straight to the estimated-fallback job.
  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
});
