import { OPENAI_POST_URL } from '@/config/constants';
import { AIQuestion, QuizParams } from '@/types';
import api from '@/lib/bff.api';

export async function getQuestions(requestPayload: QuizParams): Promise<AIQuestion[]> {
  const { numQuestions, topic, certificationTitle } = requestPayload;

  const { data } = await api.get<AIQuestion[]>(OPENAI_POST_URL, {
    params: {
      certificationTitle,
      topic,
      numQuestions,
    },
  });

  return data;
}