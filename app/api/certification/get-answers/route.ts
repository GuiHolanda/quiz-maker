import { NextRequest, NextResponse } from 'next/server';

import { CertificationQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { AIQuestion } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { certificationAnswersPrompt } from '@/config/prompts/certification-answers.prompt';
import { toApiErrorResponse } from '@/lib/api-error';
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

    const llmResponse = await openAIService.call(
      certificationAnswersPrompt,
      { certification_name, topic, questions: JSON.stringify(questions) },
      { webSearch: false, jsonMode: true }
    );

    let formattedAnswers;
    try {
      formattedAnswers = JSON.parse(llmResponse.text);
    } catch {
      console.error('[certification/get-answers] JSON parse failed. Raw snippet:', llmResponse.text.slice(0, 300));
      throw Object.assign(new Error('AI returned malformed JSON — please retry'), { status: 502 });
    }

    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
