import { prisma, PrismaService } from '@/lib/prisma';
import { CertificationTopic } from '@/types';
import { parseNumber } from '@/utils';

export class QuizGeneratorService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public parseParams(url: URL): { certificationTitle: string; numQuestions: number } | { error: string } {
    const params = url.searchParams;
    const certificationTitle = params.get('certificationTitle')?.trim();
    if (!certificationTitle) return { error: 'certificationTitle is required' };

    const numQuestions = parseNumber(params.get('numQuestions'), null);
    if (numQuestions === null || !Number.isInteger(numQuestions) || numQuestions <= 0) {
      return { error: 'numQuestions must be an integer > 0' };
    }

    return { certificationTitle, numQuestions };
  }

  public distributeQuestions(topics: CertificationTopic[], total: number): Map<string, number> {
    if (total <= 0) throw new Error('numQuestions must be > 0');
    if (topics.length === 0) throw new Error('Certification has no topics');

    const allocation = new Map<string, number>();
    const mins = new Map<string, number>();
    const maxs = new Map<string, number>();

    for (const t of topics) {
      const minCount = Math.floor(t.minQuestions * total);
      const maxCount = Math.ceil(t.maxQuestions * total);
      mins.set(t.name, minCount);
      maxs.set(t.name, maxCount);
      allocation.set(t.name, minCount);
    }

    let remaining = total - Array.from(allocation.values()).reduce((a, b) => a + b, 0);
    const sorted = [...topics].sort((a, b) => (maxs.get(b.name) ?? 0) - (maxs.get(a.name) ?? 0));

    for (const t of sorted) {
      if (remaining <= 0) break;
      const current = allocation.get(t.name) ?? 0;
      const canAdd = (maxs.get(t.name) ?? 0) - current;
      const add = Math.min(canAdd, remaining);
      allocation.set(t.name, current + add);
      remaining -= add;
    }

    // overflow bucket: if percentages don't sum to 1, add excess to highest-weight topic
    if (remaining > 0 && sorted.length > 0) {
      const top = sorted[0].name;
      allocation.set(top, (allocation.get(top) ?? 0) + remaining);
    }

    for (const [name, count] of Array.from(allocation.entries())) {
      if (count === 0) allocation.delete(name);
    }

    return allocation;
  }

  async fetchStoredQuestions(certificationTitle: string, topics: string[], limit = 10, userId?: string) {
    if (!limit || limit <= 0) return [];
    const where: Record<string, unknown> = { certificationTitle };
    if (topics && topics.length > 0) {
      Object.assign(where, { topic: { in: topics } });
    }
    if (userId) {
      Object.assign(where, { userId });
    }

    const rows = await this.prismaService.question.findMany({
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
      certificationTitle: q.certificationTitle,
      text: q.text,
      correctCount: q.correctCount,
      topic: q.topic,
      difficulty: q.difficulty,
      topicSubarea: q.topicSubarea ?? undefined,
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
