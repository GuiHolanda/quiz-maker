import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { CertificationQuestionService } from '@/features/services/question.service';
import { certificationExplanationsPrompt } from '@/config/prompts/certification-explanations.prompt';
import { toApiErrorResponse } from '@/lib/api-error';

export const maxDuration = 300;

const openAIService = new OpenAIService();
const questionService = new CertificationQuestionService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { questionId } = await params;
    const id = Number(questionId);

    const question = await prisma.question.findFirst({
      where: { id, userId: session.user.id },
      include: {
        options: true,
        answer: { include: { explanations: true } },
      },
    });

    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!question.answer) return NextResponse.json({ error: 'No answer for this question yet' }, { status: 404 });

    if (question.answer.explanations.length > 0) {
      const explanations = Object.fromEntries(question.answer.explanations.map((e) => [e.label, e.text]));

      return NextResponse.json({ explanations });
    }

    const correctOptions = question.answer.correctOptions as string[];
    const options = Object.fromEntries(question.options.map((o) => [o.label, o.text]));

    const llmResponse = await openAIService.call(certificationExplanationsPrompt, {
      certification_name: question.certificationTitle,
      topic: question.topic,
      question: { text: question.text, options, correctOptions },
    });

    const { explanations } = JSON.parse(llmResponse.text) as { explanations: Record<string, string> };

    await questionService.saveExplanations(question.answer.id, explanations);

    return NextResponse.json({ explanations });
  } catch (err: unknown) {
    console.error('Failed to get explanation:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
