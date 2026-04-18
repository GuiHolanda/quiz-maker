import { NextRequest, NextResponse } from 'next/server';
import { CertificationService } from './certification.service';

const certificationService = new CertificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const certification = certificationService.validate(body);
    const created = await certificationService.save(certification);

    return NextResponse.json(
      { message: 'Certification saved successfully', certification: created },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Failed to save certification:', err);

    const status = err.status || 500;
    const message = err.message || 'Failed to save certification';

    return NextResponse.json({ error: err, message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const payload = certificationService.validateTopicUpdate(body);
    const updated = await certificationService.updateTopic(payload);

    return NextResponse.json(
      { message: 'Topic updated successfully', topic: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Failed to update topic:', err);

    const status = err.status || 500;
    const message = err.message || 'Failed to update topic';

    return NextResponse.json({ error: err, message }, { status });
  }
}
