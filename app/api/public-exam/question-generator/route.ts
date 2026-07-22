import { NextRequest, NextResponse } from 'next/server';

import { PublicExamQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { OpenAIService } from '@/features/services/openAI.service';
import { publicExamQuestionsPrompt } from '@/config/prompts/public-exam-questions.prompt';
import { QuotaService } from '@/features/services/quota.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';

export const maxDuration = 300;

const questionService = new PublicExamQuestionService();
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
    const { logId } = await quotaService.checkAndRecordQuestions(session.user.id, count);

    const rawResponse = await openAIService.call(publicExamQuestionsPrompt, questionParams);
    void quotaService.recordTokens(logId, { inputTokens: rawResponse.inputTokens, outputTokens: rawResponse.outputTokens });
    const questionsFromAi = validateAiQuestions(JSON.parse(extractJson(rawResponse.text)));

    return NextResponse.json(questionsFromAi, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
