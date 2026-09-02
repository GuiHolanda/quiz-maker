import { PrismaClient } from '@prisma/client';
import { ExamQuestionService, validateAiQuestions } from '@/features/services/exam-question.service';

export async function finalizeAwaitingReviewJobs(
  client: PrismaClient
): Promise<{ finalized: number; questionsSaved: number }> {
  const jobs = await client.generationJob.findMany({
    where: { status: 'awaiting_review' },
    include: { topics: true },
  });

  const questionService = new ExamQuestionService();
  let questionsSaved = 0;

  for (const job of jobs) {
    let totalSaved = 0;

    for (const topic of job.topics) {
      if (!topic.pendingQuestionsJson) {
        totalSaved += topic.savedCount;
        continue;
      }

      const raw = JSON.parse(topic.pendingQuestionsJson);
      const payload = Array.isArray(raw) ? { questions: raw } : raw;
      const questions = validateAiQuestions(payload);

      await questionService.createFromPayload(questions, job.userId, job.refKey);
      const topicSaved = topic.savedCount + questions.length;
      await client.generationJobTopic.update({
        where: { id: topic.id },
        data: { savedCount: topicSaved, pendingQuestionsJson: null },
      });

      totalSaved += topicSaved;
    }

    await client.generationJob.update({
      where: { id: job.id },
      data: { status: 'done', savedCount: totalSaved },
    });

    questionsSaved += totalSaved;
    console.log(`job ${job.id}: ${totalSaved} questões salvas`);
  }

  console.log(`${jobs.length} job(s) finalizados`);

  return { finalized: jobs.length, questionsSaved };
}

if (require.main === module) {
  const client = new PrismaClient();
  finalizeAwaitingReviewJobs(client)
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => client.$disconnect());
}
