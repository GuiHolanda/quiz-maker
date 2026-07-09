import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' });

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const billingPeriod = searchParams.get('period') === 'yearly' ? 'yearly' : 'monthly';
  const product = searchParams.get('product') === 'pro_ai' ? 'pro_ai' : 'pro';

  let priceId: string;

  if (product === 'pro_ai') {
    priceId =
      billingPeriod === 'yearly'
        ? process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY!
        : process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY!;
  } else {
    priceId =
      billingPeriod === 'yearly'
        ? process.env.STRIPE_PRICE_ID_PRO_YEARLY!
        : process.env.STRIPE_PRICE_ID_PRO_MONTHLY!;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });

  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: session.user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
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
}
