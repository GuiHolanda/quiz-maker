import { OPENAI_POST_URL } from '@/config/constants';
import { Question, QuestionParams } from '@/types';
import api from '@/lib/bff.api';

export async function getQuestions(requestPayload: QuestionParams): Promise<Question[]> {
  const { num_questions, topic_name, certification_name } = requestPayload;

  const { data } = await api.get<Question[]>(OPENAI_POST_URL, {
    params: {
      certification_name,
      topic_name,
      num_questions,
    },
  });

  return data;
}