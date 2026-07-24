import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: vi.fn().mockImplementation(function () {
    this.call = vi.fn().mockResolvedValue({ text: '{"questions":[{"id":1,"text":"Q1","options":{"A":"opt"}}]}', inputTokens: 10, outputTokens: 20 });
  }),
}));

vi.mock('@/features/services/question.service', () => ({
  validateAiQuestions: vi.fn().mockReturnValue([{ id: 1, text: 'Q1' }]),
  CertificationQuestionService: vi.fn(),
  PublicExamQuestionService: vi.fn(),
}));

vi.mock('@/features/services/quota.service', () => ({
  QuotaService: vi.fn().mockImplementation(function () {
    this.checkAndRecordQuestions = vi.fn().mockResolvedValue({ logId: 'log-1' });
    this.recordTokens = vi.fn().mockResolvedValue(undefined);
  }),
}));

import { processFullExamJob } from '@/features/services/full-exam-job.service';

const makeTopic = (overrides = {}) => ({
  id: 'topic-1',
  jobId: 'job-1',
  topicName: 'S3',
  questionCount: 5,
  status: 'pending',
  savedCount: 0,
  errorMessage: null,
  pendingQuestionsJson: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('processFullExamJob — awaiting_review flow', () => {
  beforeEach(() => {
    prismaMock.fullExamJobTopic.create.mockResolvedValue(makeTopic() as any);
    prismaMock.fullExamJobTopic.update.mockResolvedValue(makeTopic() as any);
    prismaMock.fullExamJob.update.mockResolvedValue({} as any);
  });

  it('sets job status to awaiting_review after all topics complete', async () => {
    await processFullExamJob('job-1', 'user-1', 'certification', 'AWS SAA-C03', null, [
      { topicName: 'S3', questionCount: 5 },
    ]);

    expect(prismaMock.fullExamJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'awaiting_review' }) }),
    );
  });

  it('stores pendingQuestionsJson in topic row with savedCount 0', async () => {
    await processFullExamJob('job-1', 'user-1', 'certification', 'AWS SAA-C03', null, [
      { topicName: 'S3', questionCount: 5 },
    ]);

    expect(prismaMock.fullExamJobTopic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'done',
          pendingQuestionsJson: expect.any(String),
          savedCount: 0,
        }),
      }),
    );
  });

  it('does not call createFromPayload during processing', async () => {
    await processFullExamJob('job-1', 'user-1', 'certification', 'AWS SAA-C03', null, [
      { topicName: 'S3', questionCount: 5 },
    ]);

    // The done-state topic update stores pendingQuestionsJson and savedCount 0
    const doneUpdate = prismaMock.fullExamJobTopic.update.mock.calls.find(
      (call) => call[0].data?.status === 'done',
    );
    expect(doneUpdate).toBeDefined();
    expect(doneUpdate![0].data.savedCount).toBe(0);
    expect(doneUpdate![0].data.pendingQuestionsJson).toBeTruthy();
  });

  it('increments doneTopics per topic without incrementing savedCount', async () => {
    await processFullExamJob('job-1', 'user-1', 'certification', 'AWS SAA-C03', null, [
      { topicName: 'S3', questionCount: 5 },
    ]);

    // The intermediate job update (per-topic) should only increment doneTopics
    const jobUpdates = prismaMock.fullExamJob.update.mock.calls;
    const perTopicUpdate = jobUpdates.find(
      (call) => call[0].data && 'doneTopics' in call[0].data && !('status' in call[0].data),
    );
    expect(perTopicUpdate).toBeDefined();
    expect(perTopicUpdate![0].data).not.toHaveProperty('savedCount');
  });
});
