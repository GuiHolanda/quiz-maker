import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { MockExamService } from '../mock-exam.service';

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
      publicExam: { id: mockExam.publicExam.id, name: mockExam.publicExam.name, examBoard: mockExam.publicExam.examBoard },
      subjects: mockExam.subjects.map((s) => ({ subjectName: s.subjectName, questionCount: s.questionCount })),
      questions: mockExam.questions.map((mq) => ({
        id: mq.id,
        order: mq.order,
        publicExamQuestion: {
          id: mq.publicExamQuestion.id,
          text: mq.publicExamQuestion.text,
          correctCount: mq.publicExamQuestion.correctCount,
          subject: mq.publicExamQuestion.subject,
          topic: mq.publicExamQuestion.topic,
          difficulty: mq.publicExamQuestion.difficulty,
          options: Object.fromEntries(mq.publicExamQuestion.options.map((o) => [o.label, o.text])),
          answer: mq.publicExamQuestion.answer
            ? {
                questionId: mq.publicExamQuestion.answer.questionId,
                correctOptions: mq.publicExamQuestion.answer.correctOptions,
                explanations: Object.fromEntries(
                  mq.publicExamQuestion.answer.explanations.map((e) => [e.label, e.text]),
                ),
              }
            : null,
          examBoardName: mq.publicExamQuestion.examBoardName,
          publicExamName: mq.publicExamQuestion.publicExamName,
        },
      })),
      attempts: mockExam.attempts,
      createdAt: mockExam.createdAt.toISOString(),
    };

    return NextResponse.json({ mockExam: shaped });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return NextResponse.json({ error: 'Internal Server Error', message: (e as Error).message }, { status });
  }
}
