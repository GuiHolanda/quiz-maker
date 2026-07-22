import { Prisma } from '@prisma/client';

interface ApiErrorResponse {
  readonly error: string;
  readonly message?: string;
  readonly status: number;
}

export function toApiErrorResponse(err: unknown): ApiErrorResponse {
  // Business-logic errors thrown by service layer (Object.assign(new Error, { status }))
  if (err instanceof Error && 'status' in err) {
    const status = (err as Error & { status: number }).status;
    return { error: err.message, message: err.message, status };
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
