import { OPENAI_POST_URL, SAVE_QUESTIONS_URL, SAVE_CERTIFICATION_URL, QUIZ_GENERATOR_URL, BILLING_USAGE_URL, BILLING_CHECKOUT_URL, BILLING_PORTAL_URL } from '@/config/constants';
import { AIQuestion, Certification, QuestionParams, StoredQuestion, TopicUpdatePayload, UsageStats } from '@/types';
import api from '@/lib/bff.api';

export async function getCertifications(): Promise<Certification[]> {
  const { data } = await api.get<{ certifications: Certification[] }>('/certification/certifications');
  return data.certifications;
}

export async function getQuestions(requestPayload: QuestionParams): Promise<AIQuestion[]> {
  const { num_questions, topic_name, certification_name } = requestPayload;

  const { data } = await api.get<AIQuestion[]>(OPENAI_POST_URL, {
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

export async function saveCertification(certification: Certification): Promise<Certification> {
  const { data } = await api.post<{ certification: Certification }>(SAVE_CERTIFICATION_URL, certification);
  return data.certification;
}

export async function updateCertificationTopic(payload: TopicUpdatePayload): Promise<void> {
  await api.patch(SAVE_CERTIFICATION_URL, payload);
}

export async function getQuizQuestions(params: { certificationTitle: string; numQuestions: number }): Promise<StoredQuestion[]> {
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