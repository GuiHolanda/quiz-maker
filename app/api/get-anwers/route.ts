import { NextRequest, NextResponse } from 'next/server';
import { QuestionService } from '@/app/api/question-generator/question.service';
import { AIQuestion } from '@/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { Templates } from '@/config/constants/templates';
const questionService = new QuestionService();
const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIQuestion[] = questionService.getValidatedQuestions(payload);
    const { certificationTitle: certification_name, topic } = questions[0];
    const llmResponse = await openAIService.getLLMResponse(Templates.GET_ANSWER, { certification_name, topic, questions: JSON.stringify(questions) });
  
    const formattedAnswers = JSON.parse(llmResponse);
    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 }
    );
  }
}
