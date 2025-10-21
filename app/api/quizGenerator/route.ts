import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_CONFIG } from '@/config/constants/promptConfig';
import { buildPrompt } from '@/features/quizGenerator.service';
import { QuestionService } from '@/app/api/quizGenerator/question.service';
import { safeJsonParse } from '@/utils';

const questionService = new QuestionService();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsedParams = questionService.parseParams(url);
  if ('error' in parsedParams) return NextResponse.json({ message: parsedParams.error }, { status: 400 });

  const { topic, numQuestions, difficulty, newPercent, timeoutMs, certificationTitle } = parsedParams;

  try {
    const { desiredNew, recycledNeeded } = await questionService.handleNewQuestionsDistribution(
      topic,
      numQuestions,
      newPercent
    );

    const prompt = buildPrompt({
      certificationTitle,
      numQuestions: desiredNew,
      topic,
      difficulty: difficulty,
    }, PROMPT_CONFIG);

    const outputText = await questionService.fetchAiQuestions( prompt, timeoutMs);
    const parsedResp = safeJsonParse(outputText ?? '');
    if (!parsedResp.ok) {
      console.error('invalid response from LLM', parsedResp.error);
      return NextResponse.json({ message: 'invalid response JSON from LLM' }, { status: 502 });
    }

    const { ok, value: questionsFromAi, error } = questionService.validateQuestions(parsedResp.value);
    if (!ok || !questionsFromAi) return NextResponse.json({ message: `Invalid questions: ${error}` }, { status: 502 });

    await questionService.createFromPayload(questionsFromAi);

    const recycledQuestions =
      recycledNeeded > 0 ? await questionService.fetchRecycledQuestions(topic || undefined, recycledNeeded) : [];

    const final = [...recycledQuestions, ...questionsFromAi];
    return NextResponse.json(final, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json({ error: err, message: err.message || "Failed to process request" }, { status: err.status || 500 });
  }
}
