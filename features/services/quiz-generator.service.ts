import { prisma, PrismaService } from '@/lib/prisma';
import { ExamSection } from '@/shared/types';
import { parseNumber } from '@/shared/utils';

export class QuizGeneratorService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public parseParams(url: URL): { examName: string; numQuestions: number } | { error: string } {
    const params = url.searchParams;
    const examName = params.get('examName')?.trim();

    if (!examName) return { error: 'examName is required' };

    const numQuestions = parseNumber(params.get('numQuestions'), null);

    if (numQuestions === null || !Number.isInteger(numQuestions) || numQuestions <= 0) {
      return { error: 'numQuestions must be an integer > 0' };
    }

    return { examName, numQuestions };
  }

  public distributeQuestions(sections: ExamSection[], total: number): Map<string, number> {
    if (total <= 0) throw new Error('numQuestions must be > 0');
    if (sections.length === 0) throw new Error('Certification has no topics');

    const allocation = new Map<string, number>();
    const mins = new Map<string, number>();
    const maxs = new Map<string, number>();

    for (const s of sections) {
      const minCount = Math.floor((s.minQuestions / 100) * total);
      const maxCount = Math.ceil((s.maxQuestions / 100) * total);

      mins.set(s.name, minCount);
      maxs.set(s.name, maxCount);
      allocation.set(s.name, minCount);
    }

    let remaining = total - Array.from(allocation.values()).reduce((a, b) => a + b, 0);
    const sorted = [...sections].sort((a, b) => (maxs.get(b.name) ?? 0) - (maxs.get(a.name) ?? 0));

    for (const s of sorted) {
      if (remaining <= 0) break;
      const current = allocation.get(s.name) ?? 0;
      const canAdd = (maxs.get(s.name) ?? 0) - current;
      const add = Math.min(canAdd, remaining);

      allocation.set(s.name, current + add);
      remaining -= add;
    }

    // overflow bucket: if percentages don't sum to 1, add excess to highest-weight section
    if (remaining > 0 && sorted.length > 0) {
      const top = sorted[0].name;

      allocation.set(top, (allocation.get(top) ?? 0) + remaining);
    }

    for (const [name, count] of Array.from(allocation.entries())) {
      if (count === 0) allocation.delete(name);
    }

    return allocation;
  }

  async fetchStoredQuestions(examName: string, sections: string[], limit = 10, userId?: string) {
    if (!limit || limit <= 0) return [];
    const where: Record<string, unknown> = { examName };

    if (sections && sections.length > 0) {
      Object.assign(where, { sectionName: { in: sections } });
    }
    if (userId) {
      Object.assign(where, { userId });
    }

    const rows = await this.prismaService.examQuestion.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        options: true,
        answer: { include: { explanations: true } },
      },
    });

    return rows.map((q) => ({
      id: q.id,
      examName: q.examName,
      sectionName: q.sectionName,
      topic: q.topicName ?? undefined,
      text: q.text,
      correctCount: q.correctCount,
      difficulty: q.difficulty,
      options: q.options.reduce((acc: Record<string, string>, o) => {
        acc[o.label] = o.text;

        return acc;
      }, {}),
      answer: q.answer
        ? {
            questionId: q.id,
            correctOptions: q.answer.correctOptions as string[],
            explanations: (q.answer.explanations || []).reduce((a: Record<string, string>, ex) => {
              a[ex.label] = ex.text;

              return a;
            }, {}),
          }
        : { questionId: q.id, correctOptions: [], explanations: {} },
    }));
  }
}
