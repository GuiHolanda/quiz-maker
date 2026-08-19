import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { identifyExam } from '@/features/services/auto-config-job.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';
import type { ExamType } from '@/shared/types';

const quotaService = new QuotaService();

export const maxDuration = 300;

// Cheap identify turn — replaces the old two-turn chat impersonation in useExamSeed.hook.ts
// with a single call returning structured JSON matches. Gated the same as job creation
// (plan + exam cap), plus a read-only auto_config quota peek so a user with none left
// doesn't burn tokens on a lookup the job right after would reject anyway.
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
    await quotaService.check(session.user.id, 'create_exam', 1);
    await quotaService.checkAutoConfigAvailable(session.user.id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }
    const { query, type, language } = body as Record<string, unknown>;

    if (type !== 'certification' && type !== 'public_exam') {
      throw Object.assign(new Error('type must be "certification" or "public_exam"'), { status: 400 });
    }
    if (typeof query !== 'string' || !query.trim()) {
      throw Object.assign(new Error('query is required'), { status: 400 });
    }

    const result = await identifyExam(session.user.id, query.trim(), type as ExamType, language === 'pt' ? 'pt' : 'en');

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Failed to identify exam:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
