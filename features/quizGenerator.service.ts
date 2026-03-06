import { OPENAI_POST_URL } from '@/config/constants';
import { AIQuestion, QuestionParams } from '@/types';
import api from '@/lib/bff.api';

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