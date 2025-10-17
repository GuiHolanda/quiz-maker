import { CertificationsState } from "@/features/reducers/certifications.reducer";

export const OPENAI_POST_URL = "/quizGenerator";
export const QUIZ_LOCAL_STORAGE_KEY = "QUIZ";
export const CERTIFICATIONS_LOCAL_STORAGE_KEY = 'CERTIFICATIONS';
export const INITIAL_CERTIFICATIONS_STATE: CertificationsState = {
  certifications: [
  {
    label: 'SAP Certified Associate - Business User - SAP Commerce Cloud',
    key: '(C_C4H32_2411)',
    topics: [
      'Product Content Management',
      'Web Content Management',
      'Commerce Management',
      'Order Management and Customer Support',
      'Integrations',
      'Essential Foundations',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA Cloud (public) - Implementation',
    key: '(S4C-IMP)',
    topics: [
      'Introduction to Cloud Computing and SAP Cloud ERP Basics',
      'Implementing with a Cloud Mindset, Building the Team, and Conducting Fit-to-Standard Workshops',
      'Configuration and the SAP Fiori Launchpad',
      'Data Migration and Business Process Testing',
      'System Landscapes and Identity Access Management',
      'Extensibility and Integration',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA (on-premise) - Professional',
    key: '(S4H-ASSOC)',
    topics: [
      'S/4HANA Architecture and System Landscape',
      'Finance (GL/AP/AR)',
      'Procure-to-Pay and Order-to-Cash Processes',
      'Material Management and Sales Distribution (MM/SD)',
      'Manufacturing and MRP',
      'Extensibility and Migration Considerations',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP S/4HANA Financial Accounting',
    key: '(S4H-FA)',
    topics: [
      'General Ledger (GL) Fundamentals',
      'Accounts Payable / Accounts Receivable Processes',
      'Asset Accounting',
      'Period-End Closing and Reporting',
      'Integration with Controlling and Procurement',
    ],
  },
  {
    label: 'SAP Certified Development Associate - ABAP with SAP NetWeaver',
    key: '(ABAP-AA)',
    topics: [
      'ABAP Programming Models and Syntax',
      'Data Dictionary and Database Access',
      'Object-Oriented ABAP',
      'ABAP RESTful Programming (RAP) and OData Services',
      'Debugging, Testing and Performance',
    ],
  },
  {
    label: 'SAP Certified Development Associate - SAP Fiori Application Developer',
    key: '(FIORI-DEV)',
    topics: [
      'SAPUI5 and Fiori Design Principles',
      'Fiori Elements and Smart Templates',
      'OData Services and Backend Integration',
      'Deployment and Fiori Launchpad Configuration',
      'Extensibility and Security for Fiori Apps',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP SuccessFactors Employee Central',
    key: '(SF-EC)',
    topics: [
      'Employee Central Core Concepts and Data Model',
      'Organizational Management and Employment Information',
      'Payroll and Time Integration Points',
      'Integration with SAP and Third-party Systems',
      'Migration and Data Loads',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP Integration Suite (CPI)',
    key: '(CPI-ASSOC)',
    topics: [
      'SAP Cloud Integration (CPI) Concepts and Architecture',
      'Designing and Configuring iFlows',
      'Adapters, Mappings and Transformations',
      'Connectivity and Security (OAuth, Certificates)',
      'Monitoring, Error Handling and Deployment',
    ],
  },
  {
    label: 'SAP Certified Application Associate - SAP BW/4HANA & Analytics',
    key: '(BW4HANA)',
    topics: [
      'BW/4HANA Data Modeling and InfoProviders',
      'Data Acquisition and ETL (ODS/PSA)',
      'Advanced Analytics and Reporting',
      'Integration with SAP Analytics Cloud (SAC)',
      'Performance and Administration',
    ],
  },
  {
    label: 'SAP Certified Technology Associate - SAP BASIS / Administration',
    key: '(BASIS-ASSOC)',
    topics: [
      'System Administration and Landscape Management',
      'Installation, Updates and Transport Management',
      'Performance Tuning and Monitoring',
      'Security, Authorizations and User Management',
      'Backup, Recovery and High Availability',
    ],
  },
],
  selectedCertification: null,
}
