import { prisma, PrismaService } from '@/lib/prisma';
import { Certification } from '@/types';

export class CertificationService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public validate(body: unknown): Certification {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { label, key, topics } = body as Record<string, unknown>;

    if (!label || typeof label !== 'string') {
      throw new Error('Certification label is required');
    }

    if (!key || typeof key !== 'string') {
      throw new Error('Certification key is required');
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('At least one topic is required');
    }

    for (const topic of topics) {
      if (!topic.name || typeof topic.name !== 'string') {
        throw new Error('Each topic must have a valid name');
      }
      if (typeof topic.minQuestions !== 'number' || typeof topic.maxQuestions !== 'number') {
        throw new TypeError('Each topic must have valid minQuestions and maxQuestions');
      }
    }

    return { label: label.trim(), key: key.trim(), topics };
  }

  public async save(certification: Certification) {
    const { label, key, topics } = certification;

    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.certification.findUnique({ where: { key } });

      if (existing) {
        throw Object.assign(new Error(`Certification with key "${key}" already exists`), { status: 409 });
      }

      const created = await tx.certification.create({
        data: {
          label,
          key,
          topics: {
            create: topics.map((topic) => ({
              name: topic.name,
              minQuestions: topic.minQuestions,
              maxQuestions: topic.maxQuestions,
            })),
          },
        },
        include: { topics: true },
      });

      return created;
    });
  }
}
