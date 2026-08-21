import { randomBytes } from 'crypto';

// Excludes 0/O/1/I so a code read aloud or typed from a screenshot isn't ambiguous.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }

  return code;
}

const MAX_GENERATION_ATTEMPTS = 5;

// 8 chars from a 33-char alphabet is ~1.7e12 combinations — a real collision at any
// realistic user count is effectively impossible, but the unique constraint makes it a
// genuine (if rare) failure mode, so this retries instead of surfacing an opaque 500.
// Shared by RegisterService (new signup) and ReferralService (lazy backfill for a user
// who signed up before this field existed).
export async function generateUniqueReferralCode(isTaken: (code: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateReferralCode();

    if (!(await isTaken(candidate))) return candidate;
  }

  throw Object.assign(new Error('Failed to generate a unique referral code'), { status: 500 });
}
