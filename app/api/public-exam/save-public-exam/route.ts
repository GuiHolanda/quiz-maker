import { NextRequest, NextResponse } from 'next/server';
import { PublicExamService } from '@/features/services/public-exam.service';
import { QuotaService } from '@/features/services/quota.service';
import { auth } from '@/auth';

const publicExamService = new PublicExamService();
const quotaService = new QuotaService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await quotaService.check(session.user.id, 'create_certification', 1);

    const body = await request.json().catch(() => null);
    const publicExam = publicExamService.validate(body);
    const created = await publicExamService.save(publicExam, session.user.id);

    await quotaService.record(session.user.id, 'create_certification', 1);

    return NextResponse.json(
      { message: 'Public exam saved successfully', publicExam: created },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Failed to save public exam:', err);
    const body = err.body ?? { error: err, message: err.message || 'Failed to save public exam' };
    return NextResponse.json(body, { status: err.status || 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const examId = searchParams.get('examId');

    if (topicId) {
      await publicExamService.deleteTopic(topicId, session.user.id);
      return NextResponse.json({ message: 'Topic deleted successfully' }, { status: 200 });
    }

    if (subjectId) {
      await publicExamService.deleteSubject(subjectId, session.user.id);
      return NextResponse.json({ message: 'Subject deleted successfully' }, { status: 200 });
    }

    if (examId) {
      await publicExamService.deletePublicExam(examId, session.user.id);
      return NextResponse.json({ message: 'Public exam deleted successfully' }, { status: 200 });
    }

    return NextResponse.json({ error: 'subjectId, topicId or examId is required' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to delete:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: err.status || 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { publicExamId, subjectId, name, minQuestions, maxQuestions } = (body ?? {}) as Record<string, unknown>;

    // Add a topic to a subject.
    if (subjectId) {
      if (typeof subjectId !== 'string') {
        return NextResponse.json({ error: 'subjectId must be a string' }, { status: 400 });
      }
      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }
      const topic = await publicExamService.addTopic(subjectId, name, session.user.id);
      return NextResponse.json({ message: 'Topic added successfully', topic }, { status: 201 });
    }

    // Add a subject to a public exam.
    if (publicExamId) {
      if (typeof publicExamId !== 'string') {
        return NextResponse.json({ error: 'publicExamId must be a string' }, { status: 400 });
      }
      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }
      if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
        return NextResponse.json({ error: 'minQuestions and maxQuestions must be numbers' }, { status: 400 });
      }
      const subject = await publicExamService.addSubject(
        publicExamId,
        name,
        minQuestions,
        maxQuestions,
        session.user.id,
      );
      return NextResponse.json({ message: 'Subject added successfully', subject }, { status: 201 });
    }

    return NextResponse.json({ error: 'publicExamId or subjectId is required' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to add:', err);
    return NextResponse.json({ error: err.message || 'Failed to add' }, { status: err.status || 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);

    if (body?.topicId) {
      const { topicId, newName } = (body ?? {}) as Record<string, unknown>;
      if (typeof topicId !== 'string') {
        return NextResponse.json({ error: 'topicId must be a string' }, { status: 400 });
      }
      if (!newName || typeof newName !== 'string') {
        return NextResponse.json({ error: 'newName is required' }, { status: 400 });
      }
      const updated = await publicExamService.updateTopic(topicId, newName.trim(), session.user.id);
      return NextResponse.json({ message: 'Topic updated successfully', topic: updated }, { status: 200 });
    }

    if (body?.subjectId) {
      const payload = publicExamService.validateSubjectUpdate(body);
      const updated = await publicExamService.updateSubject(payload, session.user.id);
      return NextResponse.json({ message: 'Subject updated successfully', subject: updated }, { status: 200 });
    }

    if (body?.publicExamId) {
      const { publicExamId, newName, newRole, newYear, newExamBoardName } = (body ?? {}) as Record<string, unknown>;
      if (typeof publicExamId !== 'string') {
        return NextResponse.json({ error: 'publicExamId must be a string' }, { status: 400 });
      }
      const updated = await publicExamService.updatePublicExamMeta(
        publicExamId,
        {
          newName: typeof newName === 'string' ? newName : undefined,
          newRole: newRole === null ? null : typeof newRole === 'string' ? newRole : undefined,
          newYear: newYear === null ? null : typeof newYear === 'number' ? newYear : undefined,
          newExamBoardName: typeof newExamBoardName === 'string' ? newExamBoardName : undefined,
        },
        session.user.id,
      );
      return NextResponse.json({ message: 'Public exam updated successfully', publicExam: updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'Missing subjectId or publicExamId' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to update:', err);
    return NextResponse.json({ error: err, message: err.message || 'Failed to update' }, { status: err.status || 500 });
  }
}
