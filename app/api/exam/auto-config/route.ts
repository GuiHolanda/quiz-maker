import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createAutoConfigJob, getActiveAutoConfigJob } from '@/features/services/auto-config-job.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';
import type { ExamType } from '@/shared/types';

const quotaService = new QuotaService();

export const maxDuration = 60;

// Creates the auto-config job for the seed the user confirmed via /auto-config/identify.
// Charges one auto_config unit for the whole research→review→format pipeline and returns
// the jobId immediately — progress is followed over SSE at /auto-config/[jobId]/stream.
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!dbUser || !canEditExams(dbUser.plan)) {
    return NextResponse.json(
      { error: 'plan_required', code: 'plan_required', message: 'Auto-config requires the pro plan or higher' },
      { status: 403 }
    );
  }

  try {
    // Exam cap first: a user who can't save another exam must not spend an LLM call —
    // nor an auto_config unit — on a blueprint that has nowhere to land.
    await quotaService.check(session.user.id, 'create_exam', 1);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }
    const { type, name, key, provider, examBoard, role, year, language } = body as Record<string, unknown>;

    if (type !== 'certification' && type !== 'public_exam') {
      throw Object.assign(new Error('type must be "certification" or "public_exam"'), { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      throw Object.assign(new Error('name is required'), { status: 400 });
    }

    const { jobId } = await createAutoConfigJob(session.user.id, {
      type: type as ExamType,
      name: name.trim(),
      key: typeof key === 'string' ? key : null,
      provider: typeof provider === 'string' ? provider : null,
      examBoard: typeof examBoard === 'string' ? examBoard : null,
      role: typeof role === 'string' ? role : null,
      year: typeof year === 'number' ? year : null,
      language: language === 'pt' ? 'pt' : 'en',
    });

    return NextResponse.json({ jobId }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to create auto-config job:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

// Reconnect support: /exams/new checks for an already-running job on mount so a reload
// mid-pipeline doesn't strand the user on a blank picker.
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type');
  if (type !== 'certification' && type !== 'public_exam') {
    return NextResponse.json({ error: 'type must be "certification" or "public_exam"' }, { status: 400 });
  }

  const job = await getActiveAutoConfigJob(session.user.id, type);

  return NextResponse.json({
    job: job
      ? {
          id: job.id,
          type: job.type,
          seedName: job.seedName,
          seedProvider: job.seedProvider,
          status: job.status,
          stage: job.stage,
        }
      : null,
  });
}
