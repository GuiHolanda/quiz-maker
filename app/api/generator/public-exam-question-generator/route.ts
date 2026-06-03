import { NextRequest, NextResponse } from 'next/server';
import { PublicExamQuestionService } from './public-exam-question.service';
import { OpenAIService } from '@/features/services/openAI.service';
import { buildGeneratePublicExamQuestionsPrompt } from '@/config/promptSchemas/generatePublicExamQuestions';
import { QuotaService } from '@/app/api/billing/quota.service';
import { auth } from '@/auth';

const questionService = new PublicExamQuestionService();
const openAIService = new OpenAIService();
const quotaService = new QuotaService();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const questionParams = questionService.getQuestionParams(new URL(request.url));
  const count = parseInt(questionParams.num_questions, 10) || 1;

  try {
    await quotaService.check(session.user.id, 'generate_questions', count);

    const prompt = buildGeneratePublicExamQuestionsPrompt(questionParams);
    const response = await openAIService.getLLMResponseWithWebSearch(prompt);
    const questionsFromAi = questionService.getValidatedQuestions(JSON.parse(response));

    await quotaService.record(session.user.id, 'generate_questions', count);

    return NextResponse.json(questionsFromAi, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    const body = err.body ?? { error: err, message: err.message || 'Failed to process request' };
    return NextResponse.json(body, { status: err.status || 500 });
  }
}
