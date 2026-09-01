// CSS-attribute selector for a test-id.
export const tid = (id: string) => `[data-testid="${id}"]`;

// Catalog of every data-testid used across the E2E suite.
// Keep in sync with the data-testid attributes added to components.
export const TID = {
  // Question generation (/questions)
  typeOptionCertification: 'type-option-certification',
  typeOptionPublicExam: 'type-option-public_exam',
  questionGenSelectTrigger: 'question-gen-select-trigger',
  questionGenGenerateBtn: 'question-gen-generate-btn',
  questionGenSaveAllBtn: 'question-gen-save-all-btn',
  questionGenStatus: 'question-gen-status',
  questionGenJobCancelBtn: 'question-gen-job-cancel-btn',

  // Simulado (/simulados)
  simuladoRow: 'simulado-row',
  simuladoStartBtn: 'simulado-start-btn',
  simuladoTotalInput: 'simulado-total-input',
  simuladoCreateBtn: 'simulado-create-btn',
  simuladoDeleteBtn: 'simulado-delete-btn',
  simuladoTimer: 'simulado-timer',

  // Simulado — create form (/simulados)
  simuladoPresetOfficial: 'simulado-preset-official',
  simuladoPresetQuick: 'simulado-preset-quick',
  simuladoPresetErrors: 'simulado-preset-errors',
  simuladoNameInput: 'simulado-name-input',
  simuladoScopeCertification: 'simulado-scope-certification',
  simuladoScopePublicExam: 'simulado-scope-public-exam',
  simuladoExamSelect: 'simulado-exam-select',
  simuladoTimeOficial: 'simulado-time-oficial',
  simuladoTimeLivre: 'simulado-time-livre',
  simuladoTimePersonalizado: 'simulado-time-personalizado',
  simuladoCustomMinutesInput: 'simulado-custom-minutes-input',
  simuladoSourceLibrary: 'simulado-source-library',
  simuladoSourceUnseen: 'simulado-source-unseen',
  simuladoSourceWrong: 'simulado-source-wrong',
  simuladoTopicToggle: 'simulado-topic-toggle',
  simuladoTopicsSelectAll: 'simulado-topics-select-all',
  simuladoTopicsClear: 'simulado-topics-clear',
  simuladoCreateStatus: 'simulado-create-status',
  simuladoCreateFootnote: 'simulado-create-footnote',
  simuladoGenerationPanel: 'simulado-generation-panel',
  simuladoGenerationStartBtn: 'simulado-generation-start-btn',
  simuladoGenerationCreateAnotherBtn: 'simulado-generation-create-another-btn',

  // Attempt (/simulados/[id]/tentativa/[attemptId]) + result
  attemptOption: 'attempt-option',
  attemptPrevBtn: 'attempt-prev-btn',
  attemptSkipBtn: 'attempt-skip-btn',
  attemptNextBtn: 'attempt-next-btn',
  attemptNavCell: 'attempt-nav-cell',
  attemptFinalizeBtn: 'attempt-finalize-btn',
  attemptExitBtn: 'attempt-exit-btn',
  attemptDiscardLink: 'attempt-discard-link',
  resultScore: 'result-score',
  resultPercent: 'result-percent',
  resultRetryBtn: 'result-retry-btn',

  // Notifications
  notificationBell: 'notification-bell',
  notificationBadge: 'notification-badge',
  notificationItem: 'notification-item',

  // Exam configure (list + /exams/new editor)
  configureListSection: 'configure-list-section',
  examSeedBlankBtn: 'exam-seed-blank-btn',
  examEditorNameInput: 'exam-editor-name-input',
  examEditorDiscardBtn: 'exam-editor-discard-btn',
  examEditorSaveBtn: 'exam-editor-save-btn',
  examEditorProvenanceCard: 'exam-editor-provenance-card',
  examDetailEditBtn: 'exam-detail-edit-btn',

  // Exam seed identification (inside the /exams/new loading screen)
  examSearchInput: 'exam-search-input',
  examSearchSubmitBtn: 'exam-search-submit-btn',
  seedLoadingCancelBtn: 'seed-loading-cancel-btn',
  seedIdentifyMatchOption: 'seed-identify-match-option',
  seedIdentifyConfirmedLabel: 'seed-identify-confirmed-label',
  seedIdentifyRoleOption: 'seed-identify-role-option',
  seedIdentifyRoleInput: 'seed-identify-role-input',
  seedIdentifyRoleConfirmBtn: 'seed-identify-role-confirm-btn',
  seedIdentifyApproveEditalOption: 'seed-identify-approve-edital-option',
  seedIdentifyPriorEditalOption: 'seed-identify-prior-edital-option',
  seedIdentifySkipEditalBtn: 'seed-identify-skip-edital-btn',
  // The approving-edital card when locateEdital's verification loop never confirmed a
  // candidate — still lists what it found, but framed as unconfirmed.
  seedIdentifyEditalUnconfirmed: 'seed-identify-edital-unconfirmed',
  seedIdentifyEditalVerifiedBadge: 'seed-identify-edital-verified-badge',
  seedIdentifyEditalAnnexWarning: 'seed-identify-edital-annex-warning',
  seedIdentifyEditalUnreadableBadge: 'seed-identify-edital-unreadable-badge',

  // Question bank
  questionBankCard: 'question-bank-card',
  questionBankSearch: 'question-bank-search',
  questionBankSourceFilter: 'question-bank-source-filter',
  questionBankDifficultyFilter: 'question-bank-difficulty-filter',
  questionBankDeleteBtn: 'question-bank-delete-btn',
  questionBankSortSelect: 'question-bank-sort-select',
  questionBankSelectAll: 'question-bank-select-all',
  questionBankCardCheckbox: 'question-bank-card-checkbox',
  questionBankBulkBar: 'question-bank-bulk-bar',
  questionBankBulkDelete: 'question-bank-bulk-delete',
  questionBankCreateSimulado: 'question-bank-create-simulado',

  // Collapsible filter panel
  filterPanelToggle: 'filter-panel-toggle',

  // Dashboard (/dashboard)
  dashboardRoot: 'dashboard-root',
  dashboardKpiRibbon: 'dashboard-kpi-ribbon',
  dashboardFocusAreas: 'dashboard-focus-areas',
  dashboardRecentSessions: 'dashboard-recent-sessions',
  dashboardSessionRow: 'dashboard-session-row',
  dashboardDomainBreakdown: 'dashboard-domain-breakdown',

  // Shared empty state
  emptyState: 'empty-state',
  illustratedEmptyState: 'illustrated-empty-state',

  // Catalog (/exams/catalog)
  examCard: 'exam-card',
  catalogForkBtn: 'catalog-fork-btn',
  catalogForkConfirmBtn: 'catalog-fork-confirm-btn',
  catalogPoolChip: 'catalog-pool-chip',
  catalogEnrolledChip: 'catalog-enrolled-chip',

  // Confirmation dialogs
  confirmDiscardBtn: 'confirm-discard-btn',
  confirmDeleteBtn: 'confirm-delete-btn',
  confirmBulkDeleteBtn: 'confirm-bulk-delete-btn',
  confirmDiscardAttemptBtn: 'confirm-discard-attempt-btn',
  confirmFinishAttemptBtn: 'confirm-finish-attempt-btn',
} as const;
