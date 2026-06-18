import { prisma, PrismaService } from '@/lib/prisma';
import { AIQuestion, AIPublicExamQuestion, Answer, QuestionParams, PublicExamQuestionParams } from '@/shared/types';
import { toSafeString, normalizeName, looseKey } from '@/shared/utils';

export function validateAiQuestions(obj: unknown): AIQuestion[] | AIPublicExamQuestion[] {
  if (!Array.isArray((obj as any)?.questions)) throw new Error('Invalid format: questions array is required');
  for (const q of (obj as any).questions) {
    if (!q || typeof q.text !== 'string') throw new Error('Invalid format: question text is required');
    if (!q.options || typeof q.options !== 'object') throw new Error('Invalid format: question options are required');
  }

  return (obj as any).questions;
}

// ---- Certification questions ----

export class CertificationQuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public getQuestionParams(url: URL): QuestionParams {
    const params = url.searchParams;
    const certification_name = params.get('certification_name')?.trim() || 'General Certification';
    const topic_name = params.get('topic_name')?.trim() || '';
    const num_questions = params.get('num_questions')?.toString().trim() || '10';

    return { certification_name, topic_name, num_questions };
  }

  public async createFromPayload(questions: AIQuestion[], userId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const results: any[] = [];

      for (const question of questions) {
        const { certificationTitle, text, correctCount, options, topic, difficulty, topicSubarea } = question;

        const createdQuestion = await tx.question.create({
          data: {
            certificationTitle,
            text,
            correctCount,
            topic,
            difficulty,
            topicSubarea: topicSubarea ?? null,
            userId,
          },
        });

        const optionMap: Record<string, number> = {};
        const optionsObj: Record<string, string> = {};

        for (const [label, txt] of Object.entries(options)) {
          const textVal = toSafeString(txt);
          const opt = await tx.option.create({
            data: { questionId: createdQuestion.id, label, text: textVal },
          });

          optionMap[label] = opt.id;
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
        await tx.answer.create({
          data: { questionId: answer.questionId, correctOptions: answer.correctOptions },
        });
      }
    });
  }

  public async saveExplanations(answerId: number, explanations: Record<string, string>) {
    await this.prismaService.explanation.createMany({
      data: Object.entries(explanations).map(([label, text]) => ({ answerId, label, text })),
    });
  }
}

// ---- Public exam questions ----

export class PublicExamQuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public getQuestionParams(url: URL): PublicExamQuestionParams {
    const params = url.searchParams;
    const public_exam_name = params.get('public_exam_name')?.trim() || 'Concurso Público';
    const exam_board_name = params.get('exam_board_name')?.trim() || 'Banca';
    const subject_name = params.get('subject_name')?.trim() || '';
    const topic_name = params.get('topic_name')?.trim() || undefined;
    const num_questions = params.get('num_questions')?.toString().trim() || '10';

    return { public_exam_name, exam_board_name, subject_name, topic_name, num_questions };
  }

  public async createFromPayload(questions: AIPublicExamQuestion[], userId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const results: any[] = [];

      // Resolve canonical subjects from PublicExam configuration so the LLM's
      // echoed `subject` string never drifts from PublicExamSubject.name.
      // Drift causes the mock-exam count query to return 0 — see
      // docs note in CLAUDE.md "PublicExamQuestion.subject denormalization".
      const examName = questions[0]?.publicExamName ?? '';
      const exam = examName
        ? await tx.publicExam.findFirst({
            where: { name: examName, userId },
            include: { subjects: { include: { topics: true } } },
          })
        : null;

      type Canonical = { id: string; name: string };
      const subjectCanonical = new Map<string, Canonical>();
      const topicCanonical = new Map<string, Canonical>();

      if (exam) {
        for (const s of exam.subjects) {
          subjectCanonical.set(looseKey(s.name), { id: s.id, name: s.name });
          for (const t of s.topics) {
            topicCanonical.set(`${looseKey(s.name)}::${looseKey(t.name)}`, { id: t.id, name: t.name });
          }
        }
      }

      for (const question of questions) {
        const { publicExamName, examBoardName, subject, topic, text, correctCount, options, difficulty } = question;

        const incomingSubject = normalizeName(subject ?? '');
        const matchedSubject = subjectCanonical.get(looseKey(incomingSubject));
        const canonicalSubjectName = matchedSubject?.name ?? incomingSubject;
        const subjectId = matchedSubject?.id ?? null;

        const incomingTopic = topic ? normalizeName(topic) : null;
        const matchedTopic =
          incomingTopic != null
            ? topicCanonical.get(`${looseKey(canonicalSubjectName)}::${looseKey(incomingTopic)}`)
            : undefined;
        const canonicalTopicName = matchedTopic?.name ?? incomingTopic;
        const topicId = matchedTopic?.id ?? null;

        const createdQuestion = await tx.publicExamQuestion.create({
          data: {
            publicExamName: normalizeName(publicExamName ?? ''),
            examBoardName: normalizeName(examBoardName ?? ''),
            subject: canonicalSubjectName,
            topic: canonicalTopicName,
            text,
            correctCount,
            difficulty,
            userId,
            publicExamId: exam?.id ?? null,
            subjectId,
            topicId,
          },
        });

        const optionsObj: Record<string, string> = {};

        for (const [label, txt] of Object.entries(options)) {
          const textVal = toSafeString(txt);

          await tx.publicExamOption.create({
            data: { questionId: createdQuestion.id, label, text: textVal },
          });
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
        await tx.publicExamAnswer.create({
          data: { questionId: answer.questionId, correctOptions: answer.correctOptions },
        });
      }
    });
  }

  public async saveExplanations(answerId: number, explanations: Record<string, string>) {
    await this.prismaService.publicExamExplanation.createMany({
      data: Object.entries(explanations).map(([label, text]) => ({ answerId, label, text })),
    });
  }
}
