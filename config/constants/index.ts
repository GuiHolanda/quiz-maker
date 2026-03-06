import { CertificationsState } from "@/features/reducers/certifications.reducer";

export const OPENAI_POST_URL = "/question-generator";
export const QUIZ_GENERATOR_URL = "/quiz-generator";
export const QUIZ_LOCAL_STORAGE_KEY = "QUIZ";
export const CERTIFICATIONS_LOCAL_STORAGE_KEY = 'CERTIFICATIONS';
export const INITIAL_CERTIFICATIONS_STATE: CertificationsState = {
  certifications: [
  {
    label: 'SAP Certified Associate - Business User - SAP Commerce Cloud',
    key: '(C_C4H32_2411)',
    topics: [
      {name: 'Product Content Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Web Content Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Commerce Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Order Management and Customer Support', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Integrations', maxQuestions: 0.1, minQuestions: 0.01},
      {name: 'Essential Foundations', maxQuestions: 0.3, minQuestions: 0.21},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA Cloud (public) - Implementation',
    key: '(S4C-IMP)',
    topics: [
      {name: 'Introduction to Cloud Computing and SAP Cloud ERP Basics', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Implementing with a Cloud Mindset, Building the Team, and Conducting Fit-to-Standard Workshops', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Configuration and the SAP Fiori Launchpad', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Data Migration and Business Process Testing', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'System Landscapes and Identity Access Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Extensibility and Integration', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA (on-premise) - Professional',
    key: '(S4H-ASSOC)',
    topics: [
      {name: 'S/4HANA Architecture and System Landscape', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Finance (GL/AP/AR)', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Procure-to-Pay and Order-to-Cash Processes', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Material Management and Sales Distribution (MM/SD)', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Manufacturing and MRP', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Extensibility and Migration Considerations', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA Financial Accounting',
    key: '(S4H-FA)',
    topics: [
      {name: 'General Ledger (GL) Fundamentals', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Accounts Payable / Accounts Receivable Processes', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Asset Accounting', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Period-End Closing and Reporting', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Integration with Controlling and Procurement', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Development Associate - ABAP with SAP NetWeaver',
    key: '(ABAP-AA)',
    topics: [
      {name: 'ABAP Programming Models and Syntax', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Data Dictionary and Database Access', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Object-Oriented ABAP', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'ABAP RESTful Programming (RAP) and OData Services', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Debugging, Testing and Performance', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Development Associate - SAP Fiori Application Developer',
    key: '(FIORI-DEV)',
    topics: [
      {name: 'SAPUI5 and Fiori Design Principles', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Fiori Elements and Smart Templates', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'OData Services and Backend Integration', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Deployment and Fiori Launchpad Configuration', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Extensibility and Security for Fiori Apps', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP SuccessFactors Employee Central',
    key: '(SF-EC)',
    topics: [
      {name: 'Employee Central Core Concepts and Data Model', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Organizational Management and Employment Information', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Payroll and Time Integration Points', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Integration with SAP and Third-party Systems', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Migration and Data Loads', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP Integration Suite (CPI)',
    key: '(CPI-ASSOC)',
    topics: [
      {name: 'SAP Cloud Integration (CPI) Concepts and Architecture', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Designing and Configuring iFlows', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Adapters, Mappings and Transformations', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Connectivity and Security (OAuth, Certificates)', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Monitoring, Error Handling and Deployment', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP BW/4HANA & Analytics',
    key: '(BW4HANA)',
    topics: [
      {name: 'BW/4HANA Data Modeling and InfoProviders', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Data Acquisition and ETL (ODS/PSA)', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Advanced Analytics and Reporting', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Integration with SAP Analytics Cloud (SAC)', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Performance and Administration', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
  {
    label: 'SAP Certified Technology Associate - SAP BASIS / Administration',
    key: '(BASIS-ASSOC)',
    topics: [
      {name: 'System Administration and Landscape Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Installation, Updates and Transport Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Performance Tuning and Monitoring', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Security, Authorizations and User Management', maxQuestions: 0.2, minQuestions: 0.11},
      {name: 'Backup, Recovery and High Availability', maxQuestions: 0.2, minQuestions: 0.11},
    ],
  },
],
  selectedCertification: null,
  selectedTopics: [],
}
