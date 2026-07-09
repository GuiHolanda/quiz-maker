import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import type { UserPlan } from '@/shared/types';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' });

function resolvePlanFromPriceId(priceId: string | undefined): UserPlan {
  const proAiPrices = [
    process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY,
    process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY,
  ].filter(Boolean);

  return proAiPrices.includes(priceId) ? 'pro_ai' : 'pro';
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: resolvePlanFromPriceId(priceId),
            subscriptionStatus: 'active',
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId ?? null,
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;

        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
            plan: resolvePlanFromPriceId(priceId),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: 'free',
            subscriptionStatus: null,
            stripeSubscriptionId: null,
            questionsGeneratedThisPeriod: 0,
          },
        });
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
