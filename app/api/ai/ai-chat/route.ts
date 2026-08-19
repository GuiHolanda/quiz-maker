import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AiChatService } from '@/features/services/aiChat.service';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';
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

  if (!dbUser || !AI_CHAT_ALLOWED_PLANS.includes(dbUser.plan)) {
    return NextResponse.json(
      { error: 'plan_required', message: 'AI chat requires pro_ai plan or higher' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const { messages, language } = aiChatService.validate(body);
    const stream = await aiChatService.streamChat(session.user.id, messages, language);

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
