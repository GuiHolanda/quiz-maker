import { prisma, PrismaService } from '@/lib/prisma';
import { Question, QuizParams } from '@/types';
import { parseNumber, toSafeString } from '@/utils';
import { OpenAI } from 'openai/client';

export class QuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public async fetchAiQuestions(prompt: string, timeoutMs: number | undefined): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('API key not configured');
    const client = new OpenAI({ apiKey });
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

  public parseParams(url: URL): QuizParams | { error: string } {
    const params = url.searchParams;
    const certificationTitle = params.get('certificationTitle')?.trim() || 'General Certification';
    const topic = params.get('topic')?.trim() ?? '';
    const numQuestions = parseNumber(params.get('numQuestions'), 10) ?? 10;
    if (!Number.isInteger(numQuestions) || numQuestions <= 0) {
      return { error: 'numQuestions must be an integer > 0' };
    }

    const easy = parseNumber(params.get('easy'), 0) ?? 0;
    const medium = parseNumber(params.get('medium'), 0) ?? 0;
    const hard = parseNumber(params.get('hard'), 0) ?? 0;

    let newPercentRaw = Number.parseFloat(params.get('newPercent') ?? '0');
    if (Number.isNaN(newPercentRaw)) newPercentRaw = 0;
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
      orderBy: { createdAt: 'desc' },
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
            explanations: (q.answer.explanations || []).reduce((a: Record<string, string>, ex) => {
              a[ex.label] = ex.text;
              return a;
            }, {}),
          }
        : { correctOptions: [], explanations: {} },
    }));
  }

  async createFromPayload(questions: Question[]) {
    return this.prismaService.$transaction(async (tx) => {
      const results: any[] = [];
      for (const question of questions) {
        const { certificationTitle, text, correctCount, options, topic, difficulty, topicSubarea, answer } = question;

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
          const textVal = toSafeString(txt);
          const opt = await tx.option.create({
            data: {
              questionId: createdQuestion.id,
              label,
              text: textVal,
            },
          });
          optionMap[label] = opt.id;
          optionsObj[label] = textVal;
        }

        const createdAnswer = await tx.answer.create({
          data: {
            questionId: createdQuestion.id,
            correctOptions: answer.correctOptions,
          },
        });

        const explanationsObj = answer.explanations || {};
        for (const [label, txt] of Object.entries(explanationsObj)) {
          const textVal = toSafeString(txt);
          await tx.explanation.create({
            data: {
              answerId: createdAnswer.id,
              label: label,
              text: textVal,
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
      } else if (Number.isFinite(newPercent) && newPercent > 0) {
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
      console.error('Failed to compute new questions distribution:', error);
      throw new Error('Failed to compute new questions distribution');
    }
  }

  public shuffleQuestionOptions(question: Question) {
    const allLabels = this.getAllLabels();
    const presentLabels = this.getPresentLabels(question, allLabels);

    if (presentLabels.length <= 1) return question;

    const entries = this.buildEntries(question, presentLabels);
    this.shuffleInPlace(entries);

    const { newOptions, newExplanations, oldToNew } = this.rebuildMappings(entries, presentLabels);

    const originalCorrect: string[] = (question.answer && Array.isArray(question.answer.correctOptions) ? question.answer.correctOptions : []);
    const newCorrect = this.remapCorrectOptions(originalCorrect, oldToNew);

    const finalExplanations = this.buildFinalExplanations(newExplanations, allLabels);

    question.options = newOptions;
    question.answer = {
      ...(question.answer ?? { correctOptions: [], explanations: {} }),
      correctOptions: newCorrect,
      explanations: finalExplanations as any,
    };
    question.correctCount = Array.isArray(question.answer.correctOptions) ? question.answer.correctOptions.length : question.correctCount;
    return question;
  }

  private getAllLabels() {
    return ['A', 'B', 'C', 'D', 'E'];
  }

  private getPresentLabels(question: Question, allLabels: string[]): string[] {
    const opts = question.options ?? {};
    const allPresent = allLabels.every((l) => typeof opts[l] === 'string' && opts[l].trim() !== '');
    return allPresent ? allLabels : allLabels.filter((l) => opts[l] != null && opts[l] !== '');
  }

  private buildEntries(question: Question, presentLabels: string[]) {
    return presentLabels.map((lbl) => ({
      originalLabel: lbl,
      text: toSafeString(question.options[lbl]),
      explanation: (question.answer as any)?.explanations?.[lbl] ?? '',
    }));
  }

  private shuffleInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private rebuildMappings(entries: { originalLabel: string; text: string; explanation: string }[], presentLabels: string[]) {
    const newOptions: Record<string, string> = {};
    const newExplanations: Record<string, string> = {};
    const oldToNew: Record<string, string> = {};
    for (let i = 0; i < entries.length; i++) {
      const targetLabel = presentLabels[i];
      const e = entries[i];
      newOptions[targetLabel] = e.text;
      newExplanations[targetLabel] = e.explanation;
      oldToNew[e.originalLabel] = targetLabel;
    }
    return { newOptions, newExplanations, oldToNew };
  }

  private remapCorrectOptions(originalCorrect: string[], oldToNew: Record<string, string>) {
    return originalCorrect.map((old) => oldToNew[old] || old).filter(Boolean);
  }

  private buildFinalExplanations(newExplanations: Record<string, string>, allLabels: string[]) {
    const final: Record<string, string> = {};
    for (const lbl of allLabels) {
      final[lbl] = newExplanations[lbl] ?? '';
    }
    return final;
  }
}
