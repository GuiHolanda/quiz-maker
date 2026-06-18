import { NextRequest, NextResponse } from 'next/server';

import { CertificationQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { OpenAIService } from '@/features/services/openAI.service';
import { certificationQuestionsPrompt } from '@/config/prompts/certification-questions.prompt';
import { QuotaService } from '@/features/services/quota.service';
import { auth } from '@/auth';

export const maxDuration = 300;

const questionService = new CertificationQuestionService();
const openAIService = new OpenAIService();
const quotaService = new QuotaService();

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);

  if (fenced) return fenced[1].trim();

  return raw.trim();
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const questionParams = questionService.getQuestionParams(new URL(request.url));
  const count = parseInt(questionParams.num_questions, 10) || 1;

  try {
    await quotaService.check(session.user.id, 'generate_questions', count);

    const rawResponse = await openAIService.call(certificationQuestionsPrompt, {
      certification_name: questionParams.certification_name,
      topic_name: questionParams.topic_name,
      num_questions: questionParams.num_questions,
    });
    const questionsFromAi = validateAiQuestions(JSON.parse(extractJson(rawResponse)));

    await quotaService.record(session.user.id, 'generate_questions', count);

    return NextResponse.json(questionsFromAi, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    const body = err.body ?? { error: err, message: err.message || 'Failed to process request' };

    return NextResponse.json(body, { status: err.status || 500 });
  }
}
