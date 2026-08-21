import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/config/constants';
import type { UserPlan } from '@/shared/types';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' });

function resolvePlanFromPriceId(priceId: string | undefined): UserPlan {
  const proAiPrices = [process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY, process.env.STRIPE_PRICE_ID_PRO_AI_YEARLY].filter(
    Boolean
  );

  return proAiPrices.includes(priceId) ? 'pro_ai' : 'pro';
}

// achado 11 (pricing tier audit): a plan change only deserves a fresh 30-day window when it
// actually raises the questions/period ceiling — otherwise a routine subscription.updated
// (payment retry, cancel_at_period_end toggle) or a downgrade would reset the counter for
// free. Compares PLAN_LIMITS, not customQuotaOverride, since this is about the tier just
// purchased, not any admin/referral adjustment layered on top. An unrecognized old plan
// counts as zero capacity so any real paid tier still reads as an upgrade.
function isCapacityUpgrade(oldPlan: string, newPlan: UserPlan): boolean {
  const oldLimit = PLAN_LIMITS[oldPlan as UserPlan]?.questionsPerPeriod ?? 0;
  const newLimit = PLAN_LIMITS[newPlan].questionsPerPeriod;

  return newLimit > oldLimit;
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

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

        // Sprint is the only one-time (mode: 'payment') product — no Stripe subscription
        // exists for this session, so access is time-boxed via sprintExpiresAt instead of
        // the subscription lifecycle events below. customer.subscription.deleted never
        // fires for these users since stripeSubscriptionId stays null.
        if (session.mode === 'payment') {
          const sprintExpiresAt = new Date();
          sprintExpiresAt.setDate(sprintExpiresAt.getDate() + 90);

          await prisma.user.update({
            where: { id: userId },
            data: { plan: 'sprint', sprintExpiresAt, stripeCustomerId: customerId ?? null },
          });
          break;
        }

        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        // This event only ever fires from the "Fazer upgrade" flow (BillingOverview.tsx
        // hides that CTA once the user already has a subscription), so it always represents
        // a brand-new paid period starting right now — reset unconditionally instead of
        // leaving the counter/window tied to whatever was running before (achado 11).
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: resolvePlanFromPriceId(priceId),
            subscriptionStatus: 'active',
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId ?? null,
            questionsGeneratedThisPeriod: 0,
            periodStartDate: new Date(),
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const newPlan = resolvePlanFromPriceId(priceId);

        // Existing subscribers change plans through the Stripe customer portal
        // (BillingOverview.tsx's "Mudar plano"), which updates the subscription in place
        // instead of creating a new checkout session — so this is where a real Pro→Pro AI
        // upgrade actually lands, not checkout.session.completed above.
        const existing = await prisma.user.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { plan: true },
        });
        const shouldResetPeriod = !!existing && isCapacityUpgrade(existing.plan, newPlan);

        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
            plan: newPlan,
            ...(shouldResetPeriod && { questionsGeneratedThisPeriod: 0, periodStartDate: new Date() }),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // achado 12: cancellation used to zero the counter here too, which combined with
        // achado 11's old behavior turned cancel+resubscribe into free quota. Usage now
        // rides out the rest of its natural 30-day window via getUserWithPeriodReset
        // instead — cancelling doesn't grant a reset.
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: 'free',
            subscriptionStatus: null,
            stripeSubscriptionId: null,
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
