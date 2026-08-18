import { NextRequest, NextResponse } from 'next/server';

import { DemoCatalogService } from '@/features/services/demo-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';

const demoCatalogService = new DemoCatalogService();

// Bounds the work an unauthenticated caller can force before validation rejects the
// body. No exam has anything close to this many domains, so the cap only ever trips
// on a crafted payload.
const MAX_ALLOC_KEYS = 50;

function parseAlloc(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw Object.assign(new Error('alloc é obrigatório'), { status: 400 });
  }

  const entries = Object.entries(raw as Record<string, unknown>);

  if (entries.length > MAX_ALLOC_KEYS) {
    throw Object.assign(new Error('Distribuição inválida'), { status: 400 });
  }

  // The offending key is deliberately not echoed: it is attacker-controlled input on
  // an unauthenticated endpoint, and reflecting it turns the error into a mirror for
  // arbitrary payloads in responses and logs.
  const hasInvalidCount = entries.some(
    ([, count]) => typeof count !== 'number' || !Number.isInteger(count) || count < 0
  );

  if (hasInvalidCount) {
    throw Object.assign(new Error('Distribuição inválida'), { status: 400 });
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
