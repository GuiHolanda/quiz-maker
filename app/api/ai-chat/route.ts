import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AiChatService } from './aiChat.service';

const aiChatService = new AiChatService();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const { messages, language } = aiChatService.validate(body);
    const stream = await aiChatService.streamChat(messages, language);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Failed to stream chat:', err);
    return NextResponse.json(
      { error: err, message: err.message || 'Failed to stream chat' },
      { status: err.status || 500 }
    );
  }
}
