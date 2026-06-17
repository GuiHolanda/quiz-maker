import crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  return crypto.timingSafeEqual(new Uint8Array(Buffer.from(hmac)), new Uint8Array(Buffer.from(signature)));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.meta?.event_name;
  const userId: string | undefined = payload.meta?.custom_data?.user_id;
  const subscriptionId: string | undefined = String(payload.data?.id);
  const customerId: string | undefined = String(payload.data?.attributes?.customer_id);
  const status: string | undefined = payload.data?.attributes?.status;

  if (!userId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    switch (eventName) {
      case 'subscription_created':
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'pro',
            subscriptionStatus: 'active',
            lemonSqueezySubscriptionId: subscriptionId,
            lemonSqueezyCustomerId: customerId,
          },
        });
        break;

      case 'subscription_updated':
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: status },
        });
        break;

      case 'subscription_cancelled':
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: 'canceled' },
        });
        break;

      case 'subscription_expired':
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'free',
            subscriptionStatus: null,
            lemonSqueezySubscriptionId: null,
            questionsGeneratedThisPeriod: 0,
          },
        });
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
