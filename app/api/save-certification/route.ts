import { NextRequest, NextResponse } from 'next/server';
import { CertificationService } from './certification.service';
import { QuotaService } from '@/app/api/billing/quota.service';
import { auth } from '@/auth';

const certificationService = new CertificationService();
const quotaService = new QuotaService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await quotaService.check(session.user.id, 'create_certification', 1);

    const body = await request.json().catch(() => null);
    const certification = certificationService.validate(body);
    const created = await certificationService.save(certification, session.user.id);

    await quotaService.record(session.user.id, 'create_certification', 1);

    return NextResponse.json(
      { message: 'Certification saved successfully', certification: created },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Failed to save certification:', err);
    const body = err.body ?? { error: err, message: err.message || 'Failed to save certification' };
    return NextResponse.json(body, { status: err.status || 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const payload = certificationService.validateTopicUpdate(body);
    const updated = await certificationService.updateTopic(payload, session.user.id);

    return NextResponse.json(
      { message: 'Topic updated successfully', topic: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Failed to update topic:', err);
    return NextResponse.json({ error: err, message: err.message || 'Failed to update topic' }, { status: err.status || 500 });
  }
}
