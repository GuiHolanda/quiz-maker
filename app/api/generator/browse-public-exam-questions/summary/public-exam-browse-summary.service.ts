import { prisma } from '@/lib/prisma';
import { PublicExamBrowseSummary } from '@/shared/types';

export class PublicExamBrowseSummaryService {
  async getSummary(userId: string): Promise<PublicExamBrowseSummary> {
    const rows = await prisma.publicExamQuestion.groupBy({
      by: ['publicExamName', 'examBoardName', 'subject'],
      where: { userId },
      _count: { id: true },
      orderBy: { publicExamName: 'asc' },
    });

    type ExamData = { id: string; examBoardName: string; totalCount: number; subjects: Map<string, number> };
    const examMap = new Map<string, ExamData>();
    for (const row of rows) {
      const exam = examMap.get(row.publicExamName) ?? {
        id: row.publicExamName,
        examBoardName: row.examBoardName,
        totalCount: 0,
        subjects: new Map(),
      };
      const count = row._count.id;
      exam.totalCount += count;
      exam.subjects.set(row.subject, count);
      examMap.set(row.publicExamName, exam);
    }

    // Use the actual public-exam id when available (one is registered for the user).
    const examRecords = await prisma.publicExam.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const nameToId = new Map(examRecords.map((e) => [e.name, e.id]));

    const publicExams = Array.from(examMap.entries()).map(([name, data]) => ({
      id: nameToId.get(name) ?? name,
      name,
      examBoardName: data.examBoardName,
      totalCount: data.totalCount,
      subjects: Array.from(data.subjects.entries()).map(([subjectName, questionCount]) => ({
        name: subjectName,
        questionCount,
      })),
    }));

    return { publicExams };
  }
}
