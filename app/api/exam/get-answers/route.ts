import { NextRequest, NextResponse } from 'next/server';

import { ExamQuestionService, validateAiQuestions } from '@/features/services/exam-question.service';
import { AIExamQuestion, ExamType } from '@/shared/types';
import { OpenAIService } from '@/features/services/openAI.service';
import { certificationAnswersPrompt } from '@/config/prompts/certification-answers.prompt';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-answers.prompt';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 300;

const questionService = new ExamQuestionService();
const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const type: ExamType = body?.type === 'public_exam' ? 'public_exam' : 'certification';
    const rawQuestions = Array.isArray(body) ? body : body?.questions;
    const questions: AIExamQuestion[] = validateAiQuestions({ questions: rawQuestions }) as AIExamQuestion[];
    const { examName, sectionName, topic } = questions[0];

    let llmText: string;

    if (type === 'certification') {
      const llmResponse = await openAIService.call(
        certificationAnswersPrompt,
        { certification_name: examName, topic: sectionName, questions: JSON.stringify(questions) },
        { webSearch: false, jsonMode: true }
      );

      llmText = llmResponse.text;
    } else {
      const exam = await prisma.exam.findFirst({
        where: { name: examName, userId: session.user.id },
        select: { role: true, examBoard: { select: { name: true } } },
      });

      const llmResponse = await openAIService.call(
        publicExamAnswersPrompt,
        {
          public_exam_name: examName,
          exam_board_name: exam?.examBoard?.name ?? '',
          role: exam?.role ?? undefined,
          subject_name: sectionName,
          topic_name: topic,
          questions,
        },
        { webSearch: false, jsonMode: true }
      );

      llmText = llmResponse.text;
    }

    let formattedAnswers;
    try {
      formattedAnswers = JSON.parse(llmText);
    } catch {
      console.error('[exam/get-answers] JSON parse failed. Raw snippet:', llmText.slice(0, 300));
      throw Object.assign(new Error('AI returned malformed JSON — please retry'), { status: 502 });
    }

    await questionService.saveAnswers(formattedAnswers.answers);

    return NextResponse.json({ message: 'Answers saved successfully', count: formattedAnswers.answers.length }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to process request:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
