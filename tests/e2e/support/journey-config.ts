import {
  E2E_CERT_LABEL,
  E2E_CERT_TOPIC,
  E2E_PUBLIC_EXAM_NAME,
  E2E_SUBJECT,
} from './constants';
import { TID } from './selectors';

export type DomainType = 'certification' | 'public_exam';

export interface DomainConfig {
  readonly type: DomainType;
  // /questions type-picker test-id for this vertical
  readonly typeOptionTid: string;
  // URL of the generation page for this vertical
  readonly generationUrl: string;
  // Seeded entity label/name shown in selects and cards
  readonly seedLabel: string;
  // Seeded topic/subject name shown on the result breakdown
  readonly seedTopic: string;
  // Exam configure page URL (/exams/new)
  readonly configureUrl: string;
  // Route glob matched by the generation-job stream for reconnect tests
  readonly streamRouteGlob: string;
}

export const DOMAINS: Record<DomainType, DomainConfig> = {
  certification: {
    type: 'certification',
    typeOptionTid: TID.typeOptionCertification,
    generationUrl: '/questions?type=certification',
    seedLabel: E2E_CERT_LABEL,
    seedTopic: E2E_CERT_TOPIC,
    configureUrl: '/exams/new?type=certification',
    streamRouteGlob: '**/api/generation-job/*/stream',
  },
  public_exam: {
    type: 'public_exam',
    typeOptionTid: TID.typeOptionPublicExam,
    generationUrl: '/questions?type=public_exam',
    seedLabel: E2E_PUBLIC_EXAM_NAME,
    seedTopic: E2E_SUBJECT,
    configureUrl: '/exams/new?type=public_exam',
    streamRouteGlob: '**/api/generation-job/*/stream',
  },
};

export const ALL_DOMAINS: readonly DomainConfig[] = Object.values(DOMAINS);
