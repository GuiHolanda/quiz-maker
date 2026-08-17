import { NextRequest, NextResponse } from 'next/server';

import { DemoCatalogService } from '@/features/services/demo-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';

const demoCatalogService = new DemoCatalogService();

function parseAlloc(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw Object.assign(new Error('alloc é obrigatório'), { status: 400 });
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const invalid = entries.find(([, count]) => typeof count !== 'number' || !Number.isInteger(count) || count < 0);

  if (invalid) {
    throw Object.assign(new Error(`Distribuição inválida para "${invalid[0]}"`), { status: 400 });
  }

  return Object.fromEntries(entries) as Record<string, number>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const examId = (body as { examId?: unknown } | null)?.examId;

    if (typeof examId !== 'string' || examId.trim().length === 0) {
      return NextResponse.json({ message: 'examId é obrigatório' }, { status: 400 });
    }

    const alloc = parseAlloc((body as { alloc?: unknown }).alloc);
    const questions = await demoCatalogService.buildQuiz(examId, alloc);

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    console.error('Failed to build demo quiz:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
