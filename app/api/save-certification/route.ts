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
