import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoQuizService } from '@/features/services/demo-quiz.service';
import type { DemoQuizPromptInput } from '@/config/prompts/demo-quiz.prompt';

const { mockCall } = vi.hoisted(() => ({ mockCall: vi.fn() }));
vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = mockCall;
  },
}));

const validInput: DemoQuizPromptInput = {
  examName: 'CEA',
  examType: 'certification',
  topics: ['Renda Fixa', 'Derivativos', 'Fundos de Investimento'],
  count: 3,
};

const validApiResponse = {
  text: JSON.stringify({
    questions: [
      {
        text: 'Uma debênture é um título de crédito emitido por qual tipo de entidade?',
        options: ['Governo Federal', 'Sociedade por Ações', 'Pessoa Física', 'Banco Central'],
        correctIndex: 1,
        topic: 'Renda Fixa',
        explanation: 'Debêntures são emitidas exclusivamente por sociedades por ações.',
      },
      {
        text: 'O que é um swap cambial?',
        options: ['Troca de fluxos de câmbio por taxa de juros', 'Venda de moeda estrangeira', 'Compra de ações no exterior', 'Depósito em conta corrente'],
        correctIndex: 0,
        topic: 'Derivativos',
        explanation: 'Um swap cambial é um contrato de troca de fluxos financeiros.',
      },
      {
        text: 'Qual é a principal vantagem de um fundo multimercado?',
        options: ['Garantia do FGC', 'Diversificação em múltiplas classes de ativos', 'Rendimento prefixado', 'Exclusividade para pessoas jurídicas'],
        correctIndex: 1,
        topic: 'Fundos de Investimento',
        explanation: 'Fundos multimercado podem investir em diversas classes de ativos.',
      },
    ],
  }),
  inputTokens: 200,
  outputTokens: 400,
};

describe('DemoQuizService', () => {
  let service: DemoQuizService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DemoQuizService();
  });

  it('returns parsed DemoQuestion array on valid response', async () => {
    mockCall.mockResolvedValue(validApiResponse);
    const result = await service.generate(validInput);
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Uma debênture é um título de crédito emitido por qual tipo de entidade?');
    expect(result[0].options).toHaveLength(4);
    expect(result[0].correctIndex).toBe(1);
    expect(result[0].topic).toBe('Renda Fixa');
    expect(result[0].explanation).toBeTruthy();
  });

  it('throws when response JSON is malformed', async () => {
    mockCall.mockResolvedValue({ text: 'not json', inputTokens: 0, outputTokens: 0 });
    await expect(service.generate(validInput)).rejects.toThrow('Failed to parse demo quiz response');
  });

  it('throws when questions array is missing', async () => {
    mockCall.mockResolvedValue({ text: JSON.stringify({ other: 'data' }), inputTokens: 0, outputTokens: 0 });
    await expect(service.generate(validInput)).rejects.toThrow('Failed to parse demo quiz response');
  });

  it('filters out questions with invalid structure', async () => {
    const responseWithInvalid = {
      text: JSON.stringify({
        questions: [
          { text: '', options: ['A', 'B', 'C', 'D'], correctIndex: 0, topic: 'Renda Fixa', explanation: 'x' },
          { text: 'Valid question?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, topic: 'Renda Fixa', explanation: 'x' },
        ],
      }),
      inputTokens: 0,
      outputTokens: 0,
    };
    mockCall.mockResolvedValue(responseWithInvalid);
    const result = await service.generate(validInput);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Valid question?');
  });

  it('returns empty array when all questions are invalid', async () => {
    mockCall.mockResolvedValue({
      text: JSON.stringify({ questions: [{ text: '', options: ['A'], correctIndex: 0, topic: 'x', explanation: 'y' }] }),
      inputTokens: 0,
      outputTokens: 0,
    });
    const result = await service.generate(validInput);
    expect(result).toHaveLength(0);
  });
});
