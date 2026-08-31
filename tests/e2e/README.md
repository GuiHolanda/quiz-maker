# E2E Test Suite (Playwright)

End-to-end tests for CertifiqueAI. Chromium-only, mock-first (no real OpenAI, no real SSE), driven by a shared functional helper layer and a `data-testid` catalog.

---

## 1. Overview & strategy

- **Mock-first.** No test ever calls the real OpenAI API. Question generation, answer/gabarito, finish-attempt, result pages, and the generation-job stream are all intercepted via `page.route()` and an injected fake `EventSource`.
- **Serial.** `playwright.config.ts` sets `fullyParallel: false` and `workers: 1`. Tests share one seeded database user, so ordering and isolation matter — never assume a parallel worker.
- **Seed via Prisma.** `global-setup.ts` creates/resets the E2E user and seeds one certification + one public exam (each with a topic/subject and 3 questions) directly through Prisma. Tests start with real data in the DB.
- **Auth via saved session.** `global-setup.ts` logs in through the UI once and saves `auth/storageState.json`. Every test starts authenticated — no per-test login.
- **Data-driven per vertical.** Specs that apply to both certifications and public exams iterate `for (const domain of ALL_DOMAINS)`, so each capability is proven twice from one spec body.

---

## 2. Directory map

```
tests/e2e/
  auth/
    storageState.json     ← saved authenticated session (gitignored)
  fixtures/
    auth.fixture.ts       ← extends the base test with the standing OpenAI/result route mocks
    mock-data.ts          ← static question payloads + result fixtures returned by the mocks
  support/                ← reusable helper layer (see §3)
  tests/                  ← the 6 capability specs (see §5)
  global-setup.ts         ← seed user + data, UI login, save storageState
  global-teardown.ts      ← FK-safe wipe of all E2E-user data
```

---

## 3. The `support/` layer

Everything reusable lives here. Specs compose these helpers; they don't hand-roll selectors or route mocks.

| File | Purpose | Key exports |
|---|---|---|
| `constants.ts` | Single source of truth for the six seed identifiers (cert key/label/topic, exam name/board/subject). Imported by `mock-data.ts`, `global-setup.ts`, `global-teardown.ts`, and `journey-config.ts`. | `E2E_CERT_KEY`, `E2E_CERT_LABEL`, `E2E_CERT_TOPIC`, `E2E_PUBLIC_EXAM_NAME`, `E2E_EXAM_BOARD`, `E2E_SUBJECT` |
| `db-cleanup.ts` | FK-safe `deleteMany` sequence for all data owned by a user. Shared by setup (pre-seed reset) and teardown (final wipe). | `cleanupUserData(prisma, userId)` |
| `selectors.ts` | The test-id catalog and a CSS-attribute helper. **Single source of truth for every `data-testid` used in the suite.** | `tid(id)`, `TID` |
| `journey-config.ts` | The `DOMAINS` map — everything that differs between `certification` and `public_exam` (type-picker id, generation URL, seed label/topic, configure URL, stream glob). Keeps flows and specs type-agnostic. | `DomainType`, `DomainConfig`, `DOMAINS`, `ALL_DOMAINS` |
| `fake-eventsource.ts` | Overrides `window.EventSource` via `addInitScript` before app scripts run, so no real SSE connection is made. | `injectFakeEventSource`, `injectNeverDoneEventSource` |
| `mocks.ts` | Route mocks for the generation-job lifecycle and a result override. | `setupGenerationJobMocks`, `mockGenerationJobFailure`, `mockGenerationTimeout`, `mockActiveJobOnLoad`, `mockCertResultAllWrong` |
| `flows.ts` | Functional flow helpers that compose selectors + mocks into user journeys. | `generateAndSaveQuestions`, `createSimulado`, `startSimuladoAttempt`, `answerAllQuestions`, `finalizeAttempt`, `assertResult` |

---

## 4. Test-id convention

- **Format:** `domain-element[-variant]`, kebab-case — e.g. `simulado-row`, `question-gen-generate-btn`, `type-option-certification`.
- **Catalog is authoritative.** `TID` in `support/selectors.ts` is the single source of truth. Component `data-testid` attributes must match a `TID` value exactly; the two are kept in sync by hand.
- **HeroUI forwards `data-testid`.** react-aria's `filterDOMProps` (`/^(data-.*)$/`) passes `data-*` through to a real DOM element, so `<Tab>`, `<Input>`, `<Select>`, `<Radio>`, and `<Button>` all accept `data-testid` and land it on the rendered node. Place the attribute *before* any `{...inputProperties.*}` spread so the spread cannot override it.
- **Why test-ids over labels.** Labels are i18n'd (PT/EN) and often non-unique (many cards share a label). Test-ids are stable, language-agnostic, and scope precisely.

---

## 5. Specs → coverage

| Spec | Tests | Per-domain | Covers |
|---|---|---|---|
| `full-journey.spec.ts` | 1 (×2 domains) | ✓ | The whole loop: generate (fake SSE → `awaiting_review`) → save all → create simulado → start attempt → answer every question → finalize → assert result → retry → cancel back to list. |
| `generation-errors.spec.ts` | 2 (×2 domains) | ✓ | 403 quota failure surfaces an error and **no** success badge; a network abort on the generation POST shows the generic error toast. |
| `sse-reconnect.spec.ts` | 3 (×2 domains) | ✓ | Cancel a running job calls `DELETE` and resets state; a `running` job is restored after reload (cancel button reappears); an `awaiting_review` job is restored after reload (save-all button reappears). |
| `wizard-validation.spec.ts` | 2 (×2 domains) | ✓ | Discard-draft returns to the list tab; cannot advance past step 1 with an empty title. |
| `question-bank.spec.ts` | 2 | cert only | Seed 3 questions via the real `save-questions` API → verify → search narrows to one → delete; search with no match shows the empty state. |
| `empty-states.spec.ts` | 2 | mixed | Simulados list shows the empty state when both list endpoints return empty; certifications list shows the empty state when its endpoint returns empty. |
| `simulado-timer.spec.ts` | 1 | cert only | Create a simulado with a custom time limit → start the attempt → the countdown (`simulado-timer`) is visible on the tentativa page. |

**Total: 46 tests.**

---

## 6. Covered flows

**Primary journey** (`full-journey`, both verticals):

1. Navigate to `/questions?type=…`, pick the vertical, select the seeded entity.
2. Generate — the fake `EventSource` fires an `awaiting_review` event; the status region appears.
3. Save all — success banner confirms.
4. Create a simulado in `/simulados` — the create form is always visible at the top (no tabs); pick the scope card, choose the seeded exam, set the question count, create.
5. Start the attempt from the simulados table row (filtered by the seeded exam label).
6. Answer every question (HeroUI Radio + Form workaround), finalize.
7. Assert the result page (score, percent, topic/subject breakdown, retry button).
8. Retry → "Salvar e sair" → discard the new attempt → back to `/simulados`.

**Edge cases** (dedicated specs): quota/network generation failures, SSE cancel + reconnect-after-reload in both `running` and `awaiting_review` states, wizard discard + empty-title guard, question-bank search/delete, and empty-state rendering for simulados and certifications.

---

## 7. Technical notes

### Attempt screen — one question at a time, no submit step
The `tentativa` screen shows a single question with plain `<button data-testid="attempt-option">` alternatives. A click persists the selection immediately (localStorage), so `answerAllQuestions` just clicks an option and presses `attempt-next-btn` per question — no radio-input `dispatchEvent` and no per-question submit. `attempt-nav-cell` count = total questions; `attempt-finalize-btn` (sidebar) opens the finish modal (`confirm-finish-attempt-btn`).

HeroUI `<Radio>` / `<Button type="submit">` elsewhere still need `dispatchEvent('click')` (input has `opacity: 0.0001`, submit is a react-aria pressable) — do **not** use `.click({ force: true })`, `.check()`, or `page.mouse.click()` with those.

### FakeEventSource / NeverDoneEventSource
`route.fulfill` can't stream, and the browser `EventSource` needs a persistent HTTP connection. So `fake-eventsource.ts` overrides `window.EventSource` via `addInitScript` before app scripts load. The app listens with `es.addEventListener('awaiting_review', …)` (**not** `onmessage`), so the fake fires a `MessageEvent('awaiting_review', …)` ~100ms after construction with payload `{ doneTopics, totalTopics, queuedTopics, topics[] }`. `NeverDoneEventSource` connects but never emits — used to hold a job in the `running` state for cancel/reconnect tests.

### Result pages are static mocks
`auth.fixture.ts` stubs the finish-attempt `PATCH` and the result `GET` (`mockCertSimuladoResult` / `mockMockExamResult`, always score 2/3). This avoids the server-side `ensureAnswers` path (a real OpenAI call). For a deterministic all-wrong (0/3) result, `mockCertResultAllWrong` overrides the same GET — available for wrong-answer assertions.

### Reconnect endpoint
`GET /api/generation-job` (no query params) returns an **array** of the authenticated user's active jobs; the client reconnects to any that are still `running` / `awaiting_review`. `mockActiveJobOnLoad` fulfills that GET with a one-element array in the requested state.

### Accumulated notifications
A prior run can leave a notification open (the bell dialog can intercept clicks). `createSimulado` calls `dismissNotificationDialog` — closes any open notification dialog with `Escape` — before interacting with the always-visible create form.

---

## 8. Running & debugging

`global-setup`, `global-teardown`, and the `next dev` server must all use the **same** database. Pass an absolute `DATABASE_URL`.

```bash
# Headless (default)
DATABASE_URL="file:$(pwd)/prisma/dev.db" npm run e2e

# Interactive UI — watch each step
DATABASE_URL="file:$(pwd)/prisma/dev.db" npm run e2e:ui

# Headed browser
DATABASE_URL="file:$(pwd)/prisma/dev.db" npx playwright test --headed

# A single spec
DATABASE_URL="file:$(pwd)/prisma/dev.db" npx playwright test full-journey

# Last run's HTML report (screenshots + traces on failure)
npx playwright show-report
```

### First-time local setup

1. Create `.env.test` at the project root (gitignored):
   ```
   E2E_USER_EMAIL=e2e-test@certifiqueai.test
   E2E_USER_PASSWORD=E2ePassword123!
   ```
2. Install the browser once:
   ```bash
   npx playwright install chromium
   ```

The dev server auto-starts and is reused locally (`reuseExistingServer: !process.env.CI`).

---

## 9. Adding a new scenario

1. **Tag the component.** Add a `data-testid` to the target element and a matching entry in `TID` (`support/selectors.ts`). Keep the string kebab-case and place the attribute before any `inputProperties` spread.
2. **Add/extend a flow helper** in `support/flows.ts` if the interaction is reusable, or a route mock in `support/mocks.ts` if you need new server behavior.
3. **Write the test** in `tests/`. Import `test`/`expect` from `../fixtures/auth.fixture` and use `authedPage`. If the scenario applies to both verticals, iterate `for (const domain of ALL_DOMAINS)` and pull URLs/labels from `domain` rather than hardcoding.
4. **Seed/cleanup.** Data created by the E2E user is wiped automatically by `global-teardown` via `cleanupUserData`. If you seed through a new model, extend the delete sequence in `support/db-cleanup.ts` (FK order matters).
5. **Run the single spec** to green before running the full suite.
