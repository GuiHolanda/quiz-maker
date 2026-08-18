import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { EditalExtractorService } from '@/features/services/edital-extractor.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';

const editalExtractorService = new EditalExtractorService();
const quotaService = new QuotaService();

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
      { error: 'plan_required', message: 'Edital extraction requires the pro plan or higher' },
      { status: 403 }
    );
  }

  try {
    await quotaService.checkAndRecordAutoConfig(session.user.id);

    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file');
    const role = formData.get('role');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    editalExtractorService.validateFile(file);

    const exam = await editalExtractorService.extract(
      session.user.id,
      file,
      typeof role === 'string' && role.trim() ? role.trim() : undefined
    );

    return NextResponse.json({ exam }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to extract edital:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
