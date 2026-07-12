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
