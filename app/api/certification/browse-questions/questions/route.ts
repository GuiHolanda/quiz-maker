import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { BrowseQuestionsService } from '@/features/services/browse.service';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new BrowseQuestionsService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const certificationTitle = searchParams.get('certificationTitle')?.trim();
  const topic = searchParams.get('topic')?.trim();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

  if (!certificationTitle || !topic) {
    return NextResponse.json({ message: 'certificationTitle and topic are required' }, { status: 400 });
  }
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return NextResponse.json({ message: 'page and pageSize must be positive integers' }, { status: 400 });
  }

  try {
    const result = await service.getQuestions({
      certificationTitle,
      topic,
      page,
      pageSize,
      userId: session.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error('browse-questions GET error:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id') ?? '', 10);

  if (isNaN(id)) {
    return NextResponse.json({ message: 'id is required and must be a number' }, { status: 400 });
  }

  try {
    await service.deleteQuestion(id, session.user.id);

    return NextResponse.json({ message: 'Question deleted' }, { status: 200 });
  } catch (err: unknown) {
    console.error('browse-questions DELETE error:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
