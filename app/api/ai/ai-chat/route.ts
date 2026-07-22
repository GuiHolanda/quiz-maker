import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { UserPlan } from '@/shared/types';
import { AiChatService } from '@/features/services/aiChat.service';
import { toApiErrorResponse } from '@/lib/api-error';

const aiChatService = new AiChatService();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const aiAllowedPlans: UserPlan[] = ['pro_ai', 'tester', 'admin'];

  if (!dbUser || !aiAllowedPlans.includes(dbUser.plan as UserPlan)) {
    return NextResponse.json(
      { error: 'plan_required', message: 'AI chat requires pro_ai plan or higher' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const { messages, language } = aiChatService.validate(body);
    const stream = await aiChatService.streamChat(messages, language);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    console.error('Failed to stream chat:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
