import { NextRequest, NextResponse } from 'next/server';
import { PublicExamQuestionService } from '@/app/api/generator/public-exam-question-generator/public-exam-question.service';
import { AIPublicExamQuestion } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { Templates } from '@/config/constants/templates';
import { auth } from '@/auth';

const questionService = new PublicExamQuestionService();
const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = Array.isArray(body) ? { questions: body } : body;
    const questions: AIPublicExamQuestion[] = questionService.getValidatedQuestions(payload);
    const { publicExamName: public_exam_name, examBoardName: exam_board_name, subject, topic } = questions[0];

    const llmResponse = await openAIService.getLLMResponse(
      Templates.GET_PUBLIC_EXAM_ANSWERS,
      {
        public_exam_name,
        exam_board_name,
        subject_name: subject,
        topic_name: topic ?? '',
        questions: JSON.stringify(questions),
      },
    );

    const formattedAnswers = JSON.parse(llmResponse);
    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json(
      {
        message: 'Public exam answers saved successfully',
        count: formattedAnswers.answers.length,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('Failed to process request:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to process request' },
      { status: err.status || 500 },
    );
  }
}
