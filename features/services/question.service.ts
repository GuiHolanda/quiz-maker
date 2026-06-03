import { prisma, PrismaService } from '@/lib/prisma';
import { AIQuestion, AIPublicExamQuestion, Answer, QuestionParams, PublicExamQuestionParams } from '@/shared/types';
import { toSafeString } from '@/shared/utils';

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
      for (const question of questions) {
        const { publicExamName, examBoardName, subject, topic, text, correctCount, options, difficulty } = question;

        const createdQuestion = await tx.publicExamQuestion.create({
          data: {
            publicExamName,
            examBoardName,
            subject,
            topic: topic ?? null,
            text,
            correctCount,
            difficulty,
            userId,
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
}
