import { NextRequest, NextResponse } from 'next/server';
import { CertificationService } from '@/features/services/certification.service';
import { QuotaService } from '@/features/services/quota.service';
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

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    await certificationService.deleteTopic(topicId, session.user.id);
    return NextResponse.json({ message: 'Topic deleted successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Failed to delete topic:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete topic' }, { status: err.status || 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { certificationKey, name, minQuestions, maxQuestions } = (body ?? {}) as Record<string, unknown>;

    if (!certificationKey || typeof certificationKey !== 'string') {
      return NextResponse.json({ error: 'certificationKey is required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      return NextResponse.json({ error: 'minQuestions and maxQuestions must be numbers' }, { status: 400 });
    }

    const topic = await certificationService.addTopic(certificationKey, name, minQuestions, maxQuestions, session.user.id);
    return NextResponse.json({ message: 'Topic added successfully', topic }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to add topic:', err);
    return NextResponse.json({ error: err.message || 'Failed to add topic' }, { status: err.status || 500 });
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
      const payload = certificationService.validateTopicUpdate(body);
      const updated = await certificationService.updateTopic(payload, session.user.id);
      return NextResponse.json({ message: 'Topic updated successfully', topic: updated }, { status: 200 });
    }

    if (body?.certificationKey) {
      const { certificationKey, newLabel, newKey, newProvider } = (body ?? {}) as Record<string, unknown>;
      if (typeof certificationKey !== 'string') {
        return NextResponse.json({ error: 'certificationKey must be a string' }, { status: 400 });
      }
      const updated = await certificationService.updateCertificationMeta(
        certificationKey,
        {
          newLabel: typeof newLabel === 'string' ? newLabel : undefined,
          newKey: typeof newKey === 'string' ? newKey : undefined,
          newProvider: newProvider === null ? null : typeof newProvider === 'string' ? newProvider : undefined,
        },
        session.user.id,
      );
      return NextResponse.json({ message: 'Certification updated successfully', certification: updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'Missing topicId or certificationKey' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to update:', err);
    return NextResponse.json({ error: err, message: err.message || 'Failed to update' }, { status: err.status || 500 });
  }
}
