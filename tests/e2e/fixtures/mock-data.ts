import {
  E2E_CERT_KEY,
  E2E_CERT_LABEL,
  E2E_CERT_TOPIC,
  E2E_PUBLIC_EXAM_NAME,
  E2E_EXAM_BOARD,
  E2E_SUBJECT,
} from '../support/constants';

export {
  E2E_CERT_KEY,
  E2E_CERT_LABEL,
  E2E_CERT_TOPIC,
  E2E_PUBLIC_EXAM_NAME,
  E2E_EXAM_BOARD,
  E2E_SUBJECT,
};

// Stub returned by GET /api/exam/browse-questions/summary — tells NewMockExamForm that
// questions are available so it renders the creation form instead of the EmptyState.
// Unified shape: { exams: [{ id, name, type, referenceName, totalCount, sections }] }.
// Both verticals are included so totalSavedQuestions > 0 regardless of the selected exam.
export const mockBrowseSummary = {
  exams: [
    {
      id: 'e2e-cert-exam-id',
      name: E2E_CERT_LABEL,
      type: 'certification',
      referenceName: 'E2E',
      totalCount: 3,
      sections: [{ name: E2E_CERT_TOPIC, questionCount: 3 }],
    },
    {
      id: 'e2e-public-exam-id',
      name: E2E_PUBLIC_EXAM_NAME,
      type: 'public_exam',
      referenceName: E2E_EXAM_BOARD,
      totalCount: 3,
      sections: [{ name: E2E_SUBJECT, questionCount: 3 }],
    },
  ],
};

// ensure-answers stub — always returns generated:0 (idempotent no-op).
export const mockAnswersResponse = { generated: 0 };

// Stub returned by PATCH .../attempts/:id (finishAttempt).
// The server-side finishAttempt calls ensureAnswers when Answer rows are missing,
// which would make a real OpenAI call in tests. Intercepting the PATCH prevents that,
// and the subsequent GET result endpoint is served by mockMockExamResult below.
export const mockFinishAttemptResponse = {};

// Unified MockExamResult stub served by GET /api/mock-exams/:id/attempts/:attemptId.
// Both verticals route through this single endpoint now, so the mock includes a
// sectionBreakdown entry for BOTH the certification topic and the public-exam subject,
// ensuring the domain's seed topic is always visible on the result page.
export const mockMockExamResult = {
  attempt: {
    id: 1,
    mockExamId: 1,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    score: 2,
    answers: [
      { mockExamQuestionId: 1, selectedOptions: ['A'] },
      { mockExamQuestionId: 2, selectedOptions: ['B'] },
      { mockExamQuestionId: 3, selectedOptions: ['C'] },
    ],
  },
  mockExam: {
    id: 1,
    name: 'E2E Mock Exam',
    exam: { id: 'e2e-cert-exam-id', name: E2E_CERT_LABEL, type: 'certification' },
  },
  questions: [
    {
      id: 1,
      order: 1,
      examQuestion: {
        id: 9001,
        examName: E2E_CERT_LABEL,
        sectionName: E2E_CERT_TOPIC,
        text: 'E2E Question 1: Which service provides object storage?',
        correctCount: 1,
        difficulty: 'medium',
        options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
        answer: { correctOptions: ['A'] },
      },
    },
    {
      id: 2,
      order: 2,
      examQuestion: {
        id: 9002,
        examName: E2E_CERT_LABEL,
        sectionName: E2E_CERT_TOPIC,
        text: 'E2E Question 2: Which service provides compute?',
        correctCount: 1,
        difficulty: 'easy',
        options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' },
        answer: { correctOptions: ['B'] },
      },
    },
    {
      id: 3,
      order: 3,
      examQuestion: {
        id: 9003,
        examName: E2E_CERT_LABEL,
        sectionName: E2E_CERT_TOPIC,
        text: 'E2E Question 3: Which service is a managed relational database?',
        correctCount: 1,
        difficulty: 'medium',
        options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' },
        answer: { correctOptions: ['C'] },
      },
    },
  ],
  sectionBreakdown: [
    { sectionName: E2E_CERT_TOPIC, correct: 2, total: 3, weightPercent: 100, previousAvgPercent: null },
    { sectionName: E2E_SUBJECT, correct: 2, total: 3, weightPercent: 100, previousAvgPercent: null },
  ],
  examMeta: { passingScorePercent: null, durationMinutes: null },
  attemptNumber: 1,
  totalAttempts: 1,
  overallPreviousAvgPercent: null,
};

// ─── Generation Job SSE helpers ───────────────────────────────────────────────

function buildTopicEntry(topicName: string, status: 'queued' | 'running' | 'done' | 'error', savedCount = 0) {
  return {
    id: 'e2e-topic-1',
    topicName,
    questionCount: savedCount || 3,
    status,
    savedCount,
    errorMessage: null,
  };
}

export function buildGenerationJobProgressEvent(opts: {
  doneTopics: number;
  totalTopics: number;
  savedCount: number;
  topicName: string;
  topicStatus: 'queued' | 'running' | 'done' | 'error';
}): string {
  const data = {
    doneTopics: opts.doneTopics,
    totalTopics: opts.totalTopics,
    savedCount: opts.savedCount,
    topics: [buildTopicEntry(opts.topicName, opts.topicStatus, opts.savedCount)],
  };

  return `event: progress\ndata: ${JSON.stringify(data)}\n\n`;
}

export function buildGenerationJobDoneEvent(opts: {
  doneTopics: number;
  totalTopics: number;
  savedCount: number;
  topicName: string;
}): string {
  const data = {
    doneTopics: opts.doneTopics,
    totalTopics: opts.totalTopics,
    savedCount: opts.savedCount,
    topics: [buildTopicEntry(opts.topicName, 'done', opts.savedCount)],
  };

  return `event: done\ndata: ${JSON.stringify(data)}\n\n`;
}
