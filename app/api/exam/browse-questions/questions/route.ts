import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { BrowseQuestionsService } from '@/features/services/browse.service';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new BrowseQuestionsService();

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
