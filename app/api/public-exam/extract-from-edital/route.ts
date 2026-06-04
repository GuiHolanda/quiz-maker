import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { EditalExtractorService } from '@/features/services/edital-extractor.service';

const editalExtractorService = new EditalExtractorService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    const publicExam = await editalExtractorService.extract(
      file,
      typeof role === 'string' && role.trim() ? role.trim() : undefined,
    );

    return NextResponse.json({ publicExam }, { status: 200 });
  } catch (err: any) {
    console.error('Failed to extract edital:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to extract edital' },
      { status: err.status || 500 },
    );
  }
}
