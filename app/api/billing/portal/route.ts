import { NextResponse } from 'next/server';
import { lemonSqueezySetup, getSubscription } from '@lemonsqueezy/lemonsqueezy.js';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { lemonSqueezySubscriptionId: true },
  });

  if (!user.lemonSqueezySubscriptionId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  const { data, error } = await getSubscription(user.lemonSqueezySubscriptionId);

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }

  const portalUrl = data.data.attributes.urls?.customer_portal;

  if (!portalUrl) {
    return NextResponse.json({ error: 'Portal URL not available' }, { status: 500 });
  }

  return NextResponse.json({ url: portalUrl }, { status: 200 });
}
