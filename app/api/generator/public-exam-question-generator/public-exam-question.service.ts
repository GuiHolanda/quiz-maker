import { prisma, PrismaService } from '@/lib/prisma';
import { AIPublicExamQuestion, Answer, PublicExamQuestionParams } from '@/shared/types';
import { toSafeString } from '@/shared/utils';

export class PublicExamQuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public getValidatedQuestions(obj: any): AIPublicExamQuestion[] {
    if (!Array.isArray(obj?.questions)) throw new Error('Invalid format: questions array is required');
    for (const q of obj.questions) {
      if (!q || typeof q.text !== 'string') throw new Error('Invalid format: question text is required');
      if (!q.options || typeof q.options !== 'object') throw new Error('Invalid format: question options are required');
    }
    return obj.questions;
  }

  public getQuestionParams(url: URL): PublicExamQuestionParams {
    const params = url.searchParams;
    const public_exam_name = params.get('public_exam_name')?.trim() || 'Concurso Público';
    const exam_board_name = params.get('exam_board_name')?.trim() || 'Banca';
    const subject_name = params.get('subject_name')?.trim() || '';
    const topic_name = params.get('topic_name')?.trim() || undefined;
    const num_questions = params.get('num_questions')?.toString().trim() || '10';

    return {
      public_exam_name,
      exam_board_name,
      subject_name,
      topic_name,
      num_questions,
    };
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
            data: {
              questionId: createdQuestion.id,
              label,
              text: textVal,
            },
          });
          optionsObj[label] = textVal;
        }

        results.push({
          question: createdQuestion,
          options: optionsObj,
        });
      }
      return results;
    });
  }

  public async saveAnswers(answers: Answer[]) {
    return this.prismaService.$transaction(async (tx) => {
      for (const answer of answers) {
        await tx.publicExamAnswer.create({
          data: {
            questionId: answer.questionId,
            correctOptions: answer.correctOptions,
          },
        });
      }
    });
  }
}
