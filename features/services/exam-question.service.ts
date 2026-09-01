import { prisma, PrismaService } from '@/lib/prisma';
import { shuffleOptionTexts } from '@/lib/shuffle-options';
import { resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormat } from '@/config/question-formats';
import { AIExamQuestion, Answer, ExamQuestionParams, ExamType } from '@/shared/types';
import { toSafeString, normalizeName, looseKey } from '@/shared/utils';

// `format` is optional so callers that only need the structural checks (a legacy
// payload, a job saved before the exam carried a format) keep working. When supplied,
// the generated options must match the format's label set exactly — a drafting model
// that drops an option or invents an "F" is caught here rather than at render time.
function assertValidAiQuestion(q: any, format?: QuestionFormat): void {
  if (!q || typeof q.text !== 'string') throw new Error('Invalid format: question text is required');
  if (!q.options || typeof q.options !== 'object') throw new Error('Invalid format: question options are required');

  const labels = Object.keys(q.options);

  if (labels.length < 2) throw new Error('Invalid format: a question needs at least 2 options');

  if (Object.values(q.options).some((text) => typeof text !== 'string' || text.trim() === ''))
    throw new Error('Invalid format: option texts must be non-empty strings');

  if (format) {
    const expected = format.labels;
    const matchesFormat = labels.length === expected.length && expected.every((label) => label in q.options);

    if (!matchesFormat)
      throw new Error(
        `Invalid format: expected options ${expected.join(', ')} but received ${labels.sort().join(', ')}`
      );
  }

  const maxCorrect = format ? format.maxCorrect : labels.length - 1;

  // A question whose every option is correct cannot be answered wrong, so correctCount
  // is capped below the option count even without a declared format.
  if (typeof q.correctCount === 'number' && (q.correctCount < 1 || q.correctCount > maxCorrect))
    throw new Error(`Invalid format: correctCount must be between 1 and ${maxCorrect}`);
}

export function validateAiQuestions(obj: unknown, format?: QuestionFormat): AIExamQuestion[] {
  if (!Array.isArray((obj as any)?.questions)) throw new Error('Invalid format: questions array is required');
  for (const q of (obj as any).questions) assertValidAiQuestion(q, format);

  return (obj as any).questions;
}

// Batch-generation path: one malformed question (a drafting/review model that inflates
// correctCount past the format ceiling, drops an option, etc.) must not fail the whole
// topic. Drops the offenders instead of throwing; the caller decides if enough survived.
export function sanitizeAiQuestions(
  obj: unknown,
  format?: QuestionFormat
): { questions: AIExamQuestion[]; dropped: string[] } {
  if (!Array.isArray((obj as any)?.questions)) throw new Error('Invalid format: questions array is required');

  const questions: AIExamQuestion[] = [];
  const dropped: string[] = [];

  for (const q of (obj as any).questions) {
    try {
      assertValidAiQuestion(q, format);
      questions.push(q as AIExamQuestion);
    } catch (err) {
      dropped.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { questions, dropped };
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

      // The exam declares what to generate; the question records what it actually is,
      // because ExamQuestion.examId is ON DELETE SET NULL and pooled questions travel
      // between exams. An unresolvable exam falls back to the legacy A–E shape.
      const format = resolveQuestionFormat(exam?.questionFormat);

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

        // Look up a matching QuestionPool entry so this question joins the shared pool.
        // Only attempts the lookup when the exam has a provider or examBoard (pool key requires one).
        let poolId: string | null = null;
        if (exam && (exam.providerId || exam.examBoardId)) {
          const matchingPool = await tx.questionPool.findFirst({
            where: {
              type: exam.type,
              providerId: exam.providerId ?? null,
              examBoardId: exam.examBoardId ?? null,
              sectionName: canonicalSectionName,
              topicName: canonicalTopicName ?? null,
            },
            select: { id: true },
          });
          poolId = matchingPool?.id ?? null;
        }

        const createdQuestion = await tx.examQuestion.create({
          data: {
            examName: normalizeName(qExamName ?? ''),
            sectionName: canonicalSectionName,
            topicName: canonicalTopicName,
            text,
            correctCount,
            difficulty,
            format: format.key,
            userId,
            examId: exam?.id ?? null,
            sectionId,
            topicId,
            poolId,
          },
        });

        const sanitizedOptions = Object.entries(options).reduce<Record<string, string>>((acc, [label, txt]) => {
          acc[label] = toSafeString(txt);

          return acc;
        }, {});

        // Persist a shuffled letter assignment, never the model's own ordering — the
        // drafting LLM puts the correct alternative first, and the gabarito is derived
        // later from these stored options, so it follows the shuffle.
        //
        // Formats whose labels carry meaning are exempt: in Certo/Errado "C" must stay
        // on "Certo", so reassigning texts across labels would invert the gabarito.
        const optionsObj = format.labelsAreSemantic ? sanitizedOptions : shuffleOptionTexts(sanitizedOptions);

        for (const [label, text] of Object.entries(optionsObj)) {
          await tx.examOption.create({ data: { questionId: createdQuestion.id, label, text } });
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
