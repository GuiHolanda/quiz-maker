import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AiChatService } from '@/features/services/aiChat.service';
import { QuotaService } from '@/features/services/quota.service';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';

const aiChatService = new AiChatService();
const quotaService = new QuotaService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!dbUser || !AI_CHAT_ALLOWED_PLANS.includes(dbUser.plan)) {
    return NextResponse.json(
      { error: 'plan_required', message: 'AI chat requires pro_ai plan or higher' },
      { status: 403 }
    );
  }

  let logId: string | null = null;

  try {
    const body = await request.json().catch(() => null);
    const { messages, language } = aiChatService.validate(body);

    // Checked+recorded here, before the OpenAI call, so a concurrent second tab can't both
    // pass a stale check (achado 15) — mirrors checkAndRecordQuestions/AutoConfig. Rolled
    // back below only on a synchronous failure; a mid-stream interruption still consumes the
    // message, same as it already counts as cost incurred for metrics purposes.
    ({ logId } = await quotaService.checkAndRecordAiChatMessage(session.user.id));
    const stream = await aiChatService.streamChat(messages, language, logId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('Failed to stream chat:', err);

    if (logId) {
      try {
        await quotaService.rollbackQuota(logId);
      } catch (rbErr) {
        console.error('[ai-chat] rollbackQuota failed:', rbErr);
      }
    }

    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
