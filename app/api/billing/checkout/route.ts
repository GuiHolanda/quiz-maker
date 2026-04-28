import { NextRequest, NextResponse } from 'next/server';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const billingPeriod = searchParams.get('period') === 'yearly' ? 'yearly' : 'monthly';

  const variantId =
    billingPeriod === 'yearly'
      ? process.env.LEMONSQUEEZY_PRODUCT_VARIANT_ID_YEARLY!
      : process.env.LEMONSQUEEZY_PRODUCT_VARIANT_ID_MONTHLY!;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  const { data, error } = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: { embed: false },
      checkoutData: {
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        custom: { user_id: session.user.id },
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?upgraded=true`,
        receiptButtonText: 'Go to Dashboard',
      },
    }
  );

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }

  return NextResponse.json({ url: data.data.attributes.url }, { status: 200 });
}
