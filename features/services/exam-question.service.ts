import { prisma, PrismaService } from '@/lib/prisma';
import { AIExamQuestion, Answer, ExamQuestionParams, ExamType } from '@/shared/types';
import { toSafeString, normalizeName, looseKey } from '@/shared/utils';

export function validateAiQuestions(obj: unknown): AIExamQuestion[] {
  if (!Array.isArray((obj as any)?.questions)) throw new Error('Invalid format: questions array is required');
  for (const q of (obj as any).questions) {
    if (!q || typeof q.text !== 'string') throw new Error('Invalid format: question text is required');
    if (!q.options || typeof q.options !== 'object') throw new Error('Invalid format: question options are required');
  }

  return (obj as any).questions;
}

export class ExamQuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public getQuestionParams(url: URL): ExamQuestionParams {
    const params = url.searchParams;
    const exam_name = params.get('exam_name')?.trim() || 'Exam';
    const reference_name = params.get('reference_name')?.trim() || '';
    const section_name = params.get('section_name')?.trim() || '';
    const topic_name = params.get('topic_name')?.trim() || undefined;
    const num_questions = params.get('num_questions')?.toString().trim() || '10';

    return { exam_name, reference_name, section_name, topic_name, num_questions };
  }

  public async createFromPayload(questions: AIExamQuestion[], userId: string, examId?: string) {
    return this.prismaService.$transaction(async (tx) => {
      const results: any[] = [];

      // Resolve the Exam for canonical section/topic lookup.
      // When examId is provided (preferred path), use it directly — unambiguous.
      // When not provided, fall back to looseKey name match as a best-effort.
      let exam:
        | (Awaited<ReturnType<typeof tx.exam.findFirst>> & {
            sections: { id: string; name: string; topics: { id: string; name: string }[] }[];
          })
        | null = null;

      if (examId) {
        exam = await tx.exam.findFirst({
          where: { id: examId, userId },
          include: { sections: { include: { topics: true } } },
        });
      } else {
        const rawExamName = questions[0]?.examName ?? '';
        if (rawExamName) {
          const all = await tx.exam.findMany({
            where: { userId },
            include: { sections: { include: { topics: true } } },
          });
          exam = all.find((e) => looseKey(e.name) === looseKey(rawExamName)) ?? null;
        }
      }

      type Canonical = { id: string; name: string };
      const sectionCanonical = new Map<string, Canonical>();
      const topicCanonical = new Map<string, Canonical>();

      if (exam) {
        for (const s of exam.sections) {
          sectionCanonical.set(looseKey(s.name), { id: s.id, name: s.name });
          for (const t of s.topics) {
            topicCanonical.set(`${looseKey(s.name)}::${looseKey(t.name)}`, { id: t.id, name: t.name });
          }
        }
      }

      for (const question of questions) {
        const { examName: qExamName, sectionName, topic, text, correctCount, options, difficulty } = question;

        const incomingSection = normalizeName(sectionName ?? '');
        const matchedSection = sectionCanonical.get(looseKey(incomingSection));
        const canonicalSectionName = matchedSection?.name ?? incomingSection;
        const sectionId = matchedSection?.id ?? null;

        const incomingTopic = topic ? normalizeName(topic) : null;
        const matchedTopic =
          incomingTopic != null
            ? topicCanonical.get(`${looseKey(canonicalSectionName)}::${looseKey(incomingTopic)}`)
            : undefined;
        const canonicalTopicName = matchedTopic?.name ?? incomingTopic;
        const topicId = matchedTopic?.id ?? null;

        const createdQuestion = await tx.examQuestion.create({
          data: {
            examName: normalizeName(qExamName ?? ''),
            sectionName: canonicalSectionName,
            topicName: canonicalTopicName,
            text,
            correctCount,
            difficulty,
            userId,
            examId: exam?.id ?? null,
            sectionId,
            topicId,
          },
        });

        const optionsObj: Record<string, string> = {};

        for (const [label, txt] of Object.entries(options)) {
          const textVal = toSafeString(txt);

          await tx.examOption.create({ data: { questionId: createdQuestion.id, label, text: textVal } });
          optionsObj[label] = textVal;
        }

        results.push({ question: createdQuestion, options: optionsObj });
      }

      return results;
    });
  }

  public async saveAnswers(answers: Answer[]) {
    return this.prismaService.$transaction(async (tx) => {
      for (const answer of answers) {
        if (!Array.isArray(answer.correctOptions) || answer.correctOptions.length === 0) continue;
        // Upsert with empty update keeps first-writer-wins: never overwrites an
        // existing Answer (which would invalidate cached Explanations and could
        // regrade in-flight tentativas). Idempotent across concurrent
        // ensureAnswers invocations and React StrictMode double-renders.
        await tx.examAnswer.upsert({
          where: { questionId: answer.questionId },
          create: { questionId: answer.questionId, correctOptions: answer.correctOptions },
          update: {},
        });
      }
    });
  }

  public async saveExplanations(answerId: number, explanations: Record<string, string>) {
    await this.prismaService.examExplanation.createMany({
      data: Object.entries(explanations).map(([label, text]) => ({ answerId, label, text })),
    });
  }
}

export type { ExamType };
