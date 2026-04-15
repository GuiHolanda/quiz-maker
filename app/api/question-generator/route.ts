import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/app/api/question-generator/question.service';
import { OpenAIService } from '@/features/services/openAI.service';
import { Templates } from '@/config/constants/templates';
const questionService = new QuestionService();
const openAIService = new OpenAIService();

export async function GET(request: NextRequest) {
  debugger
  const questionParams = questionService.getQuestionParams(new URL(request.url));

  try {
    const response = await openAIService.getLLMResponse(Templates.GENERATE_QUESTIONS, questionParams);
    const questionsFromAi = questionService.getValidatedQuestions(JSON.parse(response));

    return NextResponse.json(questionsFromAi, { status: 200 });
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
