import { NextRequest, NextResponse } from 'next/server';

import { PublicExamQuestionService, validateAiQuestions } from '@/features/services/question.service';
import { OpenAIService } from '@/features/services/openAI.service';
import { publicExamQuestionsResearchPrompt } from '@/config/prompts/public-exam-questions-research.prompt';
import { publicExamQuestionsReviewPrompt } from '@/config/prompts/public-exam-questions-review.prompt';
import { publicExamQuestionsFormatPrompt } from '@/config/prompts/public-exam-questions-format.prompt';
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
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const questionParams = questionService.getQuestionParams(new URL(request.url));
  const count = parseInt(questionParams.num_questions, 10) || 1;
  const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = questionParams;

  try {
    const { logId } = await quotaService.checkAndRecordQuestions(session.user.id, count);

    const researchResponse = await openAIService.call(
      publicExamQuestionsResearchPrompt,
      { public_exam_name, exam_board_name, subject_name, topic_name, num_questions },
      { webSearch: true }
    );

    const reviewResponse = await openAIService.call(
      publicExamQuestionsReviewPrompt,
      { public_exam_name, exam_board_name, subject_name, topic_name, draft_questions: researchResponse.text },
      { webSearch: false, model: process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o' }
    );

    const formatResponse = await openAIService.call(
      publicExamQuestionsFormatPrompt,
      { public_exam_name, exam_board_name, subject_name, topic_name, reviewed_questions: reviewResponse.text },
      { webSearch: false, jsonMode: true }
    );

    void quotaService.recordTokens(logId, {
      inputTokens: researchResponse.inputTokens + reviewResponse.inputTokens + formatResponse.inputTokens,
      outputTokens: researchResponse.outputTokens + reviewResponse.outputTokens + formatResponse.outputTokens,
    });

    let questionsFromAi;
    try {
      questionsFromAi = validateAiQuestions(JSON.parse(extractJson(formatResponse.text)));
    } catch {
      console.error('[public-exam/question-generator] JSON parse failed. Raw snippet:', formatResponse.text.slice(0, 300));
      throw Object.assign(new Error('AI returned malformed JSON — please retry'), { status: 502 });
    }

    return NextResponse.json(questionsFromAi, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
