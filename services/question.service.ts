import { prisma, PrismaService } from "@/lib/prisma";
import { Questionare } from "@/types";

export class QuestionService {
  constructor(private prismaService: PrismaService = prisma) {}

  async createFromPayload(payload: Questionare) {
    return this.prismaService.$transaction(async (tx) => {
      const results = [];
      for (const question of payload.questions) {
        const { text, correctCount, options, topic, difficulty, topicSubarea, answer } =
          question;

        const createdQuestion = await tx.question.create({
          data: {
            text,
            correctCount,
            topic,
            difficulty,
            topicSubarea: topicSubarea ?? null,
          },
        });

        const optionMap: Record<string, number> = {};
        for (const [label, text] of Object.entries(options)) {
          const opt = await tx.option.create({
            data: {
              questionId: createdQuestion.id,
              label,
              text: String(text),
            },
          });
          optionMap[label] = opt.id;
        }

        const createdAnswer = await tx.answer.create({
          data: {
            questionId: createdQuestion.id,
            correctOptions: answer.correctOptions,
          },
        });

        const explanationsObj = answer.explanations || {};
        for (const [label, text] of Object.entries(explanationsObj)) {
          const optionId = optionMap[label];
          await tx.explanation.create({
            data: {
              answerId: createdAnswer.id,
              label: label,
              text: String(text),
            },
          });
        }

        results.push({ question: createdQuestion, answer: createdAnswer });
      }
      return results;
    });
  }
}
