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
