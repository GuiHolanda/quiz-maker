import { parseIdentifyResponse } from '@/lib/parse-identify-response';

// The examples below are lifted straight from config/prompts/ai-chat-identify.prompt.ts —
// the parser has to handle exactly what the prompt tells the model to produce, since a
// mismatch here would only ever surface as a silent fallback to "no match" in production.

describe('parseIdentifyResponse', () => {
  it('parses a single confident match', () => {
    const text =
      'Encontrei esta certificação: **AWS Certified Solutions Architect – Associate (SAA-C03)** — Amazon Web Services (AWS). É essa que você quer criar?';
    const result = parseIdentifyResponse(text);

    expect(result).toEqual({
      kind: 'single',
      match: { label: 'AWS Certified Solutions Architect – Associate (SAA-C03)', provider: 'Amazon Web Services (AWS)' },
    });
  });

  it('parses a short single match', () => {
    const text = '**Chartered Financial Analyst (CFA) Level 1** — CFA Institute. É essa certificação que você quer criar?';
    const result = parseIdentifyResponse(text);

    expect(result).toEqual({
      kind: 'single',
      match: { label: 'Chartered Financial Analyst (CFA) Level 1', provider: 'CFA Institute' },
    });
  });

  it('parses a numbered disambiguation list', () => {
    const text = `Encontrei algumas certificações Azure. Qual delas você gostaria de criar?

1. **Azure Fundamentals (AZ-900)** — Microsoft
2. **Azure Administrator Associate (AZ-104)** — Microsoft
3. **Azure Solutions Architect Expert (AZ-305)** — Microsoft`;
    const result = parseIdentifyResponse(text);

    expect(result).toEqual({
      kind: 'multiple',
      matches: [
        { label: 'Azure Fundamentals (AZ-900)', provider: 'Microsoft' },
        { label: 'Azure Administrator Associate (AZ-104)', provider: 'Microsoft' },
        { label: 'Azure Solutions Architect Expert (AZ-305)', provider: 'Microsoft' },
      ],
    });
  });

  it('falls back to "none" for a clarifying question with no bold match', () => {
    const text = 'Claro, Qual certificação você pretende configurar?';
    const result = parseIdentifyResponse(text);

    expect(result).toEqual({ kind: 'none', message: text });
  });

  it('falls back to "none" for an out-of-scope redirect', () => {
    const text = 'Posso ajudar com a criação de certificações e simulados para concursos. O que você gostaria de praticar?';
    const result = parseIdentifyResponse(text);

    expect(result.kind).toBe('none');
  });

  it('does not treat a bare bold phrase with no attached provider as a confident match', () => {
    // No "— Provider" suffix after the bold segment — falling back to "none" (raw text
    // shown as-is) is the safe choice here, not guessing at a match that isn't there.
    const text = 'Não encontrei nada parecido com **XYZ-999**. Pode confirmar o nome da certificação?';
    const result = parseIdentifyResponse(text);

    expect(result.kind).toBe('none');
  });
});
