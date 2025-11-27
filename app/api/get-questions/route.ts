import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/app/api/get-questions/question.service';
const questionService = new QuestionService();

export async function GET(request: NextRequest) {
  const parsedParams = questionService.parseParams(new URL(request.url));
  if ('error' in parsedParams) return NextResponse.json({ message: parsedParams.error }, { status: 400 });

  const { topic, numQuestions, timeoutMs, certificationTitle } = parsedParams;

  try {
    const response = await questionService.fetchAiQuestions({
      numQuestions,
      certificationTitle,
      topic
    }, timeoutMs);
   
    const validated = questionService.validateQuestions(JSON.parse(response));
    if (!validated.ok || !validated.value) {
      console.error('Invalid questions from LLM', validated.error);
      return NextResponse.json({ message: `Invalid questions: ${validated.error}` }, { status: 502 });
    }
    
    return NextResponse.json(validated.value, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
