import { OPENAI_POST_URL } from '@/config/constants';
import { AIQuestion, QuizParams } from '@/types';
import api from '@/lib/bff.api';

export async function getQuestions(requestPayload: QuizParams): Promise<AIQuestion[]> {
  const { numQuestions, topic, newPercent, certificationTitle } = requestPayload;

  const { data } = await api.get<AIQuestion[]>(OPENAI_POST_URL, {
    params: {
      certificationTitle,
      topic,
      numQuestions,
      newPercent: newPercent ?? 0.3,
      easy: 0.2,
      medium: 0.5,
      hard: 0.3,
    },
  });

  return data;
}