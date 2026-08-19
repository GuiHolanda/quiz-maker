import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AiChatService } from '@/features/services/aiChat.service';
import { QuotaService } from '@/features/services/quota.service';
import { canEditExams } from '@/config/constants';
import { toApiErrorResponse } from '@/lib/api-error';

const aiChatService = new AiChatService();
const quotaService = new QuotaService();

// Headless counterpart to /api/ai/ai-chat used by the structured auto-config seed (identify
// + blueprint turns in useExamSeed.hook.ts) — same underlying service, but gated at `pro`+
// (not `pro_ai`-only like the conversational drawer) and metered against the auto_config
// quota instead of being unlimited. See plan §3/§4.
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!dbUser || !canEditExams(dbUser.plan)) {
    return NextResponse.json(
      { error: 'plan_required', code: 'plan_required', message: 'Auto-config requires the pro plan or higher' },
      { status: 403 }
    );
  }

  try {
    // Exam cap first: a user who can't save another exam must not spend an LLM call —
    // nor an auto_config unit — on a blueprint that has nowhere to land.
    await quotaService.check(session.user.id, 'create_exam', 1);
    await quotaService.checkAndRecordAutoConfig(session.user.id);

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
    console.error('Failed to run auto-config:', err);
    const { status, ...body } = toApiErrorResponse(err);

    return NextResponse.json(body, { status });
  }
}
