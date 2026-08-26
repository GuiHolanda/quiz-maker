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
      await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false, confirmedFound: false } }]);

      await page.goto(domain.configureUrl);
      await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
      await page.locator(tid(TID.examSearchInput)).fill('AWS');
      await page.locator(tid(TID.examSearchSubmitBtn)).click();

      const options = page.locator(tid(TID.seedIdentifyMatchOption));
      await expect(options).toHaveCount(MATCHES.length, { timeout: 10000 });
      await options.filter({ hasText: MATCHES[1].label }).click();

      // public_exam requires an edital-approval step before role selection:
      // the locate call runs first, then the user approves/skips the edital, then picks a role.
      if (domain.type === 'public_exam') {
        // Wait for the edital approval screen (locate returned empty → skip is the only action).
        await page.locator(tid(TID.seedIdentifySkipEditalBtn)).waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(tid(TID.seedIdentifySkipEditalBtn)).click();

        // Now role selection: MATCHES has roles: [], so the manual input appears.
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
  await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false, confirmedFound: false } }]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Locate fires first; the mock returns empty, so the approval screen shows the skip button.
  // Skip to proceed to role selection.
  await page.locator(tid(TID.seedIdentifySkipEditalBtn)).waitFor({ state: 'visible', timeout: 10000 });
  await page.locator(tid(TID.seedIdentifySkipEditalBtn)).click();

  // Now single match for public_exam goes to role selection.
  const roleOptions = page.locator(tid(TID.seedIdentifyRoleOption));
  await expect(roleOptions).toHaveCount(2, { timeout: 10000 });

  // Clicking a role option confirms and proceeds to the loading-blueprint phase.
  await roleOptions.first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(matchWithRoles.label, { timeout: 10000 });
});

test('public_exam: approving the target-year edital then picking a role confirms the seed', async ({ authedPage: page }) => {
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
            documentKind: 'main',
            domainClass: 'official-org',
            verification: 'confirmed',
          },
        ],
        targetYearFound: true,
        confirmedFound: true,
      },
    },
  ]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Edital approval screen appears first — target-year edital is the first approve option.
  const approveOptions = page.locator(tid(TID.seedIdentifyApproveEditalOption));
  await expect(approveOptions).toHaveCount(1, { timeout: 10000 });
  await approveOptions.first().click();

  // After approving, role selection screen appears.
  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
  // The approval screen's prior-edital options are gone once confirmed.
  await expect(page.locator(tid(TID.seedIdentifyApproveEditalOption))).toHaveCount(0);
});

test('public_exam: no target-year edital shows prior-year model in approval screen, picking one then picking a role confirms', async ({
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
            documentKind: 'main',
            domainClass: 'official-org',
            verification: 'confirmed',
          },
        ],
        targetYearFound: false,
        confirmedFound: true,
      },
    },
  ]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Edital approval screen appears first with the prior-year candidate (targetYearFound=false).
  // It was confirmed by the verification loop (just not the target year), so it carries the
  // success badge rather than the "official" one, which is reserved for a target-year match.
  const approveOptions = page.locator(tid(TID.seedIdentifyApproveEditalOption));
  await expect(approveOptions).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator(tid(TID.seedIdentifyEditalVerifiedBadge))).toBeVisible();
  await approveOptions.first().click();

  // After approving the prior-year edital, role selection screen appears.
  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
});

test('public_exam: an unconfirmed candidate (e.g. a quadro de vagas) is listed under the unconfirmed framing, not presented as the edital', async ({
  authedPage: page,
}) => {
  const match = {
    label: 'Transpetro 2026',
    key: null,
    provider: null,
    examBoard: 'IADES',
    role: null,
    roles: ['Técnico de Operações'],
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
            url: 'https://transpetro.com.br/quadro-vagas-042026.pdf',
            editalNumber: null,
            year: 2026,
            orgao: 'Transpetro',
            isOfficialDomain: true,
            coversRole: false,
            documentKind: 'annex',
            domainClass: 'other',
            verification: 'annex',
          },
        ],
        targetYearFound: false,
        confirmedFound: false,
      },
    },
  ]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('Transpetro');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Nothing was confirmed — the card frames the list as unconfirmed rather than presenting
  // the quadro de vagas as the edital, but still lists it (with its annex warning) as an option.
  await expect(page.locator(tid(TID.seedIdentifyEditalUnconfirmed))).toBeVisible({ timeout: 10000 });
  await expect(page.locator(tid(TID.seedIdentifyEditalAnnexWarning))).toBeVisible();
  await expect(page.locator(tid(TID.seedIdentifyEditalVerifiedBadge))).toHaveCount(0);

  // The user can still approve the unconfirmed candidate manually if they choose to.
  await page.locator(tid(TID.seedIdentifyApproveEditalOption)).first().click();
  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
});

test('public_exam: skipping the edital approval screen still confirms the seed via role selection', async ({ authedPage: page }) => {
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
  await mockLocateEdital(page, [{ status: 200, body: { editais: [], targetYearFound: false, confirmedFound: false } }]);

  await page.goto('/exams/new?type=public_exam');
  await page.locator(tid(TID.examSeedBlankBtn)).waitFor({ state: 'visible' });
  await page.locator(tid(TID.examSearchInput)).fill('TRF');
  await page.locator(tid(TID.examSearchSubmitBtn)).click();

  // Edital approval screen appears with empty list (nothing found) — skip button is visible.
  await page.locator(tid(TID.seedIdentifySkipEditalBtn)).waitFor({ state: 'visible', timeout: 10000 });
  await page.locator(tid(TID.seedIdentifySkipEditalBtn)).click();

  // After skipping the edital, role selection screen appears.
  await page.locator(tid(TID.seedIdentifyRoleOption)).first().click();

  await expect(page.locator(tid(TID.seedIdentifyConfirmedLabel))).toHaveText(match.label, { timeout: 10000 });
});
