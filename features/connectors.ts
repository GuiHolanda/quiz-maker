import {
  CERTIFICATION_GENERATOR_URL,
  SAVE_QUESTIONS_URL,
  SAVE_CERTIFICATION_URL,
  QUIZ_GENERATOR_URL,
  BILLING_USAGE_URL,
  BILLING_CHECKOUT_URL,
  BILLING_PORTAL_URL,
  BROWSE_SUMMARY_URL,
  BROWSE_QUESTIONS_URL,
  PUBLIC_EXAMS_URL,
  EXAM_BOARDS_URL,
  SAVE_PUBLIC_EXAM_URL,
  EXTRACT_EDITAL_URL,
  PUBLIC_EXAM_GENERATOR_URL,
  SAVE_PUBLIC_EXAM_QUESTIONS_URL,
  GET_PUBLIC_EXAM_ANSWERS_URL,
  BROWSE_PUBLIC_EXAM_SUMMARY_URL,
  BROWSE_PUBLIC_EXAM_QUESTIONS_URL,
  GET_CERTIFICATION_ANSWERS_URL,
  MOCK_EXAMS_URL,
  ADMIN_USERS_URL,
  ADMIN_OVERVIEW_URL,
  ADMIN_AUDIT_LOG_URL,
} from '@/config/constants';
import {
  AIQuestion,
  Certification,
  CertificationTopic,
  QuestionParams,
  StoredQuestion,
  TopicUpdatePayload,
  UsageStats,
  BrowseSummary,
  BrowseQuestionsParams,
  BrowseQuestionsResponse,
  PublicExam,
  ExamBoard,
  PublicExamSubject,
  PublicExamTopic,
  PublicExamSubjectUpdatePayload,
  AIPublicExamQuestion,
  PublicExamQuestionParams,
  PublicExamBrowseSummary,
  PublicExamBrowseQuestionsParams,
  PublicExamBrowseQuestionsResponse,
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
} from '@/shared/types';
import api from '@/lib/bff.api';

export async function getCertifications(): Promise<Certification[]> {
  const { data } = await api.get<{ certifications: Certification[] }>('/certification/certifications');

  return data.certifications;
}

export async function getQuestions(requestPayload: QuestionParams): Promise<AIQuestion[]> {
  const { num_questions, topic_name, certification_name } = requestPayload;

  const { data } = await api.get<AIQuestion[]>(CERTIFICATION_GENERATOR_URL, {
    params: {
      certification_name,
      topic_name,
      num_questions,
    },
  });

  return data;
}

export async function saveQuestions(questions: AIQuestion[]): Promise<void> {
  await api.post(SAVE_QUESTIONS_URL, questions);
}

export async function getCertificationAnswers(questions: AIQuestion[]): Promise<void> {
  await api.post(GET_CERTIFICATION_ANSWERS_URL, questions);
}

export async function saveCertification(certification: Certification): Promise<Certification> {
  const { data } = await api.post<{ certification: Certification }>(SAVE_CERTIFICATION_URL, certification);

  return data.certification;
}

export async function updateCertificationTopic(payload: TopicUpdatePayload): Promise<void> {
  await api.patch(SAVE_CERTIFICATION_URL, payload);
}

export async function updateCertificationMeta(
  certKey: string,
  updates: { newLabel?: string; newKey?: string; newProvider?: string | null }
): Promise<Certification> {
  const { data } = await api.patch<{ certification: Certification }>(SAVE_CERTIFICATION_URL, {
    certificationKey: certKey,
    ...updates,
  });

  return data.certification;
}

export async function deleteCertificationTopic(topicId: string): Promise<void> {
  await api.delete(`${SAVE_CERTIFICATION_URL}?topicId=${encodeURIComponent(topicId)}`);
}

export async function deleteCertification(certificationKey: string): Promise<void> {
  await api.delete(`${SAVE_CERTIFICATION_URL}?certificationKey=${encodeURIComponent(certificationKey)}`);
}

export async function addCertificationTopic(
  certificationKey: string,
  name: string,
  minQuestions: number,
  maxQuestions: number
): Promise<CertificationTopic> {
  const { data } = await api.put<{ topic: CertificationTopic }>(SAVE_CERTIFICATION_URL, {
    certificationKey,
    name,
    minQuestions,
    maxQuestions,
  });

  return data.topic;
}

export async function getQuizQuestions(params: {
  certificationTitle: string;
  numQuestions: number;
}): Promise<StoredQuestion[]> {
  const { data } = await api.get<StoredQuestion[]>(QUIZ_GENERATOR_URL, {
    params: { certificationTitle: params.certificationTitle, numQuestions: params.numQuestions },
  });

  return data;
}

export async function getBillingUsage(): Promise<UsageStats> {
  const { data } = await api.get<UsageStats>(BILLING_USAGE_URL);

  return data;
}

export async function getCheckoutUrl(period: 'monthly' | 'yearly'): Promise<string> {
  const { data } = await api.get<{ url: string }>(BILLING_CHECKOUT_URL, { params: { period } });

  return data.url;
}

export async function getPortalUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>(BILLING_PORTAL_URL);

  return data.url;
}

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

export async function getPublicExams(): Promise<PublicExam[]> {
  const { data } = await api.get<{ publicExams: PublicExam[] }>(PUBLIC_EXAMS_URL);

  return data.publicExams;
}

export async function getExamBoards(): Promise<ExamBoard[]> {
  const { data } = await api.get<{ examBoards: ExamBoard[] }>(EXAM_BOARDS_URL);

  return data.examBoards;
}

export async function createExamBoard(name: string, fullName?: string): Promise<ExamBoard> {
  const { data } = await api.post<{ examBoard: ExamBoard }>(EXAM_BOARDS_URL, { name, fullName });

  return data.examBoard;
}

export async function savePublicExam(publicExam: PublicExam): Promise<PublicExam> {
  const { data } = await api.post<{ publicExam: PublicExam }>(SAVE_PUBLIC_EXAM_URL, publicExam);

  return data.publicExam;
}

export async function extractEdital(file: File, role?: string): Promise<PublicExam> {
  const formData = new FormData();

  formData.append('file', file);
  if (role) formData.append('role', role);
  const { data } = await api.post<{ publicExam: PublicExam }>(EXTRACT_EDITAL_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.publicExam;
}

export async function updatePublicExamSubject(payload: PublicExamSubjectUpdatePayload): Promise<void> {
  await api.patch(SAVE_PUBLIC_EXAM_URL, payload);
}

export async function updatePublicExamMeta(
  publicExamId: string,
  updates: { newName?: string; newRole?: string | null; newYear?: number | null; newExamBoardName?: string }
): Promise<PublicExam> {
  const { data } = await api.patch<{ publicExam: PublicExam }>(SAVE_PUBLIC_EXAM_URL, {
    publicExamId,
    ...updates,
  });

  return data.publicExam;
}

export async function deletePublicExamSubject(subjectId: string): Promise<void> {
  await api.delete(`${SAVE_PUBLIC_EXAM_URL}?subjectId=${encodeURIComponent(subjectId)}`);
}

export async function deletePublicExam(examId: string): Promise<void> {
  await api.delete(`${SAVE_PUBLIC_EXAM_URL}?examId=${encodeURIComponent(examId)}`);
}

export async function deletePublicExamTopic(topicId: string): Promise<void> {
  await api.delete(`${SAVE_PUBLIC_EXAM_URL}?topicId=${encodeURIComponent(topicId)}`);
}

export async function updatePublicExamTopic(topicId: string, newName: string): Promise<PublicExamTopic> {
  const { data } = await api.patch<{ topic: PublicExamTopic }>(SAVE_PUBLIC_EXAM_URL, { topicId, newName });

  return data.topic;
}

export async function addPublicExamSubject(
  publicExamId: string,
  name: string,
  minQuestions: number,
  maxQuestions: number
): Promise<PublicExamSubject> {
  const { data } = await api.put<{ subject: PublicExamSubject }>(SAVE_PUBLIC_EXAM_URL, {
    publicExamId,
    name,
    minQuestions,
    maxQuestions,
  });

  return data.subject;
}

export async function addPublicExamTopic(subjectId: string, name: string): Promise<PublicExamTopic> {
  const { data } = await api.put<{ topic: PublicExamTopic }>(SAVE_PUBLIC_EXAM_URL, {
    subjectId,
    name,
  });

  return data.topic;
}

export async function getPublicExamQuestions(
  requestPayload: PublicExamQuestionParams
): Promise<AIPublicExamQuestion[]> {
  const { data } = await api.get<AIPublicExamQuestion[]>(PUBLIC_EXAM_GENERATOR_URL, {
    params: requestPayload,
  });

  return data;
}

export async function savePublicExamQuestions(questions: AIPublicExamQuestion[]): Promise<void> {
  await api.post(SAVE_PUBLIC_EXAM_QUESTIONS_URL, questions);
}

export async function getPublicExamAnswers(questions: AIPublicExamQuestion[]): Promise<void> {
  await api.post(GET_PUBLIC_EXAM_ANSWERS_URL, questions);
}

export async function getPublicExamBrowseSummary(): Promise<PublicExamBrowseSummary> {
  const { data } = await api.get<PublicExamBrowseSummary>(BROWSE_PUBLIC_EXAM_SUMMARY_URL);

  return data;
}

export async function getPublicExamBrowseQuestions(
  params: PublicExamBrowseQuestionsParams
): Promise<PublicExamBrowseQuestionsResponse> {
  const { data } = await api.get<PublicExamBrowseQuestionsResponse>(BROWSE_PUBLIC_EXAM_QUESTIONS_URL, { params });

  return data;
}

export async function deletePublicExamBrowseQuestion(id: number): Promise<void> {
  await api.delete(`${BROWSE_PUBLIC_EXAM_QUESTIONS_URL}?id=${id}`);
}

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

export async function finishMockExamAttempt(
  mockExamId: number,
  attemptId: number,
  payload: FinishAttemptPayload
): Promise<void> {
  await api.patch(`${MOCK_EXAMS_URL}/${mockExamId}/attempts/${attemptId}`, payload);
}

export async function getMockExamAttemptResult(mockExamId: number, attemptId: number): Promise<MockExamResult> {
  const { data } = await api.get<MockExamResult>(`${MOCK_EXAMS_URL}/${mockExamId}/attempts/${attemptId}`);

  return data;
}

export async function getMockExamAnswers(questions: AIPublicExamQuestion[]): Promise<void> {
  await api.post(`${MOCK_EXAMS_URL}/answers`, questions);
}

export async function getQuestionExplanation(questionId: number): Promise<Record<string, string>> {
  const { data } = await api.get<{ explanations: Record<string, string> }>(
    `/public-exam/questions/${questionId}/explanation`
  );

  return data.explanations;
}

export async function getCertificationQuestionExplanation(questionId: number): Promise<Record<string, string>> {
  const { data } = await api.get<{ explanations: Record<string, string> }>(
    `/certification/questions/${questionId}/explanation`
  );

  return data.explanations;
}

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
