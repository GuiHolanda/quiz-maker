import { prisma, PrismaService } from "@/lib/prisma";
import { Question, QuizParams } from "@/types";
import { parseNumber } from "@/utils";
import { OpenAI } from "openai/client";

export class QuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public async fetchAiQuestions(client: OpenAI, prompt: string, timeoutMs: number | undefined): Promise<string | null> {
    const call = client.responses.create({ model: 'gpt-5-nano', input: prompt });
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('LLM timeout')), timeoutMs));
    const res: any = await Promise.race([call, timeout]);
    const outputText = res?.output_text ?? res?.output?.[0]?.content?.[0]?.text ?? null;
    return outputText;
  }

  public validateQuestions(obj: unknown) {
  if (!Array.isArray(obj)) return { ok: false, error: 'not-an-array' };
  for (const q of obj) {
    if (!q || typeof q.text !== 'string') return { ok: false, error: 'missing-text' };
    if (!q.options || typeof q.options !== 'object') return { ok: false, error: 'missing-options' };
    if (!q.answer || !Array.isArray(q.answer.correctOptions)) return { ok: false, error: 'missing-answer' };
  }
  return { ok: true, value: obj as Question[] };
}

  public  parseParams(url: URL): QuizParams | { error: string } {
    const params = url.searchParams;
    const certificationTitle = params.get('certificationTitle')?.trim() || 'General Certification';
    const topic = params.get('topic')?.trim() ?? '';
    const numQuestions = parseNumber(params.get('num_questions'), 10) ?? 10;
    if (!Number.isInteger(numQuestions) || numQuestions <= 0) {
      return { error: 'num_questions must be an integer > 0' };
    }
  
    const easy = parseNumber(params.get('easy'), 0) ?? 0;
    const medium = parseNumber(params.get('medium'), 0) ?? 0;
    const hard = parseNumber(params.get('hard'), 0) ?? 0;
  
    let newPercentRaw = parseFloat(params.get('new_percent') ?? '0');
    if (isNaN(newPercentRaw)) newPercentRaw = 0;
    if (newPercentRaw > 1 && newPercentRaw <= 100) newPercentRaw = newPercentRaw / 100;
    if (newPercentRaw < 0) newPercentRaw = 0;
  
    const timeoutMs = parseNumber(params.get('timeout_ms'), 180000) ?? 180000;

    return {
      certificationTitle,
      topic,
      numQuestions,
      difficulty: { easy: Number(easy) || 0, medium: Number(medium) || 0, hard: Number(hard) || 0 },
      newPercent: newPercentRaw,
      timeoutMs,
    };
  }

  private async countByTopic(topic?: string, difficulty?: string) {
    const where: any = {};
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = difficulty;
    return this.prismaService.question.count({ where });
  }

  async fetchRecycledQuestions(topic?: string, limit = 10) {
    if (!limit || limit <= 0) return [];
    const where = topic ? { topic } : {};
    const rows = await this.prismaService.question.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        options: true,
        answer: { include: { explanations: true } },
      },
    });

    return rows.map((q) => ({
      id: q.id,
      text: q.text,
      correctCount: q.correctCount,
      topic: q.topic,
      difficulty: q.difficulty,
      topicSubarea: q.topicSubarea ?? undefined,
      options: q.options.reduce((acc: Record<string, string>, o) => {
        acc[o.label] = o.text;
        return acc;
      }, {}),
      answer: q.answer
        ? {
            correctOptions: q.answer.correctOptions as string[],
            explanations: (q.answer.explanations || []).reduce(
              (a: Record<string, string>, ex) => ((a[ex.label] = ex.text), a),
              {}
            ),
          }
        : { correctOptions: [], explanations: {} },
    }));
  }

  async createFromPayload(questions: Question[]) {
    return this.prismaService.$transaction(async (tx) => {
      const results: any[] = [];
      for (const question of questions) {
        const {
          certificationTitle,
          text,
          correctCount,
          options,
          topic,
          difficulty,
          topicSubarea,
          answer,
        } = question;

        const createdQuestion = await tx.question.create({
          data: {
            certificationTitle,
            text,
            correctCount,
            topic,
            difficulty,
            topicSubarea: topicSubarea ?? null,
          },
        });

        const optionMap: Record<string, number> = {};
        const optionsObj: Record<string, string> = {};
        for (const [label, txt] of Object.entries(options)) {
          const opt = await tx.option.create({
            data: {
              questionId: createdQuestion.id,
              label,
              text: String(txt),
            },
          });
          optionMap[label] = opt.id;
          optionsObj[label] = String(txt);
        }

        const createdAnswer = await tx.answer.create({
          data: {
            questionId: createdQuestion.id,
            correctOptions: answer.correctOptions,
          },
        });

        const explanationsObj = answer.explanations || {};
        for (const [label, txt] of Object.entries(explanationsObj)) {
          await tx.explanation.create({
            data: {
              answerId: createdAnswer.id,
              label: label,
              text: String(txt),
            },
          });
        }

        results.push({
          question: createdQuestion,
          answer: createdAnswer,
          options: optionsObj,
          explanations: explanationsObj,
        });
      }
      return results;
    });
  }

  async handleNewQuestionsDistribution(
    topic: string,
    num_questions: number,
    newPercent: number | undefined
  ): Promise<{ desiredNew: number; recycledNeeded: number }> {
    try {
      const existingCount = await this.countByTopic(topic || undefined);
      newPercent = newPercent ?? 0.3;
      const newCount = newPercent * num_questions;

      let desiredNew = 0;
      if (newCount && newCount >= 0) {
        desiredNew = Math.min(newCount, num_questions);
      } else if (isFinite(newPercent) && newPercent > 0) {
        desiredNew = Math.ceil(newPercent * num_questions);
      } else {
        desiredNew = num_questions;
      }

      let recycledNeeded = Math.max(0, num_questions - desiredNew);

      if (existingCount < recycledNeeded) {
        const shortage = recycledNeeded - existingCount;
        recycledNeeded = existingCount;
        desiredNew = Math.min(num_questions, desiredNew + shortage);
      }

      return { desiredNew, recycledNeeded };

    } catch (error) {
      console.error("Failed to compute new questions distribution:", error);
      throw new Error("Failed to compute new questions distribution");
    }
  }
}
