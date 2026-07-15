export const E2E_CERT_KEY = 'AWS-SAA-C03-E2E';
export const E2E_CERT_LABEL = 'AWS Solutions Architect E2E';
export const E2E_CERT_TOPIC = 'E2E Topic';

export const E2E_PUBLIC_EXAM_NAME = 'Concurso E2E 2026';
export const E2E_EXAM_BOARD = 'BANCA_E2E';
export const E2E_SUBJECT = 'Direito E2E';

export const mockCertificationQuestions = [
  {
    id: 9001,
    certificationTitle: E2E_CERT_LABEL,
    text: 'E2E Question 1: Which service provides object storage?',
    correctCount: 1,
    topic: E2E_CERT_TOPIC,
    difficulty: 'medium',
    options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
    topicSubarea: undefined,
  },
  {
    id: 9002,
    certificationTitle: E2E_CERT_LABEL,
    text: 'E2E Question 2: Which service provides compute?',
    correctCount: 1,
    topic: E2E_CERT_TOPIC,
    difficulty: 'easy',
    options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' },
    topicSubarea: undefined,
  },
  {
    id: 9003,
    certificationTitle: E2E_CERT_LABEL,
    text: 'E2E Question 3: Which service is a managed relational database?',
    correctCount: 1,
    topic: E2E_CERT_TOPIC,
    difficulty: 'medium',
    options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' },
    topicSubarea: undefined,
  },
];

export const mockPublicExamQuestions = [
  {
    id: 9101,
    publicExamName: E2E_PUBLIC_EXAM_NAME,
    examBoardName: E2E_EXAM_BOARD,
    subject: E2E_SUBJECT,
    topic: undefined,
    text: 'E2E Concurso Question 1: O que é o princípio da legalidade?',
    correctCount: 1,
    difficulty: 'medium',
    options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
  },
  {
    id: 9102,
    publicExamName: E2E_PUBLIC_EXAM_NAME,
    examBoardName: E2E_EXAM_BOARD,
    subject: E2E_SUBJECT,
    topic: undefined,
    text: 'E2E Concurso Question 2: O que é isonomia?',
    correctCount: 1,
    difficulty: 'easy',
    options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
  },
  {
    id: 9103,
    publicExamName: E2E_PUBLIC_EXAM_NAME,
    examBoardName: E2E_EXAM_BOARD,
    subject: E2E_SUBJECT,
    topic: undefined,
    text: 'E2E Concurso Question 3: Qual é a finalidade da CF/88?',
    correctCount: 1,
    difficulty: 'hard',
    options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
  },
];

export const mockAnswersResponse = { generated: 0 };

// Stub returned by PATCH .../attempts/:id (finishAttempt).
// The server-side finishAttempt checks for missing Answer rows and calls ensureAnswers
// if any are missing. To avoid a real OpenAI call in tests we intercept the PATCH itself
// and return a 200 with no body, then intercept the subsequent GET result endpoint with
// a pre-built CertSimuladoResult / MockExamResult stub.
export const mockFinishAttemptResponse = {};

export const mockCertSimuladoResult = {
  attempt: {
    id: 1,
    simuladoId: 1,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    score: 2,
    answers: [
      { simuladoQuestionId: 1, selectedOptions: ['A'] },
      { simuladoQuestionId: 2, selectedOptions: ['B'] },
      { simuladoQuestionId: 3, selectedOptions: ['C'] },
    ],
  },
  simulado: { id: 1, name: 'E2E Simulado', certKey: E2E_CERT_KEY, certLabel: E2E_CERT_LABEL },
  questions: [
    {
      id: 1,
      order: 1,
      question: {
        id: 9001,
        text: 'E2E Question 1: Which service provides object storage?',
        correctCount: 1,
        topic: E2E_CERT_TOPIC,
        options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'Lambda' },
        answer: { correctOptions: ['A'] },
      },
    },
    {
      id: 2,
      order: 2,
      question: {
        id: 9002,
        text: 'E2E Question 2: Which service provides compute?',
        correctCount: 1,
        topic: E2E_CERT_TOPIC,
        options: { A: 'S3', B: 'EC2', C: 'RDS', D: 'CloudFront' },
        answer: { correctOptions: ['B'] },
      },
    },
    {
      id: 3,
      order: 3,
      question: {
        id: 9003,
        text: 'E2E Question 3: Which service is a managed relational database?',
        correctCount: 1,
        topic: E2E_CERT_TOPIC,
        options: { A: 'DynamoDB', B: 'Redshift', C: 'RDS', D: 'ElastiCache' },
        answer: { correctOptions: ['C'] },
      },
    },
  ],
  topicBreakdown: [{ topicName: E2E_CERT_TOPIC, correct: 2, total: 3 }],
};

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
    publicExam: { id: 1, name: E2E_PUBLIC_EXAM_NAME },
  },
  questions: [
    {
      id: 1,
      order: 1,
      publicExamQuestion: {
        id: 9101,
        publicExamName: E2E_PUBLIC_EXAM_NAME,
        examBoardName: E2E_EXAM_BOARD,
        subject: E2E_SUBJECT,
        topic: null,
        text: 'E2E Concurso Question 1: O que é o princípio da legalidade?',
        correctCount: 1,
        difficulty: 'medium',
        options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
        answer: { correctOptions: ['A'] },
      },
    },
    {
      id: 2,
      order: 2,
      publicExamQuestion: {
        id: 9102,
        publicExamName: E2E_PUBLIC_EXAM_NAME,
        examBoardName: E2E_EXAM_BOARD,
        subject: E2E_SUBJECT,
        topic: null,
        text: 'E2E Concurso Question 2: O que é isonomia?',
        correctCount: 1,
        difficulty: 'easy',
        options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
        answer: { correctOptions: ['B'] },
      },
    },
    {
      id: 3,
      order: 3,
      publicExamQuestion: {
        id: 9103,
        publicExamName: E2E_PUBLIC_EXAM_NAME,
        examBoardName: E2E_EXAM_BOARD,
        subject: E2E_SUBJECT,
        topic: null,
        text: 'E2E Concurso Question 3: Qual é a finalidade da CF/88?',
        correctCount: 1,
        difficulty: 'hard',
        options: { A: 'Opção A', B: 'Opção B', C: 'Opção C', D: 'Opção D' },
        answer: { correctOptions: ['C'] },
      },
    },
  ],
  subjectBreakdown: [{ subjectName: E2E_SUBJECT, correct: 2, total: 3 }],
};
