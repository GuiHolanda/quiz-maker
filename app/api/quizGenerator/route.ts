import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/app/api/quizGenerator/question.service';
const questionService = new QuestionService();

export async function GET(request: NextRequest) {
  const parsedParams = questionService.parseParams(new URL(request.url));
  if ('error' in parsedParams) return NextResponse.json({ message: parsedParams.error }, { status: 400 });

  const { topic, numQuestions, newPercent, timeoutMs, certificationTitle } = parsedParams;

  try {
    const { desiredNew, recycledNeeded } = await questionService.handleNewQuestionsDistribution(
      topic,
      numQuestions,
      newPercent
    );

    const response = await questionService.fetchAiQuestions({
      numQuestions: desiredNew,
      certificationTitle,
      topic
    }, timeoutMs);
   
    const validated = questionService.validateQuestions(JSON.parse(response));
    if (!validated.ok || !validated.value) {
      console.error('Invalid questions from LLM', validated.error);
      return NextResponse.json({ message: `Invalid questions: ${validated.error}` }, { status: 502 });
    }
    const questionsFromAi = validated.value;

    const shuffled = questionsFromAi.map((q) => questionService.shuffleQuestionOptions(q));
    await questionService.createFromPayload(shuffled);

    const recycledQuestions =
      recycledNeeded > 0 ? await questionService.fetchRecycledQuestions(topic || undefined, recycledNeeded) : [];

    const final = [...recycledQuestions, ...shuffled];
    return NextResponse.json(final, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
