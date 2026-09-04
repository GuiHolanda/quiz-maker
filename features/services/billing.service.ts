import Stripe from 'stripe';

import type {
  BillingDetails,
  BillingInvoice,
  BillingProfile,
  PaymentMethodInfo,
  SubscriptionInfo,
  UpcomingInvoiceInfo,
} from '@/shared/types';

import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-06-24.dahlia' });

type CancelReason = 'passed' | 'price' | 'usage' | 'quality' | 'other';

const FEEDBACK_BY_REASON: Record<CancelReason, Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback> = {
  passed: 'other',
  price: 'too_expensive',
  usage: 'unused',
  quality: 'low_quality',
  other: 'other',
};

export class BillingService {
  async getBillingDetails(userId: string): Promise<BillingDetails | null> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true, stripeSubscriptionId: true },
    });

    if (!user.stripeCustomerId) return null;

    const customerId = user.stripeCustomerId;
    const subscriptionId = user.stripeSubscriptionId;

    // Stripe reads fail soft — a missing customer is the only hard stop, so a transient
    // Stripe error degrades one field instead of blanking the whole billing page.
    const [customer, subscription, invoiceList] = await Promise.all([
      stripe.customers.retrieve(customerId, { expand: ['invoice_settings.default_payment_method'] }).catch(() => null),
      subscriptionId
        ? stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] }).catch(() => null)
        : Promise.resolve(null),
      stripe.invoices.list({ customer: customerId, limit: 12 }).catch(() => ({ data: [] as Stripe.Invoice[] })),
    ]);

    if (!customer || customer.deleted) return null;

    const [paymentMethod, taxId] = await Promise.all([
      this.resolvePaymentMethod(customer, subscription),
      this.resolveTaxId(customerId),
    ]);

    return {
      paymentMethod,
      profile: this.buildProfile(customer, customerId, taxId),
      subscription: subscription ? this.buildSubscription(subscription) : null,
      upcomingInvoice: await this.resolveUpcomingInvoice(customerId, subscription),
      invoices: invoiceList.data.map((invoice) => this.buildInvoice(invoice)),
    };
  }

  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user.stripeSubscriptionId) {
      throw Object.assign(new Error('No active subscription to cancel'), { status: 404 });
    }

    const normalized = reason as CancelReason | undefined;
    const feedback = normalized && normalized in FEEDBACK_BY_REASON ? FEEDBACK_BY_REASON[normalized] : undefined;

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
      ...(reason && { cancellation_details: { comment: `in-app: ${reason}`, feedback } }),
    });
  }

  private async resolvePaymentMethod(
    customer: Stripe.Customer,
    subscription: Stripe.Subscription | null
  ): Promise<PaymentMethodInfo | null> {
    const fromCustomer = customer.invoice_settings?.default_payment_method;

    if (fromCustomer && typeof fromCustomer !== 'string' && fromCustomer.card) {
      return this.methodToInfo(fromCustomer);
    }

    const fromSubscription = subscription?.default_payment_method;

    if (fromSubscription && typeof fromSubscription !== 'string' && fromSubscription.card) {
      return this.methodToInfo(fromSubscription);
    }

    try {
      const methods = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 });
      const method = methods.data[0];

      return method?.card ? this.methodToInfo(method) : null;
    } catch {
      return null;
    }
  }

  private methodToInfo(method: Stripe.PaymentMethod): PaymentMethodInfo | null {
    const card = method.card;

    if (!card) return null;

    return {
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      holder: method.billing_details?.name ?? null,
    };
  }

  private async resolveTaxId(customerId: string): Promise<string | null> {
    try {
      const taxIds = await stripe.customers.listTaxIds(customerId, { limit: 1 });

      return taxIds.data[0]?.value ?? null;
    } catch {
      return null;
    }
  }

  private buildProfile(customer: Stripe.Customer, customerId: string, taxId: string | null): BillingProfile {
    return {
      customerId,
      email: customer.email ?? null,
      name: customer.name ?? null,
      address: this.formatAddress(customer.address ?? null),
      taxId,
    };
  }

  private formatAddress(address: Stripe.Address | null): string | null {
    if (!address) return null;

    const street = [address.line1, address.line2].filter(Boolean).join(', ');
    const locality = [address.city, address.state].filter(Boolean).join(', ');
    const segments = [street, locality, address.postal_code].filter(Boolean);

    return segments.length ? segments.join(' · ') : null;
  }

  private buildSubscription(subscription: Stripe.Subscription): SubscriptionInfo {
    const item = subscription.items.data[0];
    const price = item?.price;
    const recurring = price && typeof price !== 'string' ? price.recurring : null;

    return {
      status: subscription.status,
      interval: recurring?.interval === 'year' || recurring?.interval === 'month' ? recurring.interval : null,
      amount: price && typeof price !== 'string' ? price.unit_amount : null,
      currency: (price && typeof price !== 'string' ? price.currency : null) ?? 'brl',
      startedAt: subscription.created ? new Date(subscription.created * 1000).toISOString() : null,
      currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  private async resolveUpcomingInvoice(
    customerId: string,
    subscription: Stripe.Subscription | null
  ): Promise<UpcomingInvoiceInfo | null> {
    if (!subscription || subscription.status !== 'active' || subscription.cancel_at_period_end) return null;

    const periodEnd = subscription.items.data[0]?.current_period_end;
    const fallbackDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

    try {
      const preview = await stripe.invoices.createPreview({ customer: customerId, subscription: subscription.id });

      return {
        amount: preview.amount_due,
        currency: preview.currency,
        date: preview.next_payment_attempt ? new Date(preview.next_payment_attempt * 1000).toISOString() : fallbackDate,
      };
    } catch {
      const price = subscription.items.data[0]?.price;
      const amount = price && typeof price !== 'string' ? price.unit_amount : null;

      if (amount == null) return null;

      return {
        amount,
        currency: (price && typeof price !== 'string' ? price.currency : null) ?? 'brl',
        date: fallbackDate,
      };
    }
  }

  private buildInvoice(invoice: Stripe.Invoice): BillingInvoice {
    const paidAmount = invoice.amount_paid || invoice.amount_due || invoice.total;

    return {
      id: invoice.id ?? invoice.number ?? String(invoice.created),
      date: new Date(invoice.created * 1000).toISOString(),
      description: invoice.lines.data[0]?.description ?? invoice.description ?? null,
      amount: paidAmount,
      currency: invoice.currency,
      status: invoice.status ?? 'open',
      pdfUrl: invoice.invoice_pdf ?? null,
      hostedUrl: invoice.hosted_invoice_url ?? null,
    };
  }
}
