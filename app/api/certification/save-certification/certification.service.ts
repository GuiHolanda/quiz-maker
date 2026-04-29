import { prisma, PrismaService } from '@/lib/prisma';
import { Certification, TopicUpdatePayload } from '@/shared/types';

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

  public async save(certification: Certification, userId: string) {
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
          userId,
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

  public validateTopicUpdate(body: unknown): TopicUpdatePayload {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { certificationKey, topicName, minQuestions, maxQuestions } = body as Record<string, unknown>;

    if (!certificationKey || typeof certificationKey !== 'string') {
      throw new Error('certificationKey is required');
    }
    if (!topicName || typeof topicName !== 'string') {
      throw new Error('topicName is required');
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      throw new TypeError('minQuestions and maxQuestions must be numbers');
    }

    return { certificationKey, topicName, minQuestions, maxQuestions };
  }

  public async updateTopic(payload: TopicUpdatePayload, userId: string) {
    const { certificationKey, topicName, minQuestions, maxQuestions } = payload;

    const certification = await this.prismaService.certification.findUnique({
      where: { key: certificationKey },
    });

    if (!certification) {
      throw Object.assign(new Error(`Certification "${certificationKey}" not found`), { status: 404 });
    }

    if (certification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const topic = await this.prismaService.certificationTopic.findUnique({
      where: { certificationId_name: { certificationId: certification.id, name: topicName } },
    });

    if (!topic) {
      throw Object.assign(new Error(`Topic "${topicName}" not found`), { status: 404 });
    }

    return this.prismaService.certificationTopic.update({
      where: { id: topic.id },
      data: { minQuestions, maxQuestions },
    });
  }
}
