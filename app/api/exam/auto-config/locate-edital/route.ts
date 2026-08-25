import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { locateEdital } from '@/features/services/auto-config-job.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';

const quotaService = new QuotaService();

export const maxDuration = 300;

// Cheap pre-job lookup — same shape as /identify. Runs after the user confirms a concurso +
// cargo, before the AutoConfigJob is created, so its result (a PDF to use, or none found) can
// become a user decision without spending the job's auto_config unit on it.
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
    const { examName, examBoard, editalKey, year, role, language } = body as Record<string, unknown>;

    if (typeof examName !== 'string' || !examName.trim()) {
      throw Object.assign(new Error('examName is required'), { status: 400 });
    }
    if (typeof role !== 'string' || !role.trim()) {
      throw Object.assign(new Error('role is required'), { status: 400 });
    }

    const result = await locateEdital(session.user.id, {
      examName: examName.trim(),
      examBoard: typeof examBoard === 'string' && examBoard.trim() ? examBoard.trim() : null,
      editalKey: typeof editalKey === 'string' && editalKey.trim() ? editalKey.trim() : null,
      year: typeof year === 'number' ? year : null,
      role: role.trim(),
      language: language === 'pt' ? 'pt' : 'en',
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Failed to locate edital:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
