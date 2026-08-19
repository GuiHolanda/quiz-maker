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
  simuladoCard: 'simulado-card',
  simuladoTabNew: 'simulado-tab-new',
  simuladoTabMine: 'simulado-tab-mine',
  simuladoTotalInput: 'simulado-total-input',
  simuladoCreateBtn: 'simulado-create-btn',
  simuladoAnswerBtn: 'simulado-answer-btn',
  simuladoDeleteBtn: 'simulado-delete-btn',

  // Answer / result
  answerOption: 'answer-option',
  answerSubmitBtn: 'answer-submit-btn',
  attemptFinalizeBtn: 'attempt-finalize-btn',
  attemptCancelBtn: 'attempt-cancel-btn',
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
  examDetailEditBtn: 'exam-detail-edit-btn',

  // Question bank
  questionBankCard: 'question-bank-card',
  questionBankSearch: 'question-bank-search',
  questionBankSourceFilter: 'question-bank-source-filter',
  questionBankDifficultyFilter: 'question-bank-difficulty-filter',
  questionBankDeleteBtn: 'question-bank-delete-btn',

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
  confirmDiscardAttemptBtn: 'confirm-discard-attempt-btn',
} as const;
