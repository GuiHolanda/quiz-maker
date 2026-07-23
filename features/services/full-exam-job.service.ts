import { prisma } from '@/lib/prisma';
import { OpenAIService } from '@/features/services/openAI.service';
import { QuotaService } from '@/features/services/quota.service';
import {
  CertificationQuestionService,
  PublicExamQuestionService,
  validateAiQuestions,
} from '@/features/services/question.service';
import { certificationQuestionsResearchPrompt } from '@/config/prompts/certification-questions-research.prompt';
import { certificationQuestionsReviewPrompt } from '@/config/prompts/certification-questions-review.prompt';
import { certificationQuestionsFormatPrompt } from '@/config/prompts/certification-questions-format.prompt';
import { publicExamQuestionsResearchPrompt } from '@/config/prompts/public-exam-questions-research.prompt';
import { publicExamQuestionsReviewPrompt } from '@/config/prompts/public-exam-questions-review.prompt';
import { publicExamQuestionsFormatPrompt } from '@/config/prompts/public-exam-questions-format.prompt';
import type { AIQuestion, AIPublicExamQuestion } from '@/shared/types';

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 500);
  return String(err).slice(0, 500);
}

export async function processFullExamJob(
  jobId: string,
  userId: string,
  type: 'certification' | 'public_exam',
  refName: string,
  examBoardName: string | null,
  distribution: Array<{ topicName: string; questionCount: number }>,
): Promise<void> {
  const openAIService = new OpenAIService();
  const quotaService = new QuotaService();

  const CONCURRENCY = 5;

  // Create a FullExamJobTopic row for each topic upfront
  const topicRows = await Promise.all(
    distribution.map(({ topicName, questionCount }) =>
      prisma.fullExamJobTopic.create({
        data: { jobId, topicName, questionCount, status: 'pending' },
      }),
    ),
  );

  async function processTopic(topicId: string, topicName: string, questionCount: number): Promise<void> {
    await prisma.fullExamJobTopic.update({
      where: { id: topicId },
      data: { status: 'running' },
    });

    const numStr = String(questionCount);
    const { logId } = await quotaService.checkAndRecordQuestions(userId, questionCount);

    let questions: AIQuestion[] | AIPublicExamQuestion[];

    if (type === 'certification') {
      const research = await openAIService.call(
        certificationQuestionsResearchPrompt,
        { certification_name: refName, topic_name: topicName, num_questions: numStr },
        { webSearch: true },
      );
      const review = await openAIService.call(
        certificationQuestionsReviewPrompt,
        { certification_name: refName, topic_name: topicName, draft_questions: research.text },
        { webSearch: false, model: process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o' },
      );
      const format = await openAIService.call(
        certificationQuestionsFormatPrompt,
        { certification_name: refName, topic_name: topicName, reviewed_questions: review.text },
        { webSearch: false, jsonMode: true },
      );
      void quotaService.recordTokens(logId, {
        inputTokens: research.inputTokens + review.inputTokens + format.inputTokens,
        outputTokens: research.outputTokens + review.outputTokens + format.outputTokens,
      });
      questions = validateAiQuestions(JSON.parse(extractJson(format.text))) as AIQuestion[];
      const certService = new CertificationQuestionService();
      await certService.createFromPayload(questions as AIQuestion[], userId);
    } else {
      const research = await openAIService.call(
        publicExamQuestionsResearchPrompt,
        { public_exam_name: refName, exam_board_name: examBoardName ?? '', subject_name: topicName, num_questions: numStr },
        { webSearch: true },
      );
      const review = await openAIService.call(
        publicExamQuestionsReviewPrompt,
        { public_exam_name: refName, exam_board_name: examBoardName ?? '', subject_name: topicName, draft_questions: research.text },
        { webSearch: false, model: process.env.OPENAI_MODEL_REVIEW ?? process.env.OPENAI_MODEL ?? 'gpt-4o' },
      );
      const format = await openAIService.call(
        publicExamQuestionsFormatPrompt,
        { public_exam_name: refName, exam_board_name: examBoardName ?? '', subject_name: topicName, reviewed_questions: review.text },
        { webSearch: false, jsonMode: true },
      );
      void quotaService.recordTokens(logId, {
        inputTokens: research.inputTokens + review.inputTokens + format.inputTokens,
        outputTokens: research.outputTokens + review.outputTokens + format.outputTokens,
      });
      questions = validateAiQuestions(JSON.parse(extractJson(format.text))) as AIPublicExamQuestion[];
      const examService = new PublicExamQuestionService();
      await examService.createFromPayload(questions as AIPublicExamQuestion[], userId);
    }

    await prisma.fullExamJobTopic.update({
      where: { id: topicId },
      data: { status: 'done', savedCount: questions.length },
    });

    await prisma.fullExamJob.update({
      where: { id: jobId },
      data: { doneTopics: { increment: 1 }, savedCount: { increment: questions.length } },
    });
  }

  try {
    for (let i = 0; i < topicRows.length; i += CONCURRENCY) {
      const batch = topicRows.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async ({ id: topicId, topicName, questionCount }) => {
          try {
            await processTopic(topicId, topicName, questionCount);
          } catch (topicErr) {
            const errorMessage = sanitizeError(topicErr);
            console.error(`[full-exam-job] Topic "${topicName}" failed:`, topicErr);
            await prisma.fullExamJobTopic.update({
              where: { id: topicId },
              data: { status: 'error', errorMessage },
            });
            await prisma.fullExamJob.update({
              where: { id: jobId },
              data: { doneTopics: { increment: 1 } },
            });
          }
        }),
      );
    }

    await prisma.fullExamJob.update({
      where: { id: jobId },
      data: { status: 'done' },
    });
  } catch (fatalErr) {
    console.error(`[full-exam-job] Job ${jobId} fatal error:`, fatalErr);
    await prisma.fullExamJob.update({
      where: { id: jobId },
      data: { status: 'error' },
    });
  }
}
