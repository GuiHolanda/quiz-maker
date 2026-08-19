import { Prisma } from '@prisma/client';

interface ApiErrorResponse {
  readonly error: string;
  readonly message?: string;
  readonly status: number;
  // Structured detail forwarded from a service error's `body` (see QuotaService.quotaError).
  // Only quota counters and the plan name — the user's own numbers, never internals — so
  // the client can name the exact limit and offer the right upgrade CTA.
  readonly code?: string;
  readonly limit?: number;
  readonly used?: number;
  readonly plan?: string;
}

interface QuotaErrorBody {
  readonly code?: unknown;
  readonly limit?: unknown;
  readonly used?: unknown;
  readonly plan?: unknown;
}

function quotaDetail(err: Error): Partial<ApiErrorResponse> {
  const body = (err as Error & { body?: QuotaErrorBody }).body;

  if (!body || typeof body.code !== 'string') return {};

  return {
    code: body.code,
    ...(typeof body.limit === 'number' && { limit: body.limit }),
    ...(typeof body.used === 'number' && { used: body.used }),
    ...(typeof body.plan === 'string' && { plan: body.plan }),
  };
}

export function toApiErrorResponse(err: unknown): ApiErrorResponse {
  // Business-logic errors thrown by service layer (Object.assign(new Error, { status }))
  if (err instanceof Error && 'status' in err) {
    const status = (err as Error & { status: number }).status;
    return { error: err.message, message: err.message, status, ...quotaDetail(err) };
  }

  // Prisma validation error — unknown field, wrong type, missing required field
  if (err instanceof Prisma.PrismaClientValidationError) {
    return { error: 'Database validation error', status: 500 };
  }

  // Prisma known request error — P2002 unique constraint, P2025 record not found, etc.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return { error: 'Unique constraint violation', status: 409 };
    }
    return { error: 'Database error', status: 500 };
  }

  // Any other unexpected error — surface message for server logs but no user-facing message
  if (err instanceof Error) {
    return { error: err.message, status: 500 };
  }

  return { error: 'Internal server error', status: 500 };
}
