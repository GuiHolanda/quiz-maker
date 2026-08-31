import { NextRequest, NextResponse } from 'next/server';

import { MockExamService } from '../mock-exam.service';

import { auth } from '@/auth';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new MockExamService();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const mockExam = await service.getById(Number(id), session.user.id);

    const shaped = {
      id: mockExam.id,
      name: mockExam.name,
      examId: mockExam.examId,
      durationMinutes: mockExam.durationMinutes,
      questionSource: mockExam.questionSource,
      passingScorePercent: mockExam.passingScorePercent,
      exam: {
        id: mockExam.exam.id,
        name: mockExam.exam.name,
        type: mockExam.exam.type,
        provider: mockExam.exam.provider,
        examBoard: mockExam.exam.examBoard,
      },
      sections: mockExam.sections.map((s) => ({ sectionName: s.sectionName, questionCount: s.questionCount })),
      questions: mockExam.questions.map((mq) => ({
        id: mq.id,
        order: mq.order,
        examQuestion: {
          id: mq.examQuestion.id,
          text: mq.examQuestion.text,
          correctCount: mq.examQuestion.correctCount,
          sectionName: mq.examQuestion.sectionName,
          topic: mq.examQuestion.topicName,
          difficulty: mq.examQuestion.difficulty,
          options: Object.fromEntries(mq.examQuestion.options.map((o) => [o.label, o.text])),
          answer: mq.examQuestion.answer
            ? {
                questionId: mq.examQuestion.answer.questionId,
                correctOptions: mq.examQuestion.answer.correctOptions,
                explanations: Object.fromEntries(mq.examQuestion.answer.explanations.map((e) => [e.label, e.text])),
              }
            : null,
          examName: mq.examQuestion.examName,
        },
      })),
      attempts: mockExam.attempts,
      createdAt: mockExam.createdAt.toISOString(),
    };

    return NextResponse.json({ mockExam: shaped });
  } catch (e: unknown) {
    const { status, ...body } = toApiErrorResponse(e);

    return NextResponse.json(body, { status });
  }
}
