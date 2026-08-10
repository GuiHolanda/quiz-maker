import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';
import type { SearchResultItem } from '@/shared/types';

export class SearchService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma as unknown as PrismaClient) {
    this.prisma = prismaClient;
  }

  async search(userId: string, query: string, limit: number): Promise<SearchResultItem[]> {
    const isSQLite = (process.env.DATABASE_URL ?? '').startsWith('file:');
    const contains = isSQLite ? { contains: query } : { contains: query, mode: 'insensitive' as const };

    const [certifications, publicExams, topics, questions, mockExams] = await Promise.all([
      this.prisma.exam.findMany({
        where: { userId, name: contains, type: 'certification' },
        select: { id: true, name: true, type: true },
        take: limit,
      }),
      this.prisma.exam.findMany({
        where: { userId, name: contains, type: 'public_exam' },
        select: { id: true, name: true, type: true },
        take: limit,
      }),
      this.prisma.examTopic.findMany({
        where: {
          name: contains,
          section: { exam: { userId } },
        },
        select: { id: true, name: true, section: { select: { exam: { select: { name: true } } } } },
        take: limit,
      }),
      this.prisma.examQuestion.findMany({
        where: { userId, text: contains },
        select: { id: true, text: true },
        take: limit,
      }),
      this.prisma.mockExam.findMany({
        where: {
          userId,
          OR: [
            { name: contains },
            { exam: { name: contains } },
          ],
        },
        select: { id: true, name: true, exam: { select: { name: true } } },
        take: limit,
      }),
    ]);

    const results: SearchResultItem[] = [];

    for (const exam of certifications) {
      results.push({ id: exam.id, label: exam.name, href: '/exams?type=certification', type: 'certification' });
    }

    for (const exam of publicExams) {
      results.push({ id: exam.id, label: exam.name, href: '/exams?type=public_exam', type: 'publicExam' });
    }

    for (const topic of topics) {
      results.push({
        id: topic.id,
        label: topic.name,
        subtitle: topic.section.exam.name,
        href: `/question-bank?topic=${encodeURIComponent(topic.name)}`,
        type: 'topic',
      });
    }

    for (const q of questions) {
      const words = q.text.split(/\s+/);
      const truncated = words.slice(0, 10).join(' ');
      const label = words.length > 10 ? `${truncated}...` : truncated;
      const searchParam = encodeURIComponent(truncated).replace(/%20/g, '+');
      results.push({
        id: String(q.id),
        label,
        href: `/question-bank?search=${searchParam}`,
        type: 'question',
      });
    }

    for (const mock of mockExams) {
      results.push({
        id: String(mock.id),
        label: mock.name ?? `Simulado #${mock.id}`,
        subtitle: mock.exam.name,
        href: '/simulados',
        type: 'simulado',
      });
    }

    return results;
  }
}
