import { after, NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { EmailService } from '@/features/services/email.service';
import { logApiError, toApiErrorResponse } from '@/lib/api-error';
import { logger, serializeError } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/rate-limit';

import { QuestionReportService, type CreateQuestionReportResult } from './question-report.service';

const service = new QuestionReportService();

async function notifyTeam({ report, reopened, reporter }: CreateQuestionReportResult) {
  try {
    const sent = await new EmailService().sendQuestionReportAlert({ report, reopened, reporter });

    if (sent) await service.markNotified(report.id);
  } catch (err) {
    logger.warn('feedback.question_report.notify_failed', { reportId: report.id, ...serializeError(err) });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await enforceRateLimit('question_report', userId);

    const body = await request.json().catch(() => null);

    if (body === null) throw Object.assign(new Error('Invalid JSON body'), { status: 400 });

    const result = await service.create(userId, body);

    logger.info('feedback.created', { kind: 'question_report', id: result.report.id, reopened: result.reopened });
    after(() => notifyTeam(result));

    const { id, status, createdAt } = result.report;

    return NextResponse.json({ id, status, createdAt }, { status: result.reopened ? 200 : 201 });
  } catch (err) {
    logApiError('feedback.question_report', err, { userId });

    const { status, ...errorBody } = toApiErrorResponse(err);

    return NextResponse.json(errorBody, { status });
  }
}
