import { vi } from 'vitest';

const stripeMock = vi.hoisted(() => ({
  customers: { retrieve: vi.fn(), listTaxIds: vi.fn() },
  subscriptions: { retrieve: vi.fn(), update: vi.fn() },
  invoices: { list: vi.fn(), createPreview: vi.fn() },
  paymentMethods: { list: vi.fn() },
  checkout: { sessions: { retrieve: vi.fn() } },
}));

vi.mock('stripe', () => ({
  default: vi.fn(function () {
    return stripeMock;
  }),
}));

import { prismaMock } from '../__mocks__/prisma';
import { BillingService } from '@/features/services/billing/billing.service';

function stripeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cus_123',
    deleted: false,
    email: 'marina@example.com',
    name: 'Marina Alves',
    address: { line1: 'Rua A, 1', line2: null, city: 'São Paulo', state: 'SP', postal_code: '01000-000' },
    invoice_settings: {
      default_payment_method: {
        card: { brand: 'visa', last4: '4242', exp_month: 7, exp_year: 2029 },
        billing_details: { name: 'Marina Alves' },
      },
    },
    ...overrides,
  };
}

function stripeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    created: 1_700_000_000,
    cancel_at_period_end: false,
    default_payment_method: null,
    items: {
      data: [
        {
          current_period_end: 1_760_000_000,
          price: { id: 'price_pro_monthly', unit_amount: 2990, currency: 'brl', recurring: { interval: 'month' } },
        },
      ],
    },
    ...overrides,
  };
}

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
    stripeMock.customers.retrieve.mockReset();
    stripeMock.customers.listTaxIds.mockReset().mockResolvedValue({ data: [] });
    stripeMock.subscriptions.retrieve.mockReset();
    stripeMock.subscriptions.update.mockReset().mockResolvedValue({});
    stripeMock.invoices.list.mockReset().mockResolvedValue({ data: [] });
    stripeMock.invoices.createPreview.mockReset();
    stripeMock.paymentMethods.list.mockReset().mockResolvedValue({ data: [] });
    stripeMock.checkout.sessions.retrieve.mockReset();
  });

  describe('getBillingDetails', () => {
    it('returns null and skips Stripe when the user has no customer id', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      } as never);

      const result = await service.getBillingDetails('user-1');

      expect(result).toBeNull();
      expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
    });

    it('maps the Stripe payload into the BillingDetails shape', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      } as never);
      stripeMock.customers.retrieve.mockResolvedValue(stripeCustomer());
      stripeMock.customers.listTaxIds.mockResolvedValue({ data: [{ value: '123.456.789-00' }] });
      stripeMock.subscriptions.retrieve.mockResolvedValue(stripeSubscription());
      stripeMock.invoices.createPreview.mockResolvedValue({
        amount_due: 2990,
        currency: 'brl',
        next_payment_attempt: 1_760_000_000,
      });
      stripeMock.invoices.list.mockResolvedValue({
        data: [
          {
            id: 'in_1',
            created: 1_755_000_000,
            amount_paid: 2990,
            amount_due: 2990,
            total: 2990,
            currency: 'brl',
            status: 'paid',
            invoice_pdf: 'https://pdf',
            hosted_invoice_url: 'https://hosted',
            lines: { data: [{ description: '1 × Pro (at R$ 29.90 / month)' }] },
          },
        ],
      });

      const result = await service.getBillingDetails('user-1');

      expect(result).toEqual({
        paymentMethod: { brand: 'visa', last4: '4242', expMonth: 7, expYear: 2029, holder: 'Marina Alves' },
        profile: {
          customerId: 'cus_123',
          email: 'marina@example.com',
          name: 'Marina Alves',
          address: 'Rua A, 1 · São Paulo, SP · 01000-000',
          taxId: '123.456.789-00',
        },
        subscription: {
          status: 'active',
          plan: 'pro',
          interval: 'month',
          amount: 2990,
          currency: 'brl',
          startedAt: new Date(1_700_000_000 * 1000).toISOString(),
          currentPeriodEnd: new Date(1_760_000_000 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        },
        upcomingInvoice: {
          amount: 2990,
          currency: 'brl',
          date: new Date(1_760_000_000 * 1000).toISOString(),
        },
        invoices: [
          {
            id: 'in_1',
            date: new Date(1_755_000_000 * 1000).toISOString(),
            description: 'Pro',
            amount: 2990,
            currency: 'brl',
            status: 'paid',
            pdfUrl: 'https://pdf',
            hostedUrl: 'https://hosted',
          },
        ],
      });
    });

    it('RN-05: reports the plan the subscription price grants, so the billing page can tell a pending webhook apart', async () => {
      const originalProAiMonthly = process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY;

      process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY = 'price_ai_monthly';
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      } as never);
      stripeMock.customers.retrieve.mockResolvedValue(stripeCustomer());
      stripeMock.subscriptions.retrieve.mockResolvedValue(
        stripeSubscription({
          items: {
            data: [
              {
                current_period_end: 1_760_000_000,
                price: { id: 'price_ai_monthly', unit_amount: 5990, currency: 'brl', recurring: { interval: 'month' } },
              },
            ],
          },
        })
      );

      const result = await service.getBillingDetails('user-1');

      if (originalProAiMonthly === undefined) delete process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY;
      else process.env.STRIPE_PRICE_ID_PRO_AI_MONTHLY = originalProAiMonthly;

      expect(result?.subscription?.plan).toBe('pro_ai');
    });

    it('RN-05: reports free for a canceled subscription, matching what the deletion webhook records', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      } as never);
      stripeMock.customers.retrieve.mockResolvedValue(stripeCustomer());
      stripeMock.subscriptions.retrieve.mockResolvedValue(stripeSubscription({ status: 'canceled' }));

      const result = await service.getBillingDetails('user-1');

      expect(result?.subscription?.plan).toBe('free');
    });

    it('degrades to subscription: null when the Stripe subscription read fails', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      } as never);
      stripeMock.customers.retrieve.mockResolvedValue(stripeCustomer());
      stripeMock.subscriptions.retrieve.mockRejectedValue(new Error('stripe down'));

      const result = await service.getBillingDetails('user-1');

      expect(result).not.toBeNull();
      expect(result?.subscription).toBeNull();
      expect(result?.profile.customerId).toBe('cus_123');
    });

    it('does not preview an upcoming invoice for a subscription set to cancel', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
      } as never);
      stripeMock.customers.retrieve.mockResolvedValue(stripeCustomer());
      stripeMock.subscriptions.retrieve.mockResolvedValue(stripeSubscription({ cancel_at_period_end: true }));

      const result = await service.getBillingDetails('user-1');

      expect(result?.upcomingInvoice).toBeNull();
      expect(stripeMock.invoices.createPreview).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('throws 404 when there is no subscription to cancel', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: null } as never);

      await expect(service.cancelSubscription('user-1')).rejects.toMatchObject({ status: 404 });
      expect(stripeMock.subscriptions.update).not.toHaveBeenCalled();
    });

    it('flags the subscription to cancel at period end and maps the reason to Stripe feedback', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: 'sub_123' } as never);

      await service.cancelSubscription('user-1', 'price');

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
        cancellation_details: { comment: 'in-app: price', feedback: 'too_expensive' },
      });
    });
  });

  describe('isCheckoutProcessed', () => {
    const SESSION_CREATED = 1_760_000_000;
    const DAY_MS = 24 * 60 * 60 * 1000;

    function checkoutSession(overrides: Record<string, unknown> = {}) {
      return {
        id: 'cs_123',
        mode: 'subscription',
        created: SESSION_CREATED,
        subscription: 'sub_new',
        metadata: { user_id: 'user-1' },
        ...overrides,
      };
    }

    it('RN-03: rejects a checkout session that belongs to another user', async () => {
      stripeMock.checkout.sessions.retrieve.mockResolvedValue(checkoutSession({ metadata: { user_id: 'user-2' } }));

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).rejects.toMatchObject({ status: 404 });
      expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('RN-03: rejects a checkout session Stripe does not know', async () => {
      stripeMock.checkout.sessions.retrieve.mockRejectedValue(
        Object.assign(new Error('No such checkout.session'), { code: 'resource_missing' })
      );

      await expect(service.isCheckoutProcessed('user-1', 'cs_missing')).rejects.toMatchObject({ status: 404 });
    });

    it('RN-03: surfaces any other Stripe failure instead of calling the session unknown', async () => {
      stripeMock.checkout.sessions.retrieve.mockRejectedValue(new Error('stripe down'));

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).rejects.toThrow('stripe down');
    });

    it('RN-03: a subscription checkout is processed once the webhook recorded that subscription', async () => {
      stripeMock.checkout.sessions.retrieve.mockResolvedValue(checkoutSession());
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        plan: 'pro',
        stripeSubscriptionId: 'sub_new',
        sprintExpiresAt: null,
      } as never);

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).resolves.toBe(true);
    });

    it('RN-03: a subscription checkout is not processed while the user already held the purchased plan without it', async () => {
      stripeMock.checkout.sessions.retrieve.mockResolvedValue(checkoutSession());
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        plan: 'pro',
        stripeSubscriptionId: null,
        sprintExpiresAt: null,
      } as never);

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).resolves.toBe(false);
    });

    it('RN-03: a Sprint checkout is processed once the webhook set an expiry counted from after the session', async () => {
      stripeMock.checkout.sessions.retrieve.mockResolvedValue(
        checkoutSession({ mode: 'payment', subscription: null })
      );
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        plan: 'sprint',
        stripeSubscriptionId: null,
        sprintExpiresAt: new Date(SESSION_CREATED * 1000 + 90 * DAY_MS + 60_000),
      } as never);

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).resolves.toBe(true);
    });

    it('RN-03: an earlier Sprint does not count as this Sprint checkout being processed', async () => {
      stripeMock.checkout.sessions.retrieve.mockResolvedValue(
        checkoutSession({ mode: 'payment', subscription: null })
      );
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        plan: 'sprint',
        stripeSubscriptionId: null,
        sprintExpiresAt: new Date(SESSION_CREATED * 1000 + 89 * DAY_MS),
      } as never);

      await expect(service.isCheckoutProcessed('user-1', 'cs_123')).resolves.toBe(false);
    });
  });
});
