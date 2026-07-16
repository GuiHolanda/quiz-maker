export type ScenarioType = 'certification' | 'public_exam';

export interface CertificationScenario {
  id: string;
  type: 'certification';
  label: string;
  promptInput: {
    certification_name: string;
    topic_name: string;
    num_questions: string;
  };
}

export interface PublicExamScenario {
  id: string;
  type: 'public_exam';
  label: string;
  promptInput: {
    public_exam_name: string;
    exam_board_name: string;
    subject_name: string;
    topic_name?: string;
    num_questions: string;
  };
}

export type Scenario = CertificationScenario | PublicExamScenario;

export const SCENARIOS: Scenario[] = [
  {
    id: 'aws-cert',
    type: 'certification',
    label: 'AWS Solutions Architect (TI)',
    promptInput: {
      certification_name: 'AWS Solutions Architect Associate',
      topic_name: 'EC2 e computação em nuvem',
      num_questions: '3',
    },
  },
  {
    id: 'oab-cert',
    type: 'certification',
    label: 'OAB — Exame de Ordem (Direito)',
    promptInput: {
      certification_name: 'OAB — Exame de Ordem',
      topic_name: 'Direito Constitucional',
      num_questions: '3',
    },
  },
  {
    id: 'crm-cert',
    type: 'certification',
    label: 'CRM — Conselho Regional de Medicina (Saúde)',
    promptInput: {
      certification_name: 'CRM — Conselho Regional de Medicina',
      topic_name: 'Ética Médica',
      num_questions: '3',
    },
  },
  {
    id: 'cfp-cert',
    type: 'certification',
    label: 'CFP — Certified Financial Planner (Finanças)',
    promptInput: {
      certification_name: 'CFP — Certified Financial Planner',
      topic_name: 'Planejamento de Investimentos',
      num_questions: '3',
    },
  },
  {
    id: 'crea-cert',
    type: 'certification',
    label: 'CREA — Engenharia Civil (Engenharia)',
    promptInput: {
      certification_name: 'CREA — Engenharia Civil',
      topic_name: 'Resistência dos Materiais',
      num_questions: '3',
    },
  },
  {
    id: 'ibge-concurso',
    type: 'public_exam',
    label: 'Concurso IBGE — Estatística (Concurso Público)',
    promptInput: {
      public_exam_name: 'Concurso IBGE 2024',
      exam_board_name: 'IBGE',
      subject_name: 'Estatística Aplicada',
      topic_name: 'Amostragem e Inferência Estatística',
      num_questions: '3',
    },
  },
];
