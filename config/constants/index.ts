import { CertificationsState } from '@/features/reducers/certifications.reducer';
import { PublicExamsState } from '@/features/reducers/publicExams.reducer';
import { MockExamsState } from '@/features/reducers/mockExams.reducer';
import { CertSimuladosState } from '@/features/reducers/certSimulados.reducer';

export const CERTIFICATION_GENERATOR_URL = '/certification/question-generator';
export const GET_CERTIFICATION_ANSWERS_URL = '/certification/get-answers';
export const SAVE_QUESTIONS_URL = '/certification/save-questions';
export const SAVE_CERTIFICATION_URL = '/certification/save-certification';
export const QUIZ_GENERATOR_URL = '/certification/quiz-generator';
export const QUIZ_LOCAL_STORAGE_KEY = 'QUIZ';
export const CERTIFICATIONS_LOCAL_STORAGE_KEY = 'CERTIFICATIONS';
export const PUBLIC_EXAMS_LOCAL_STORAGE_KEY = 'PUBLIC_EXAMS';
export const LANGUAGE_LOCAL_STORAGE_KEY = 'app-language';
export const AI_CHAT_LOCAL_STORAGE_KEY = (userId: string) => `AI_CHAT_MESSAGES_${userId}`;
export const AI_CHAT_FOLLOWUP_TIMESTAMP_KEY = (userId: string) => `AI_CHAT_FOLLOWUP_TS_${userId}`;
export const SIMULADO_ATTEMPT_PROGRESS_KEY = (attemptId: number) =>
  `SIMULADO_ATTEMPT_PROGRESS_${attemptId}`;
export const AI_CHAT_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// Auto-logout after 30 minutes of no mouse/keyboard/touch activity while chat is open
export const AI_CHAT_LOGOUT_INACTIVITY_MS = 30 * 60 * 1000;
export const QUESTIONS_PER_PAGE_OPTIONS = [
  { key: '1', label: '1' },
  { key: '5', label: '5' },
  { key: '10', label: '10' },
  { key: '20', label: '20' },
];
export const INITIAL_CERTIFICATIONS_STATE: CertificationsState = {
  certifications: [
    {
      label: 'SAP Certified Associate - Business User - SAP Commerce Cloud',
      key: '(C_C4H32_2411)',
      topics: [
        { name: 'Product Content Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Web Content Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Commerce Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Order Management and Customer Support', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Integrations', maxQuestions: 0.1, minQuestions: 0.01 },
        { name: 'Essential Foundations', maxQuestions: 0.3, minQuestions: 0.21 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP S/4HANA Cloud (public) - Implementation',
      key: '(S4C-IMP)',
      topics: [
        { name: 'Introduction to Cloud Computing and SAP Cloud ERP Basics', maxQuestions: 0.2, minQuestions: 0.11 },
        {
          name: 'Implementing with a Cloud Mindset, Building the Team, and Conducting Fit-to-Standard Workshops',
          maxQuestions: 0.2,
          minQuestions: 0.11,
        },
        { name: 'Configuration and the SAP Fiori Launchpad', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Data Migration and Business Process Testing', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'System Landscapes and Identity Access Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Extensibility and Integration', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP S/4HANA (on-premise) - Professional',
      key: '(S4H-ASSOC)',
      topics: [
        { name: 'S/4HANA Architecture and System Landscape', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Finance (GL/AP/AR)', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Procure-to-Pay and Order-to-Cash Processes', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Material Management and Sales Distribution (MM/SD)', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Manufacturing and MRP', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Extensibility and Migration Considerations', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP S/4HANA Financial Accounting',
      key: '(S4H-FA)',
      topics: [
        { name: 'General Ledger (GL) Fundamentals', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Accounts Payable / Accounts Receivable Processes', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Asset Accounting', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Period-End Closing and Reporting', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Integration with Controlling and Procurement', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Development Associate - ABAP with SAP NetWeaver',
      key: '(ABAP-AA)',
      topics: [
        { name: 'ABAP Programming Models and Syntax', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Data Dictionary and Database Access', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Object-Oriented ABAP', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'ABAP RESTful Programming (RAP) and OData Services', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Debugging, Testing and Performance', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Development Associate - SAP Fiori Application Developer',
      key: '(FIORI-DEV)',
      topics: [
        { name: 'SAPUI5 and Fiori Design Principles', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Fiori Elements and Smart Templates', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'OData Services and Backend Integration', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Deployment and Fiori Launchpad Configuration', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Extensibility and Security for Fiori Apps', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP SuccessFactors Employee Central',
      key: '(SF-EC)',
      topics: [
        { name: 'Employee Central Core Concepts and Data Model', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Organizational Management and Employment Information', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Payroll and Time Integration Points', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Integration with SAP and Third-party Systems', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Migration and Data Loads', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP Integration Suite (CPI)',
      key: '(CPI-ASSOC)',
      topics: [
        { name: 'SAP Cloud Integration (CPI) Concepts and Architecture', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Designing and Configuring iFlows', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Adapters, Mappings and Transformations', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Connectivity and Security (OAuth, Certificates)', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Monitoring, Error Handling and Deployment', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Application Associate - SAP BW/4HANA & Analytics',
      key: '(BW4HANA)',
      topics: [
        { name: 'BW/4HANA Data Modeling and InfoProviders', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Data Acquisition and ETL (ODS/PSA)', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Advanced Analytics and Reporting', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Integration with SAP Analytics Cloud (SAC)', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Performance and Administration', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
    {
      label: 'SAP Certified Technology Associate - SAP BASIS / Administration',
      key: '(BASIS-ASSOC)',
      topics: [
        { name: 'System Administration and Landscape Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Installation, Updates and Transport Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Performance Tuning and Monitoring', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Security, Authorizations and User Management', maxQuestions: 0.2, minQuestions: 0.11 },
        { name: 'Backup, Recovery and High Availability', maxQuestions: 0.2, minQuestions: 0.11 },
      ],
    },
  ],
  selectedCertification: null,
  selectedTopics: [],
  isLoading: true,
};

export const REGISTER_URL = '/auth/register';
export const FORGOT_PASSWORD_URL = '/auth/forgot-password';
export const RESET_PASSWORD_URL = '/auth/reset-password';

export const BILLING_USAGE_URL = '/billing/usage';
export const BILLING_CHECKOUT_URL = '/billing/checkout';
export const BILLING_PORTAL_URL = '/billing/portal';

export const PLAN_LIMITS = {
  free:   { questionsPerPeriod: 250,      maxCertifications: 2,        maxPublicExams: 0 },
  pro:    { questionsPerPeriod: 1500,     maxCertifications: 5,        maxPublicExams: 2 },
  pro_ai: { questionsPerPeriod: 2500,     maxCertifications: 5,        maxPublicExams: 5 },
  tester: { questionsPerPeriod: Infinity, maxCertifications: Infinity, maxPublicExams: Infinity },
  admin:  { questionsPerPeriod: Infinity, maxCertifications: Infinity, maxPublicExams: Infinity },
} as const;

export const ADMIN_USERS_URL = '/admin/users';
export const ADMIN_OVERVIEW_URL = '/admin/overview';
export const ADMIN_AUDIT_LOG_URL = '/admin/audit-log';
export const ADMIN_EXCHANGE_RATE_URL = '/admin/exchange-rate';

export const ACTIVE_MODEL_PRICING_USD = {
  inputPerMillion: 0.75,
  outputPerMillion: 4.50,
} as const;

export const USD_TO_BRL_FALLBACK = 5.70;

export const PLAN_PRICES_BRL_MONTHLY: Record<string, number> = {
  free: 0,
  pro: 19.80,
  pro_ai: 39.80,
};

export const BROWSE_SUMMARY_URL = '/certification/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/certification/browse-questions/questions';

export const PUBLIC_EXAM_GENERATOR_URL = '/public-exam/question-generator';
export const SAVE_PUBLIC_EXAM_QUESTIONS_URL = '/public-exam/save-questions';
export const GET_PUBLIC_EXAM_ANSWERS_URL = '/public-exam/get-answers';
export const SAVE_PUBLIC_EXAM_URL = '/public-exam/save-public-exam';
export const EXTRACT_EDITAL_URL = '/public-exam/extract-from-edital';
export const PUBLIC_EXAMS_URL = '/public-exam/public-exams';
export const EXAM_BOARDS_URL = '/public-exam/exam-boards';
export const BROWSE_PUBLIC_EXAM_SUMMARY_URL = '/public-exam/browse-questions/summary';
export const BROWSE_PUBLIC_EXAM_QUESTIONS_URL = '/public-exam/browse-questions/questions';

export const INITIAL_PUBLIC_EXAMS_STATE: PublicExamsState = {
  publicExams: [],
  selectedPublicExam: null,
  selectedSubjects: [],
  selectedTopic: null,
  isLoading: true,
};

export const MOCK_EXAMS_URL = '/mock-exams';
export const MOCK_EXAMS_LOCAL_STORAGE_KEY = 'MOCK_EXAMS';

export const INITIAL_MOCK_EXAMS_STATE: MockExamsState = {
  mockExams: [],
  isLoading: true,
};

export const CERT_SIMULADOS_URL = '/certification-simulados';
export const CERT_SIMULADOS_LOCAL_STORAGE_KEY = 'CERT_SIMULADOS';
export const CERT_QUESTION_EXPLANATION_URL = '/certification/questions';

export const INITIAL_CERT_SIMULADOS_STATE: CertSimuladosState = {
  simulados: [],
  isLoading: true,
};
