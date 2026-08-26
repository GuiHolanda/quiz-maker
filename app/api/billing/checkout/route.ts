import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { toApiErrorResponse } from '@/lib/api-error';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' });

function resolvePriceId(product: 'pro' | 'pro_ai' | 'sprint', billingPeriod: 'monthly' | 'yearly'): string {
  const envVar =
    product === 'sprint'
      ? 'STRIPE_PRICE_ID_SPRINT'
      : product === 'pro_ai'
        ? billingPeriod === 'yearly'
          ? 'STRIPE_PRICE_ID_PRO_AI_YEARLY'
          : 'STRIPE_PRICE_ID_PRO_AI_MONTHLY'
        : billingPeriod === 'yearly'
          ? 'STRIPE_PRICE_ID_PRO_YEARLY'
          : 'STRIPE_PRICE_ID_PRO_MONTHLY';

  const priceId = process.env[envVar];

  if (!priceId) {
    throw Object.assign(new Error(`Stripe checkout misconfigured: missing env var ${envVar}`), { status: 500 });
  }

  return priceId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawProduct = searchParams.get('product');
    const product = rawProduct === 'pro_ai' ? 'pro_ai' : rawProduct === 'sprint' ? 'sprint' : 'pro';
    const billingPeriod = searchParams.get('period') === 'yearly' ? 'yearly' : 'monthly';

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { email: true, stripeCustomerId: true },
    });

    const priceId = resolvePriceId(product, billingPeriod);

    // Sprint is a 90-day, one-time payment — no billing period, no recurring subscription.
    // The webhook (checkout.session.completed, mode: 'payment') sets plan + sprintExpiresAt
    // directly instead of going through the subscription lifecycle.
    const checkoutParams: Stripe.Checkout.SessionCreateParams =
      product === 'sprint'
        ? {
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { user_id: session.user.id, product: 'sprint' },
            success_url: `${process.env.AUTH_URL}/billing?upgraded=true`,
            cancel_url: `${process.env.AUTH_URL}/pricing`,
            allow_promotion_codes: true,
          }
        : {
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { user_id: session.user.id },
            success_url: `${process.env.AUTH_URL}/billing?upgraded=true`,
            cancel_url: `${process.env.AUTH_URL}/pricing`,
            allow_promotion_codes: true,
          };

    if (user.stripeCustomerId) {
      checkoutParams.customer = user.stripeCustomerId;
    } else if (user.email) {
      checkoutParams.customer_email = user.email;
    }

    const stripeSession = await stripe.checkout.sessions.create(checkoutParams);

    if (!stripeSession.url) {
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    return NextResponse.json({ url: stripeSession.url }, { status: 200 });
  } catch (err: unknown) {
    console.error('Failed to create checkout session:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
