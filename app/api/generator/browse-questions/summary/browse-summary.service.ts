import { prisma } from '@/lib/prisma';
import { BrowseSummary } from '@/shared/types';

export class BrowseSummaryService {
  async getSummary(userId: string): Promise<BrowseSummary> {
    const rows = await prisma.question.groupBy({
      by: ['certificationTitle', 'topic'],
      where: { userId },
      _count: { id: true },
      orderBy: { certificationTitle: 'asc' },
    });

    const certMap = new Map<string, { totalCount: number; topics: Map<string, number> }>();
    for (const row of rows) {
      const cert = certMap.get(row.certificationTitle) ?? { totalCount: 0, topics: new Map() };
      const count = row._count.id;
      cert.totalCount += count;
      cert.topics.set(row.topic, count);
      certMap.set(row.certificationTitle, cert);
    }

    const certLabels = await prisma.certification.findMany({
      where: { userId },
      select: { key: true, label: true },
    });
    const labelToKey = new Map(certLabels.map((c) => [c.label, c.key]));

    const certifications = Array.from(certMap.entries()).map(([label, data]) => ({
      label,
      key: labelToKey.get(label) ?? label,
      totalCount: data.totalCount,
      topics: Array.from(data.topics.entries()).map(([name, questionCount]) => ({
        name,
        questionCount,
      })),
    }));

    return { certifications };
  }
}
