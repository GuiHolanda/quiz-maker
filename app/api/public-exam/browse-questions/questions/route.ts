import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PublicExamBrowseQuestionsService } from '@/features/services/browse.service';

const service = new PublicExamBrowseQuestionsService();

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const publicExamName = searchParams.get('publicExamName')?.trim();
  const subject = searchParams.get('subject')?.trim();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

  if (!publicExamName || !subject) {
    return NextResponse.json(
      { message: 'publicExamName and subject are required' },
      { status: 400 },
    );
  }
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return NextResponse.json(
      { message: 'page and pageSize must be positive integers' },
      { status: 400 },
    );
  }

  try {
    const result = await service.getQuestions({
      publicExamName,
      subject,
      page,
      pageSize,
      userId: session.user.id,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('public-exam browse-questions GET error:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to load questions' },
      { status: err.status || 500 },
    );
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
    return NextResponse.json(
      { message: 'id is required and must be a number' },
      { status: 400 },
    );
  }

  try {
    await service.deleteQuestion(id, session.user.id);
    return NextResponse.json({ message: 'Question deleted' }, { status: 200 });
  } catch (err: any) {
    console.error('public-exam browse-questions DELETE error:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to delete question' },
      { status: err.status || 500 },
    );
  }
}
