import { prisma, PrismaService } from '@/lib/prisma';
import { Certification, TopicUpdatePayload } from '@/shared/types';

export class CertificationService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public validate(body: unknown): Certification {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }

    const { label, key, provider, topics } = body as Record<string, unknown>;

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

    return {
      label: label.trim(),
      key: key.trim(),
      provider: typeof provider === 'string' && provider.trim() ? provider.trim() : undefined,
      topics,
    };
  }

  public async save(certification: Certification, userId: string) {
    const { label, key, provider, topics } = certification;

    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.certification.findUnique({ where: { key } });

      if (existing) {
        throw Object.assign(new Error(`Certification with key "${key}" already exists`), { status: 409 });
      }

      const created = await tx.certification.create({
        data: {
          label,
          key,
          provider: provider ?? null,
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

    const { topicId, newName, minQuestions, maxQuestions } = body as Record<string, unknown>;

    if (!topicId || typeof topicId !== 'string') {
      throw new Error('topicId is required');
    }
    if (newName !== undefined && typeof newName !== 'string') {
      throw new TypeError('newName must be a string');
    }
    if (typeof minQuestions !== 'number' || typeof maxQuestions !== 'number') {
      throw new TypeError('minQuestions and maxQuestions must be numbers');
    }

    return { topicId, newName: typeof newName === 'string' ? newName : undefined, minQuestions, maxQuestions };
  }

  public async updateTopic(payload: TopicUpdatePayload, userId: string) {
    const { topicId, newName, minQuestions, maxQuestions } = payload;

    const topic = await this.prismaService.certificationTopic.findUnique({
      where: { id: topicId },
      include: { certification: true },
    });

    if (!topic) {
      throw Object.assign(new Error(`Topic not found`), { status: 404 });
    }

    if (topic.certification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    return this.prismaService.certificationTopic.update({
      where: { id: topicId },
      data: {
        ...(newName !== undefined && { name: newName }),
        minQuestions,
        maxQuestions,
      },
    });
  }

  public async deleteTopic(topicId: string, userId: string) {
    const topic = await this.prismaService.certificationTopic.findUnique({
      where: { id: topicId },
      include: { certification: true },
    });

    if (!topic) {
      throw Object.assign(new Error('Topic not found'), { status: 404 });
    }

    if (topic.certification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    await this.prismaService.certificationTopic.delete({ where: { id: topicId } });
  }

  public async addTopic(
    certificationKey: string,
    name: string,
    minQuestions: number,
    maxQuestions: number,
    userId: string,
  ) {
    const certification = await this.prismaService.certification.findUnique({
      where: { key: certificationKey },
    });

    if (!certification) {
      throw Object.assign(new Error(`Certification "${certificationKey}" not found`), { status: 404 });
    }

    if (certification.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    const existing = await this.prismaService.certificationTopic.findUnique({
      where: { certificationId_name: { certificationId: certification.id, name } },
    });

    if (existing) {
      throw Object.assign(new Error(`Topic "${name}" already exists`), { status: 409 });
    }

    return this.prismaService.certificationTopic.create({
      data: { name, minQuestions, maxQuestions, certificationId: certification.id },
    });
  }

  public async updateCertificationMeta(
    certKey: string,
    updates: { newLabel?: string; newKey?: string; newProvider?: string | null },
    userId: string,
  ) {
    const cert = await this.prismaService.certification.findUnique({ where: { key: certKey } });

    if (!cert) {
      throw Object.assign(new Error('Certification not found'), { status: 404 });
    }

    if (cert.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    if (updates.newKey && updates.newKey !== certKey) {
      const conflict = await this.prismaService.certification.findUnique({ where: { key: updates.newKey } });
      if (conflict) {
        throw Object.assign(new Error(`Certification with key "${updates.newKey}" already exists`), { status: 409 });
      }
    }

    return this.prismaService.certification.update({
      where: { key: certKey },
      data: {
        ...(updates.newLabel !== undefined && { label: updates.newLabel }),
        ...(updates.newKey !== undefined && { key: updates.newKey }),
        ...(updates.newProvider !== undefined && { provider: updates.newProvider }),
      },
      include: { topics: true },
    });
  }
}
