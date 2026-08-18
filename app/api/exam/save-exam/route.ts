import { NextRequest, NextResponse } from 'next/server';

import { ExamService } from '@/features/services/exam.service';
import { QuotaService } from '@/features/services/quota.service';
import { toApiErrorResponse } from '@/lib/api-error';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canEditExams } from '@/config/constants';

const examService = new ExamService();
const quotaService = new QuotaService();

// free is catalog-only, read-only — every write here except deleting the whole exam
// (kept open so a forked catalog exam never traps a free user, see plan §2.7).
async function requireExamEditAccess(userId: string): Promise<NextResponse | null> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });

  if (!dbUser || !canEditExams(dbUser.plan)) {
    return NextResponse.json(
      { error: 'plan_required', message: 'Creating or editing exams requires the pro plan or higher' },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gateError = await requireExamEditAccess(session.user.id);
  if (gateError) return gateError;

  try {
    await quotaService.check(session.user.id, 'create_exam', 1);

    const body = await request.json().catch(() => null);
    const exam = examService.validate(body);
    const created = await examService.save(exam, session.user.id);

    await quotaService.record(session.user.id, 'create_exam', 1);

    return NextResponse.json({ message: 'Exam saved successfully', exam: created }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to save exam:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const sectionId = searchParams.get('sectionId');
    const topicId = searchParams.get('topicId');

    if (examId) {
      await examService.deleteExam(examId, session.user.id);

      return NextResponse.json({ message: 'Exam deleted successfully' }, { status: 200 });
    }

    if (sectionId) {
      const gateError = await requireExamEditAccess(session.user.id);
      if (gateError) return gateError;

      await examService.deleteSection(sectionId, session.user.id);

      return NextResponse.json({ message: 'Section deleted successfully' }, { status: 200 });
    }

    if (topicId) {
      const gateError = await requireExamEditAccess(session.user.id);
      if (gateError) return gateError;

      await examService.deleteTopic(topicId, session.user.id);

      return NextResponse.json({ message: 'Topic deleted successfully' }, { status: 200 });
    }

    return NextResponse.json({ error: 'examId, sectionId or topicId is required' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Failed to delete:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gateError = await requireExamEditAccess(session.user.id);
  if (gateError) return gateError;

  try {
    const body = await request.json().catch(() => null);
    const { kind } = (body ?? {}) as Record<string, unknown>;

    if (kind === 'topic') {
      const { sectionId, name } = (body ?? {}) as Record<string, unknown>;

      if (!sectionId || typeof sectionId !== 'string') {
        return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
      }
      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }
      const topic = await examService.addTopic(sectionId, name, session.user.id);

      return NextResponse.json({ message: 'Topic added successfully', topic }, { status: 201 });
    }

    // default: add a section
    const { examId, name, minQuestions, maxQuestions } = (body ?? {}) as Record<string, unknown>;

    if (!examId || typeof examId !== 'string') {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      return NextResponse.json({ error: 'minQuestions and maxQuestions must be numbers' }, { status: 400 });
    }

    const section = await examService.addSection(examId, name, minQuestions, maxQuestions, session.user.id);

    return NextResponse.json({ message: 'Section added successfully', section }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to add section/topic:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gateError = await requireExamEditAccess(session.user.id);
  if (gateError) return gateError;

  try {
    const body = await request.json().catch(() => null);
    const { kind } = (body ?? {}) as Record<string, unknown>;

    if (kind === 'topic') {
      const { topicId, newName } = (body ?? {}) as Record<string, unknown>;

      if (!topicId || typeof topicId !== 'string' || !newName || typeof newName !== 'string') {
        return NextResponse.json({ error: 'topicId and newName are required' }, { status: 400 });
      }
      const topic = await examService.updateTopic(topicId, newName, session.user.id);

      return NextResponse.json({ message: 'Topic updated successfully', topic }, { status: 200 });
    }

    if (kind === 'section') {
      const payload = examService.validateSectionUpdate(body);
      const updated = await examService.updateSection(payload, session.user.id);

      return NextResponse.json({ message: 'Section updated successfully', section: updated }, { status: 200 });
    }

    if (body?.examId && Array.isArray((body as Record<string, unknown>).sections)) {
      const { examId, ...examBody } = body as Record<string, unknown> & { examId: string };
      const exam = examService.validate(examBody);
      const updated = await examService.updateExam(examId, exam, session.user.id);

      return NextResponse.json({ message: 'Exam updated successfully', exam: updated }, { status: 200 });
    }

    if (body?.examId) {
      const {
        examId,
        newName,
        newKey,
        newRole,
        newYear,
        newProviderName,
        newExamBoardName,
        newTotalQuestions,
        newExamDurationMinutes,
        newPassingScore,
      } = (body ?? {}) as Record<string, unknown>;

      if (typeof examId !== 'string') {
        return NextResponse.json({ error: 'examId must be a string' }, { status: 400 });
      }
      const updated = await examService.updateExamMeta(
        examId,
        {
          newName: typeof newName === 'string' ? newName : undefined,
          newKey: newKey === null ? null : typeof newKey === 'string' ? newKey : undefined,
          newRole: newRole === null ? null : typeof newRole === 'string' ? newRole : undefined,
          newYear: newYear === null ? null : typeof newYear === 'number' ? newYear : undefined,
          newProviderName:
            newProviderName === null ? null : typeof newProviderName === 'string' ? newProviderName : undefined,
          newExamBoardName:
            newExamBoardName === null ? null : typeof newExamBoardName === 'string' ? newExamBoardName : undefined,
          newTotalQuestions:
            typeof newTotalQuestions === 'number' && newTotalQuestions > 0 ? Math.round(newTotalQuestions) : undefined,
          newExamDurationMinutes:
            newExamDurationMinutes === null
              ? null
              : typeof newExamDurationMinutes === 'number' && newExamDurationMinutes > 0
                ? Math.round(newExamDurationMinutes)
                : undefined,
          newPassingScore:
            newPassingScore === null
              ? null
              : typeof newPassingScore === 'number' && newPassingScore >= 0 && newPassingScore <= 100
                ? newPassingScore
                : undefined,
        },
        session.user.id
      );

      return NextResponse.json({ message: 'Exam updated successfully', exam: updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'Missing kind or examId' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Failed to update:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
