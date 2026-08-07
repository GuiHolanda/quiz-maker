import { prismaMock } from '../__mocks__/prisma';
import { SearchService } from '@/app/api/search/search.service';

describe('SearchService', () => {
  const service = new SearchService(prismaMock as any);
  const userId = 'user-1';

  function mockExams(certRows: any[] = [], pubRows: any[] = []) {
    prismaMock.exam.findMany
      .mockResolvedValueOnce(certRows)
      .mockResolvedValueOnce(pubRows);
  }

  it('retorna array vazio quando não há resultados', async () => {
    mockExams([], []);
    prismaMock.examTopic.findMany.mockResolvedValue([]);
    prismaMock.examQuestion.findMany.mockResolvedValue([]);
    prismaMock.mockExam.findMany.mockResolvedValue([]);

    const results = await service.search(userId, 'xyz', 3);

    expect(results).toEqual([]);
  });

  it('mapeia certificação e publicExam com href correto', async () => {
    mockExams(
      [{ id: 'e1', name: 'AWS CCP', type: 'certification' }],
      [{ id: 'e2', name: 'OAB', type: 'public_exam' }],
    );
    prismaMock.examTopic.findMany.mockResolvedValue([]);
    prismaMock.examQuestion.findMany.mockResolvedValue([]);
    prismaMock.mockExam.findMany.mockResolvedValue([]);

    const results = await service.search(userId, 'aws', 3);

    const cert = results.find((r) => r.type === 'certification');
    expect(cert).toMatchObject({
      id: 'e1',
      label: 'AWS CCP',
      href: '/exams?type=certification',
      type: 'certification',
    });

    const pub = results.find((r) => r.type === 'publicExam');
    expect(pub).toMatchObject({
      id: 'e2',
      label: 'OAB',
      href: '/exams?type=public_exam',
      type: 'publicExam',
    });
  });

  it('mapeia tópico com subtitle do exam pai', async () => {
    mockExams([], []);
    prismaMock.examTopic.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Redes',
        section: { exam: { name: 'CCNA' } },
      } as any,
    ]);
    prismaMock.examQuestion.findMany.mockResolvedValue([]);
    prismaMock.mockExam.findMany.mockResolvedValue([]);

    const results = await service.search(userId, 'rede', 3);

    expect(results).toContainEqual({
      id: 't1',
      label: 'Redes',
      subtitle: 'CCNA',
      href: '/question-bank?topic=Redes',
      type: 'topic',
    });
  });

  it('mapeia questão com label truncado em 10 palavras', async () => {
    const longText = 'uma duas tres quatro cinco seis sete oito nove dez onze doze';
    mockExams([], []);
    prismaMock.examTopic.findMany.mockResolvedValue([]);
    prismaMock.examQuestion.findMany.mockResolvedValue([
      { id: 1, text: longText } as any,
    ]);
    prismaMock.mockExam.findMany.mockResolvedValue([]);

    const results = await service.search(userId, 'uma', 3);

    const q = results.find((r) => r.type === 'question');
    expect(q?.label).toBe('uma duas tres quatro cinco seis sete oito nove dez...');
    expect(q?.href).toBe('/question-bank?search=uma+duas+tres+quatro+cinco+seis+sete+oito+nove+dez');
  });

  it('mapeia simulado com name e subtitle do exam pai', async () => {
    mockExams([], []);
    prismaMock.examTopic.findMany.mockResolvedValue([]);
    prismaMock.examQuestion.findMany.mockResolvedValue([]);
    prismaMock.mockExam.findMany.mockResolvedValue([
      { id: 10, name: 'Simulado 1', exam: { name: 'AWS CCP' } } as any,
    ]);

    const results = await service.search(userId, 'sim', 3);

    expect(results).toContainEqual({
      id: '10',
      label: 'Simulado 1',
      subtitle: 'AWS CCP',
      href: '/simulados',
      type: 'simulado',
    });
  });

  it('usa fallback "Simulado #id" quando MockExam.name é null', async () => {
    mockExams([], []);
    prismaMock.examTopic.findMany.mockResolvedValue([]);
    prismaMock.examQuestion.findMany.mockResolvedValue([]);
    prismaMock.mockExam.findMany.mockResolvedValue([
      { id: 7, name: null, exam: { name: 'Azure' } } as any,
    ]);

    const results = await service.search(userId, 'azu', 3);

    const simulado = results.find((r) => r.type === 'simulado');
    expect(simulado?.label).toBe('Simulado #7');
  });
});
