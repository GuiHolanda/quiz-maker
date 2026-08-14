export type DemoCert = {
  readonly id: string;
  readonly mark: string;
  readonly name: string;
  readonly vendor: string;
  readonly year: string;
  readonly track: string;
  readonly questions: number;
  readonly minutes: number;
  readonly passing: string;
  readonly updated: string;
  readonly domains: ReadonlyArray<{ readonly name: string; readonly weight: number }>;
};

export const DEMO_CATALOG: readonly DemoCert[] = [
  {
    id: 'saa',
    mark: 'AWS',
    name: 'AWS Certified Solutions Architect – Associate',
    vendor: 'Amazon Web Services',
    year: '2024',
    track: 'Cloud',
    questions: 65,
    minutes: 130,
    passing: '72%',
    updated: 'Atualizado esta semana',
    domains: [
      { name: 'Arquiteturas resilientes', weight: 26 },
      { name: 'Alta performance', weight: 24 },
      { name: 'Segurança de aplicações', weight: 30 },
      { name: 'Otimização de custos', weight: 20 },
    ],
  },
  {
    id: 'clf',
    mark: 'AWS',
    name: 'AWS Certified Cloud Practitioner',
    vendor: 'Amazon Web Services',
    year: '2024',
    track: 'Cloud',
    questions: 65,
    minutes: 90,
    passing: '70%',
    updated: 'Atualizado esta semana',
    domains: [
      { name: 'Conceitos de cloud', weight: 24 },
      { name: 'Segurança e conformidade', weight: 30 },
      { name: 'Tecnologia e serviços', weight: 34 },
      { name: 'Faturamento e suporte', weight: 12 },
    ],
  },
  {
    id: 'az900',
    mark: 'AZ',
    name: 'Microsoft Azure Fundamentals AZ-900',
    vendor: 'Microsoft',
    year: '2024',
    track: 'Cloud',
    questions: 50,
    minutes: 45,
    passing: '70%',
    updated: 'Atualizado este mês',
    domains: [
      { name: 'Conceitos de cloud', weight: 25 },
      { name: 'Serviços e arquitetura Azure', weight: 35 },
      { name: 'Gerenciamento e governança', weight: 30 },
      { name: 'Segurança e conformidade', weight: 10 },
    ],
  },
  {
    id: 'psm',
    mark: 'PSM',
    name: 'Professional Scrum Master I',
    vendor: 'Scrum.org',
    year: '2024',
    track: 'Ágil',
    questions: 80,
    minutes: 60,
    passing: '85%',
    updated: 'Atualizado este mês',
    domains: [
      { name: 'Teoria e princípios Scrum', weight: 20 },
      { name: 'Eventos Scrum', weight: 25 },
      { name: 'Artefatos Scrum', weight: 20 },
      { name: 'Scrum Team', weight: 20 },
      { name: 'Done e escalabilidade', weight: 15 },
    ],
  },
  {
    id: 'sec',
    mark: 'SEC+',
    name: 'CompTIA Security+ SY0-701',
    vendor: 'CompTIA',
    year: '2024',
    track: 'Segurança',
    questions: 90,
    minutes: 90,
    passing: '75%',
    updated: 'Atualizado anteontem',
    domains: [
      { name: 'Ameaças e vulnerabilidades', weight: 22 },
      { name: 'Arquitetura e design', weight: 18 },
      { name: 'Implementação', weight: 28 },
      { name: 'Operações e resposta a incidentes', weight: 17 },
      { name: 'Governança e conformidade', weight: 15 },
    ],
  },
  {
    id: 'cka',
    mark: 'CKA',
    name: 'Certified Kubernetes Administrator',
    vendor: 'Cloud Native Computing Foundation',
    year: '2024',
    track: 'DevOps',
    questions: 17,
    minutes: 120,
    passing: '66%',
    updated: 'Atualizado este mês',
    domains: [
      { name: 'Armazenamento', weight: 10 },
      { name: 'Troubleshooting', weight: 30 },
      { name: 'Workloads e scheduling', weight: 15 },
      { name: 'Serviços e networking', weight: 20 },
      { name: 'Cluster architecture', weight: 25 },
    ],
  },
];
