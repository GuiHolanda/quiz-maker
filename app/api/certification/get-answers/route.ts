import { NextRequest, NextResponse } from 'next/server';

import { CertificationQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIQuestion } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { Templates } from '@/config/constants/templates';
import { auth } from '@/auth';

export const maxDuration = 300;

const questionService = new CertificationQuestionService();
const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIQuestion[] = validateAiQuestions(payload) as AIQuestion[];
    const { certificationTitle: certification_name, topic } = questions[0];
    const llmResponse = await openAIService.getLLMResponse(Templates.GET_ANSWER, {
      certification_name,
      topic,
      questions: JSON.stringify(questions),
    });

    const formattedAnswers = JSON.parse(llmResponse);

    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Failed to process request:', err);

    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
