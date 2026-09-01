import { detectQuestionLanguage } from '@/lib/detect-question-language';

describe('detectQuestionLanguage', () => {
  it('detects a plain Portuguese question', () => {
    const text =
      'Qual das alternativas descreve corretamente a função de um balanceador de carga quando as instâncias estão em zonas de disponibilidade diferentes? Considere que a aplicação não pode ficar indisponível.';

    expect(detectQuestionLanguage(text)).toBe('pt');
  });

  it('detects a plain English question', () => {
    const text =
      'Which of the following statements best describes the behaviour of a load balancer when the target instances are spread across multiple availability zones and one zone becomes unavailable?';

    expect(detectQuestionLanguage(text)).toBe('en');
  });

  it('detects Portuguese even without accented characters', () => {
    const text =
      'Assinale a alternativa que apresenta a principal vantagem de usar uma fila de mensagens para desacoplar dois servicos que processam dados em ritmos diferentes.';

    expect(detectQuestionLanguage(text)).toBe('pt');
  });

  it('returns unknown for text that is too short to judge', () => {
    expect(detectQuestionLanguage('Deploy the model')).toBe('unknown');
    expect(detectQuestionLanguage('')).toBe('unknown');
  });

  it('returns unknown for a keyword-only fragment with no function words', () => {
    expect(detectQuestionLanguage('kubernetes pod replica set node cluster scheduler kubelet')).toBe('unknown');
  });

  it('flags an English question when Portuguese was requested (dropped by the caller)', () => {
    const enText =
      'A company wants to reduce the latency of its inference endpoint. Which change to the deployment configuration is the most effective for this goal?';

    expect(detectQuestionLanguage(enText)).toBe('en');
  });

  it('flags a Portuguese question when English was requested (dropped by the caller)', () => {
    const ptText =
      'Uma empresa deseja reduzir a latência do seu endpoint de inferência. Qual alteração na configuração de implantação é a mais eficaz para esse objetivo?';

    expect(detectQuestionLanguage(ptText)).toBe('pt');
  });
});
