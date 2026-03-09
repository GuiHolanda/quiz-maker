import { prisma, PrismaService } from '@/lib/prisma';
import { AIQuestion, Answer, QuestionParams } from '@/types';
import { toSafeString } from '@/utils';

export class QuestionService {
  constructor(private readonly prismaService: PrismaService = prisma) {}

  public getValidatedQuestions(obj: any): AIQuestion[] {
    if (!Array.isArray(obj?.questions)) throw new Error('Invalid format: questions array is required');
    for (const q of obj.questions) {
      if (!q || typeof q.text !== 'string') throw new Error('Invalid format: question text is required');
      if (!q.options || typeof q.options !== 'object') throw new Error('Invalid format: question options are required');
    }
    return obj.questions;
  }

  public getQuestionParams(url: URL): QuestionParams {
    const params = url.searchParams;
    const certification_name = params.get('certification_name')?.trim() || 'General Certification';
    const topic_name = params.get('topic_name')?.trim() || '';
    const num_questions = params.get('num_questions')?.toString().trim() || '10';

    return {
      certification_name,
      topic_name,
      num_questions
    };
  }

  public async createFromPayload(questions: AIQuestion[]) {
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

        // const createdAnswer = await tx.answer.create({
        //   data: {
        //     questionId: createdQuestion.id,
        //     correctOptions: answer.correctOptions,
        //   },
        // });

        // const explanationsObj = answer.explanations || {};
        // for (const [label, txt] of Object.entries(explanationsObj)) {
        //   const textVal = toSafeString(txt);
        //   await tx.explanation.create({
        //     data: {
        //       answerId: createdAnswer.id,
        //       label: label,
        //       text: textVal,
        //     },
        //   });
        // }

        results.push({
          question: createdQuestion,
          //answer: createdAnswer,
          options: optionsObj,
          //explanations: explanationsObj,
        });
      }
      return results;
    });
  }

  public async saveAnswers(answers: Answer[]) {
    return this.prismaService.$transaction(async (tx) => {
      for (const answer of answers) {
        await tx.answer.create({
          data: {
            questionId: answer.questionId,
            correctOptions: answer.correctOptions,
          },
        });
      }
    });
  }

  // public shuffleQuestionOptions(question: AIQuestion) {
  //   const allLabels = this.getAllLabels();
  //   const presentLabels = this.getPresentLabels(question, allLabels);

  //   if (presentLabels.length <= 1) return question;

  //   const entries = this.buildEntries(question, presentLabels);
  //   this.shuffleInPlace(entries);

  //   const { newOptions, newExplanations, oldToNew } = this.rebuildMappings(entries, presentLabels);

  //   const originalCorrect: string[] =
  //     question.answer && Array.isArray(question.answer.correctOptions) ? question.answer.correctOptions : [];
  //   const newCorrect = this.remapCorrectOptions(originalCorrect, oldToNew);

  //   const finalExplanations = this.buildFinalExplanations(newExplanations, allLabels);

  //   question.options = newOptions;
  //   question.answer = {
  //     ...(question.answer ?? { correctOptions: [], explanations: {} }),
  //     correctOptions: newCorrect,
  //     explanations: finalExplanations as any,
  //   };
  //   question.correctCount = Array.isArray(question.answer.correctOptions)
  //     ? question.answer.correctOptions.length
  //     : question.correctCount;
  //   return question;
  // }

  // private getAllLabels() {
  //   return ['A', 'B', 'C', 'D', 'E'];
  // }

  // private getPresentLabels(question: Question, allLabels: string[]): string[] {
  //   const opts = question.options ?? {};
  //   const allPresent = allLabels.every((l) => typeof opts[l] === 'string' && opts[l].trim() !== '');
  //   return allPresent ? allLabels : allLabels.filter((l) => opts[l] != null && opts[l] !== '');
  // }

  // private buildEntries(question: Question, presentLabels: string[]) {
  //   return presentLabels.map((lbl) => ({
  //     originalLabel: lbl,
  //     text: toSafeString(question.options[lbl]),
  //     explanation: (question.answer as any)?.explanations?.[lbl] ?? '',
  //   }));
  // }

  // private shuffleInPlace<T>(arr: T[]) {
  //   for (let i = arr.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [arr[i], arr[j]] = [arr[j], arr[i]];
  //   }
  // }

  // private rebuildMappings(
  //   entries: { originalLabel: string; text: string; explanation: string }[],
  //   presentLabels: string[]
  // ) {
  //   const newOptions: Record<string, string> = {};
  //   const newExplanations: Record<string, string> = {};
  //   const oldToNew: Record<string, string> = {};
  //   for (let i = 0; i < entries.length; i++) {
  //     const targetLabel = presentLabels[i];
  //     const e = entries[i];
  //     newOptions[targetLabel] = e.text;
  //     newExplanations[targetLabel] = e.explanation;
  //     oldToNew[e.originalLabel] = targetLabel;
  //   }
  //   return { newOptions, newExplanations, oldToNew };
  // }

  // private remapCorrectOptions(originalCorrect: string[], oldToNew: Record<string, string>) {
  //   return originalCorrect.map((old) => oldToNew[old] || old).filter(Boolean);
  // }

  // private buildFinalExplanations(newExplanations: Record<string, string>, allLabels: string[]) {
  //   const final: Record<string, string> = {};
  //   for (const lbl of allLabels) {
  //     final[lbl] = newExplanations[lbl] ?? '';
  //   }
  //   return final;
  // }
}
