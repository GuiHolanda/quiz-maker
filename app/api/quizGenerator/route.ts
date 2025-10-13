import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { PROMPT_CONFIG } from '@/config/constants';
import { buildPrompt } from '@/features/quizGenerator.service';
import { QuestionService } from '@/app/api/quizGenerator/question.service';
import { safeJsonParse } from '@/utils';

const questionService = new QuestionService();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = questionService.parseParams(url);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const { topic, numQuestions, difficulty, newPercent, timeoutMs } = parsed;

  try {
    const { desiredNew, recycledNeeded } = await questionService.handleNewQuestionsDistribution(
      topic || undefined,
      numQuestions,
      newPercent
    );

    const prompt = buildPrompt({
      num_questions: String(desiredNew),
      topic,
      difficulty_distribution: difficulty,
    }, PROMPT_CONFIG);

    const client = new OpenAI({ apiKey });
    const outputText = await questionService.fetchAiQuestions(client, prompt, timeoutMs);
    const parsedResp = safeJsonParse<any>(outputText ?? '');
    if (!parsedResp.ok) {
      console.error('invalid response from LLM', parsedResp.error);
      return NextResponse.json({ error: 'invalid response JSON from LLM' }, { status: 502 });
    }

    const { ok, value: questionsFromAi, error } = questionService.validateQuestions(parsedResp.value);
    if (!ok || !questionsFromAi) return NextResponse.json({ error: `Invalid questions: ${error}` }, { status: 502 });

    await questionService.createFromPayload(questionsFromAi);

    const recycledQuestions =
      recycledNeeded > 0 ? await questionService.fetchRecycledQuestions(topic || undefined, recycledNeeded) : [];

    const final = [...recycledQuestions, ...questionsFromAi];
    return NextResponse.json(final, { status: 200 });
  } catch (err) {
    console.error('Failed to compute persistence plan:', err);
    return NextResponse.json({ error: 'Failed to compute persistence plan' }, { status: 500 });
  }
}
