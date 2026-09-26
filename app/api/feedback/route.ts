import type { Feedback } from '@prisma/client';
import { after, NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { EmailService } from '@/features/services/email.service';
import { logApiError, toApiErrorResponse } from '@/lib/api-error';
import { logger, serializeError } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/rate-limit';

import { FeedbackService } from './feedback.service';

const service = new FeedbackService();

async function notifyTeam(feedback: Feedback) {
  try {
    const sent = await new EmailService().sendFeedbackAlert(feedback);

    if (sent) await service.markNotified(feedback.id);
  } catch (err) {
    logger.warn('feedback.submit.notify_failed', { feedbackId: feedback.id, ...serializeError(err) });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await enforceRateLimit('feedback_submit', userId);

    const body = await request.json().catch(() => null);

    if (body === null) throw Object.assign(new Error('Invalid JSON body'), { status: 400 });

    const feedback = await service.create(userId, body, request.headers.get('user-agent'));

    logger.info('feedback.created', { kind: 'feedback', id: feedback.id });
    after(() => notifyTeam(feedback));

    return NextResponse.json({ id: feedback.id }, { status: 201 });
  } catch (err) {
    logApiError('feedback.submit', err, { userId });

    const { status, ...errorBody } = toApiErrorResponse(err);

    return NextResponse.json(errorBody, { status });
  }
}
