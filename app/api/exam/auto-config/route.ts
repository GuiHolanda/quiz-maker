import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createAutoConfigJob, getActiveAutoConfigJob } from '@/features/services/auto-config-job.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import type { ExamType } from '@/shared/types';

const quotaService = new QuotaService();
export const maxDuration = 300;

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
    // Antes de qualquer débito de quota: uma rajada barrada não deve consumir cota.
    await enforceRateLimit('auto_config', session.user.id);

    await quotaService.check(session.user.id, 'create_exam', 1);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }
    const { type, name, key, provider, examBoard, role, year, language, edital } = body as Record<string, unknown>;

    if (type !== 'certification' && type !== 'public_exam') {
      throw Object.assign(new Error('type must be "certification" or "public_exam"'), { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      throw Object.assign(new Error('name is required'), { status: 400 });
    }
    const editalRef =
      edital && typeof edital === 'object' && typeof (edital as Record<string, unknown>).url === 'string'
        ? {
            url: (edital as Record<string, unknown>).url as string,
            isPriorYear: (edital as Record<string, unknown>).isPriorYear === true,
          }
        : null;

    const { jobId } = await createAutoConfigJob(session.user.id, {
      type: type as ExamType,
      name: name.trim(),
      key: typeof key === 'string' ? key : null,
      provider: typeof provider === 'string' ? provider : null,
      examBoard: typeof examBoard === 'string' ? examBoard : null,
      role: typeof role === 'string' ? role : null,
      year: typeof year === 'number' ? year : null,
      language: language === 'pt' ? 'pt' : 'en',
      edital: editalRef,
    });

    return NextResponse.json({ jobId }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to create auto-config job:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

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
          seedKey: job.seedKey,
          seedBoard: job.seedBoard,
          seedRole: job.seedRole,
          seedYear: job.seedYear,
          status: job.status,
          stage: job.stage,
          createdAt: job.createdAt,
        }
      : null,
  });
}
