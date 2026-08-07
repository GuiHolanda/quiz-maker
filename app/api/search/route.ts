import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SearchService } from './search.service';
import { toApiErrorResponse } from '@/lib/api-error';

const service = new SearchService();

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const limitRaw = parseInt(searchParams.get('limit') ?? '3', 10);
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 3 : Math.min(limitRaw, 10);

  if (q.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  try {
    const results = await service.search(session.user.id, q, limit);
    return NextResponse.json({ results }, { status: 200 });
  } catch (err: unknown) {
    console.error('search GET error:', err);
    return NextResponse.json(toApiErrorResponse(err), { status: toApiErrorResponse(err).status });
  }
}
