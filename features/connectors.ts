import {
  SAVE_EXAM_URL,
  SAVE_EXAM_QUESTIONS_URL,
  GET_EXAM_ANSWERS_URL,
  EXAM_QUIZ_GENERATOR_URL,
  EXAM_QUESTION_EXPLANATION_URL,
  EXAMS_URL,
  BILLING_USAGE_URL,
  BILLING_CHECKOUT_URL,
  BILLING_PORTAL_URL,
  BROWSE_SUMMARY_URL,
  BROWSE_QUESTIONS_URL,
  PROVIDERS_URL,
  EXAM_BOARDS_URL,
  EXTRACT_EDITAL_URL,
  MOCK_EXAMS_URL,
  ADMIN_USERS_URL,
  ADMIN_OVERVIEW_URL,
  ADMIN_AUDIT_LOG_URL,
  ADMIN_EXCHANGE_RATE_URL,
  QUESTION_BANK_URL,
  QUESTION_BANK_TOPICS_URL,
  QUESTION_BANK_SOURCES_URL,
  GENERATION_JOB_URL,
  USAGE_HISTORY_URL,
  USAGE_HISTORY_FILTERS_URL,
  GENERATION_JOB_SAVE_URL,
  DASHBOARD_STATS_URL,
  SEARCH_URL,
} from '@/config/constants';
import {
  AIExamQuestion,
  Exam,
  ExamType,
  ExamSection,
  ExamTopic,
  StoredExamQuestion,
  SectionUpdatePayload,
  UsageStats,
  BrowseSummary,
  BrowseQuestionsParams,
  BrowseQuestionsResponse,
  Provider,
  ExamBoard,
  MockExamListItem,
  MockExam,
  CreateMockExamPayload,
  MockExamAttempt,
  FinishAttemptPayload,
  MockExamResult,
  AdminOverviewStats,
  AdminUsersResponse,
  AdminAuditLogResponse,
  UserAdminRow,
  UserPlan,
  QuestionBankParams,
  QuestionBankResponse,
  GenerationJobStatus,
  GenerationHistoryResponse,
  GenerationHistoryFilters,
  GenerationHistoryFilterOptions,
  DashboardStats,
  SearchResponse,
} from '@/shared/types';
import api from '@/lib/bff.api';

// — Exams (certification + public_exam) —

export async function getExams(): Promise<Exam[]> {
  const { data } = await api.get<{ exams: Exam[] }>(EXAMS_URL);

  return data.exams;
}

export async function saveExam(exam: Exam): Promise<Exam> {
  const { data } = await api.post<{ exam: Exam }>(SAVE_EXAM_URL, exam);

  return data.exam;
}

export async function updateExamMeta(
  examId: string,
  updates: {
    newName?: string;
    newKey?: string | null;
    newRole?: string | null;
    newYear?: number | null;
    newProviderName?: string | null;
    newExamBoardName?: string | null;
    newTotalQuestions?: number;
    newExamDurationMinutes?: number | null;
    newPassingScore?: number | null;
  }
): Promise<Exam> {
  const { data } = await api.patch<{ exam: Exam }>(SAVE_EXAM_URL, { examId, ...updates });

  return data.exam;
}

export async function deleteExam(examId: string): Promise<void> {
  await api.delete(`${SAVE_EXAM_URL}?examId=${encodeURIComponent(examId)}`);
}

// — Sections —

export async function addSection(
  examId: string,
  name: string,
  minQuestions: number,
  maxQuestions: number
): Promise<ExamSection> {
  const { data } = await api.put<{ section: ExamSection }>(SAVE_EXAM_URL, {
    examId,
    kind: 'section',
    name,
    minQuestions,
    maxQuestions,
  });

  return data.section;
}

export async function updateSection(payload: SectionUpdatePayload): Promise<void> {
  await api.patch(SAVE_EXAM_URL, { kind: 'section', ...payload });
}

export async function deleteSection(sectionId: string): Promise<void> {
  await api.delete(`${SAVE_EXAM_URL}?sectionId=${encodeURIComponent(sectionId)}`);
}

// — Topics —

export async function addTopic(sectionId: string, name: string): Promise<ExamTopic> {
  const { data } = await api.put<{ topic: ExamTopic }>(SAVE_EXAM_URL, {
    kind: 'topic',
    sectionId,
    name,
  });

  return data.topic;
}

export async function updateTopic(topicId: string, newName: string): Promise<ExamTopic> {
  const { data } = await api.patch<{ topic: ExamTopic }>(SAVE_EXAM_URL, { kind: 'topic', topicId, newName });

  return data.topic;
}

export async function deleteTopic(topicId: string): Promise<void> {
  await api.delete(`${SAVE_EXAM_URL}?topicId=${encodeURIComponent(topicId)}`);
}

// — Questions —

export async function saveExamQuestions(type: ExamType, questions: AIExamQuestion[], examId?: string): Promise<void> {
  await api.post(SAVE_EXAM_QUESTIONS_URL, { type, questions, ...(examId && { examId }) });
}

export async function getExamAnswers(type: ExamType, questions: AIExamQuestion[]): Promise<void> {
  await api.post(GET_EXAM_ANSWERS_URL, { type, questions });
}

export async function getQuizQuestions(params: {
  examName: string;
  numQuestions: number;
}): Promise<StoredExamQuestion[]> {
  const { data } = await api.get<StoredExamQuestion[]>(EXAM_QUIZ_GENERATOR_URL, {
    params: { examName: params.examName, numQuestions: params.numQuestions },
  });

  return data;
}

export async function getExamQuestionExplanation(questionId: number): Promise<Record<string, string>> {
  const { data } = await api.get<{ explanations: Record<string, string> }>(
    `${EXAM_QUESTION_EXPLANATION_URL}/${questionId}/explanation`
  );

  return data.explanations;
}

// — Reference tables (autocomplete) —

export async function getProviders(): Promise<Provider[]> {
  const { data } = await api.get<{ providers: Provider[] }>(PROVIDERS_URL);

  return data.providers;
}

export async function getExamBoards(): Promise<ExamBoard[]> {
  const { data } = await api.get<{ examBoards: ExamBoard[] }>(EXAM_BOARDS_URL);

  return data.examBoards;
}

export async function createProvider(name: string, fullName?: string): Promise<Provider> {
  const { data } = await api.post<{ provider: Provider }>(PROVIDERS_URL, { name, fullName });

  return data.provider;
}

export async function createExamBoard(name: string, fullName?: string): Promise<ExamBoard> {
  const { data } = await api.post<{ examBoard: ExamBoard }>(EXAM_BOARDS_URL, { name, fullName });

  return data.examBoard;
}

export async function extractEdital(file: File, role?: string): Promise<Exam> {
  const formData = new FormData();

  formData.append('file', file);
  if (role) formData.append('role', role);
  const { data } = await api.post<{ exam: Exam }>(EXTRACT_EDITAL_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.exam;
}

// — Browse questions —

export async function getBrowseSummary(): Promise<BrowseSummary> {
  const { data } = await api.get<BrowseSummary>(BROWSE_SUMMARY_URL);

  return data;
}

export async function getBrowseQuestions(params: BrowseQuestionsParams): Promise<BrowseQuestionsResponse> {
  const { data } = await api.get<BrowseQuestionsResponse>(BROWSE_QUESTIONS_URL, { params });

  return data;
}

export async function deleteBrowseQuestion(id: number): Promise<void> {
  await api.delete(`${BROWSE_QUESTIONS_URL}?id=${id}`);
}

// — Billing —

export async function getBillingUsage(): Promise<UsageStats> {
  const { data } = await api.get<UsageStats>(BILLING_USAGE_URL);

  return data;
}

export async function getCheckoutUrl(period: 'monthly' | 'yearly', product: 'pro' | 'pro_ai' = 'pro'): Promise<string> {
  const { data } = await api.get<{ url: string }>(BILLING_CHECKOUT_URL, { params: { period, product } });

  return data.url;
}

export async function getPortalUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>(BILLING_PORTAL_URL);

  return data.url;
}

// — Mock exams (simulados, both types) —

export async function getMockExams(): Promise<MockExamListItem[]> {
  const { data } = await api.get<{ mockExams: MockExamListItem[] }>(MOCK_EXAMS_URL);

  return data.mockExams;
}

export async function createMockExam(payload: CreateMockExamPayload): Promise<MockExamListItem> {
  const { data } = await api.post<{ mockExam: MockExamListItem }>(MOCK_EXAMS_URL, payload);

  return data.mockExam;
}

export async function deleteMockExam(id: number): Promise<void> {
  await api.delete(`${MOCK_EXAMS_URL}?id=${id}`);
}

export async function getMockExam(id: number): Promise<MockExam> {
  const { data } = await api.get<{ mockExam: MockExam }>(`${MOCK_EXAMS_URL}/${id}`);

  return data.mockExam;
}

export async function startMockExamAttempt(mockExamId: number): Promise<MockExamAttempt> {
  const { data } = await api.post<{ attempt: MockExamAttempt }>(`${MOCK_EXAMS_URL}/${mockExamId}/attempts`);

  return data.attempt;
}

export async function ensureMockExamAnswers(mockExamId: number): Promise<{ generated: number }> {
  const { data } = await api.post<{ generated: number }>(`${MOCK_EXAMS_URL}/${mockExamId}/answers`);

  return data;
}

export async function finishMockExamAttempt(
  mockExamId: number,
  attemptId: number,
  payload: FinishAttemptPayload
): Promise<void> {
  await api.patch(`${MOCK_EXAMS_URL}/${mockExamId}/attempts/${attemptId}`, payload);
}

export async function discardMockExamAttempt(mockExamId: number, attemptId: number): Promise<void> {
  await api.delete(`${MOCK_EXAMS_URL}/${mockExamId}/attempts/${attemptId}`);
}

export async function getMockExamAttemptResult(mockExamId: number, attemptId: number): Promise<MockExamResult> {
  const { data } = await api.get<MockExamResult>(`${MOCK_EXAMS_URL}/${mockExamId}/attempts/${attemptId}`);

  return data;
}

// — Admin —

export async function getAdminOverview(): Promise<AdminOverviewStats> {
  const { data } = await api.get<AdminOverviewStats>(ADMIN_OVERVIEW_URL);

  return data;
}

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  subscriptionStatus?: string;
}): Promise<AdminUsersResponse> {
  const { data } = await api.get<AdminUsersResponse>(ADMIN_USERS_URL, { params });

  return data;
}

export async function updateAdminUser(
  id: string,
  payload: { plan?: UserPlan; customQuotaOverride?: number | null }
): Promise<UserAdminRow> {
  const { data } = await api.patch<UserAdminRow>(`${ADMIN_USERS_URL}/${id}`, payload);

  return data;
}

export async function getAdminAuditLog(params: {
  page?: number;
  limit?: number;
  adminId?: string;
  targetId?: string;
}): Promise<AdminAuditLogResponse> {
  const { data } = await api.get<AdminAuditLogResponse>(ADMIN_AUDIT_LOG_URL, { params });

  return data;
}

export async function getExchangeRate(): Promise<{ rate: number }> {
  const { data } = await api.get<{ rate: number }>(ADMIN_EXCHANGE_RATE_URL);

  return data;
}

// — Question bank —

export async function getQuestionBank(params: QuestionBankParams): Promise<QuestionBankResponse> {
  const { data } = await api.get<QuestionBankResponse>(QUESTION_BANK_URL, { params });
  return data;
}

export async function getQuestionBankTopics(type?: 'all' | 'certification' | 'public_exam'): Promise<string[]> {
  const { data } = await api.get<{ topics: string[] }>(QUESTION_BANK_TOPICS_URL, {
    params: type && type !== 'all' ? { type } : undefined,
  });
  return data.topics;
}

export async function getQuestionBankSources(type?: 'all' | 'certification' | 'public_exam'): Promise<string[]> {
  const { data } = await api.get<{ sources: string[] }>(QUESTION_BANK_SOURCES_URL, {
    params: type && type !== 'all' ? { type } : undefined,
  });
  return data.sources;
}

// — Generation jobs —

export const createGenerationJob = (payload: {
  type: ExamType;
  refKey: string;
  refName: string;
  examBoardName?: string;
  distribution: Array<{ topicName: string; questionCount: number }>;
}): Promise<{ jobId: string }> => api.post<{ jobId: string }>(GENERATION_JOB_URL, payload).then((r) => r.data);

export const getGenerationJob = (jobId: string): Promise<GenerationJobStatus> =>
  api.get<GenerationJobStatus>(`${GENERATION_JOB_URL}/${jobId}`).then((r) => r.data);

export const getActiveGenerationJobs = (): Promise<GenerationJobStatus[]> =>
  api
    .get<GenerationJobStatus[]>(GENERATION_JOB_URL)
    .then((r) => r.data)
    .catch(() => []);

export const cancelGenerationJob = (jobId: string): Promise<void> =>
  api.delete(`${GENERATION_JOB_URL}/${jobId}`).then(() => undefined);

export const saveGenerationJob = (jobId: string, topicIds?: string[]): Promise<{ savedCount: number }> =>
  api.post<{ savedCount: number }>(GENERATION_JOB_SAVE_URL(jobId), { topicIds }).then((r) => r.data);

export const getGenerationHistory = (
  page: number,
  limit: number,
  filters: GenerationHistoryFilters
): Promise<GenerationHistoryResponse> =>
  api
    .get<GenerationHistoryResponse>(USAGE_HISTORY_URL, {
      params: {
        page,
        limit,
        ...(filters.domain !== 'all' && { domain: filters.domain }),
        ...(filters.source.length > 0 && { source: filters.source }),
        ...(filters.topic.length > 0 && { topic: filters.topic }),
        ...(filters.status.length > 0 && { status: filters.status }),
        sort: filters.sort,
      },
    })
    .then((r) => r.data);

export const getGenerationHistoryFilters = (): Promise<GenerationHistoryFilterOptions> =>
  api.get<GenerationHistoryFilterOptions>(USAGE_HISTORY_FILTERS_URL).then((r) => r.data);

// — Dashboard —

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>(DASHBOARD_STATS_URL);
  return data;
}

// — Search —

export async function globalSearch(q: string, signal?: AbortSignal): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>(SEARCH_URL, { params: { q }, signal });
  return data;
}
