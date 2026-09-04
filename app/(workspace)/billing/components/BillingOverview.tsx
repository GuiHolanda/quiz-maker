'use client';

import type { ReactNode } from 'react';
import type { BillingDetails, UsageStats } from '@/shared/types';
import type { StatusTone } from '@/shared/components/ui/tone';

import { Button } from '@heroui/button';
import { Skeleton } from '@heroui/skeleton';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { CurrentPlanCard } from '@/app/(workspace)/billing/components/CurrentPlanCard';
import { PaymentMethodCard } from '@/app/(workspace)/billing/components/PaymentMethodCard';
import { EmptyBillingCard } from '@/app/(workspace)/billing/components/EmptyBillingCard';
import { NextChargeCard } from '@/app/(workspace)/billing/components/NextChargeCard';
import { PlanSwitcher } from '@/app/(workspace)/billing/components/PlanSwitcher';
import { BillingHistoryTable } from '@/app/(workspace)/billing/components/BillingHistoryTable';
import { ReferralCard } from '@/app/(workspace)/billing/components/ReferralCard';
import { CancelSubscriptionPanel } from '@/app/(workspace)/billing/components/CancelSubscriptionPanel';
import { formatDate, formatMoney, formatShortDate } from '@/app/(workspace)/billing/components/billingFormat';
import { getBillingDetails, getBillingUsage, getPortalUrl } from '@/features/connectors';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { notify } from '@/shared/lib/notify';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { PLAN_LIMITS } from '@/config/constants';

function questionsCeiling(plan: string): number {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.questionsPerPeriod ?? 0;
}

export function BillingOverview() {
  const { t, language } = useTranslation();
  const { data: session, status, update: updateSession } = useSession();
  const { refreshUsage } = useUsageContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [detailsSettled, setDetailsSettled] = useState(false);
  const [portalLoadingKey, setPortalLoadingKey] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const toastFiredRef = useRef(false);
  const reconciledRef = useRef(false);
  const isUpgradeFlow = searchParams.get('upgraded') === 'true';
  const isSyncFlow = searchParams.get('synced') === '1';
  const isReconcileFlow = isUpgradeFlow || isSyncFlow;

  async function loadDetails(hasCustomer: boolean) {
    if (!hasCustomer) {
      setDetails(null);
      setDetailsSettled(true);
      return;
    }

    try {
      setDetails(await getBillingDetails());
    } catch {
      setDetails(null);
    } finally {
      setDetailsSettled(true);
    }
  }

  async function refetchAll() {
    const fresh = await getBillingUsage();

    setUsage(fresh);
    await loadDetails(fresh.hasStripePortalAccess);
  }

  useEffect(() => {
    if (isReconcileFlow) return;

    let cancelled = false;

    getBillingUsage().then((data) => {
      if (cancelled) return;
      setUsage(data);

      if (!data.hasStripePortalAccess) {
        setDetailsSettled(true);
        return;
      }

      getBillingDetails()
        .then((d) => {
          if (!cancelled) setDetails(d);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setDetailsSettled(true);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [isReconcileFlow]);

  useEffect(() => {
    if (!isReconcileFlow || reconciledRef.current || status !== 'authenticated') return;
    reconciledRef.current = true;

    let cancelled = false;
    setIsReconciling(true);

    async function reconcilePlan() {
      const tokenPlan = session?.user?.plan;
      let data = await getBillingUsage();

      if (cancelled) return;
      setUsage(data);

      const baseline = data.plan;
      let attempts = 0;

      while (attempts < 20 && !cancelled && data.plan === baseline && data.plan === tokenPlan) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        data = await getBillingUsage();

        if (cancelled) return;
        setUsage(data);
        attempts++;
      }

      if (cancelled) return;
      setIsReconciling(false);

      await loadDetails(data.hasStripePortalAccess);

      if (data.plan === baseline) {
        setPollTimedOut(true);
        return;
      }

      await updateSession();
      refreshUsage();
      router.refresh();

      if (!toastFiredRef.current) {
        toastFiredRef.current = true;
        if (isUpgradeFlow) {
          notify.success(t('billing.toast.upgraded'), t('billing.toast.upgradedDescription'));
        } else if (isSyncFlow && questionsCeiling(data.plan) > questionsCeiling(baseline)) {
          notify.success(t('billing.toast.planUpdated'), t('billing.toast.planUpdatedDescription'));
        }
      }
    }

    reconcilePlan();

    return () => {
      cancelled = true;
      setIsReconciling(false);
    };
  }, [isReconcileFlow, status, retryCount]);

  if (!usage) return null;

  const resetDate = new Date(usage.periodStartDate);

  resetDate.setDate(resetDate.getDate() + 30);
  const resetIso = resetDate.toISOString();
  const resetLabel = formatDate(resetIso, language);

  const isSprint = usage.plan === 'sprint';
  const subscription = details?.subscription ?? null;
  const hasStripeCustomer = usage.hasStripePortalAccess;
  const hasActiveSubscription = !!subscription && subscription.status === 'active' && !subscription.cancelAtPeriodEnd;

  const PLAN_LABEL_KEY: Record<string, string> = {
    pro_ai: 'billing.planProAi',
    pro: 'billing.planPro',
    sprint: 'billing.planSprint',
    tester: 'billing.planTester',
    admin: 'billing.planAdmin',
    free: 'billing.planFree',
  };
  const planLabel = t(PLAN_LABEL_KEY[usage.plan] ?? 'billing.planFree');
  const isInternalPlan = usage.plan === 'tester' || usage.plan === 'admin';

  const meters = [
    {
      label: t('billing.meter.questions'),
      used: usage.questionsUsed,
      limit: usage.questionsLimit,
      note: t('billing.meter.questionsNote'),
    },
    {
      label: t('billing.meter.exams'),
      used: usage.examsUsed,
      limit: usage.examsLimit,
      note: t('billing.meter.examsNote'),
    },
    ...(usage.autoConfigLimit !== 0
      ? [
          {
            label: t('billing.meter.autoConfig'),
            used: usage.autoConfigUsed,
            limit: usage.autoConfigLimit,
            note: t('billing.meter.autoConfigNote'),
          },
        ]
      : []),
    ...(usage.aiChatLimit !== 0
      ? [
          {
            label: t('billing.meter.aiChat'),
            used: usage.aiChatUsed,
            limit: usage.aiChatLimit,
            note: t('billing.meter.aiChatNote'),
          },
        ]
      : []),
  ];

  const statusInfo = resolveStatus();
  const accessUntilNote = subscription?.currentPeriodEnd
    ? t('billing.cancel.rowNote', { date: formatDate(subscription.currentPeriodEnd, language) })
    : t('billing.cancel.rowNoteGeneric');

  function resolveStatus(): { label: string; tone: StatusTone } | null {
    if (!subscription) return null;
    if (subscription.cancelAtPeriodEnd) return { label: t('billing.status.canceled'), tone: 'error' };
    if (subscription.status === 'active') return { label: t('billing.status.active'), tone: 'ok' };
    if (['past_due', 'unpaid', 'incomplete'].includes(subscription.status)) {
      return { label: t('billing.status.pastDue'), tone: 'busy' };
    }

    return { label: subscription.status, tone: 'busy' };
  }

  function renderRenewalNote(): ReactNode {
    if (isInternalPlan) return t('billing.internalPlanNote');

    if (isSprint && usage!.sprintExpiresAt) {
      return t('billing.sprintExpiresOn', { date: formatDate(usage!.sprintExpiresAt, language) });
    }

    if (subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
      return t('billing.canceledAccessUntil', { date: formatDate(subscription.currentPeriodEnd, language) });
    }

    if (subscription && subscription.currentPeriodEnd) {
      const renews = t('billing.renewsOn', { date: formatDate(subscription.currentPeriodEnd, language) });
      const since = subscription.startedAt
        ? ` ${t('billing.memberSince', { date: formatDate(subscription.startedAt, language) })}`
        : '';

      return `${renews}${since}`;
    }

    return t('billing.periodResetsOn', { date: resetLabel });
  }

  function priceLabel(): string {
    if (!subscription || subscription.amount == null) return '';

    return formatMoney(subscription.amount, subscription.currency, language);
  }

  function cycleNote(): string {
    if (!subscription) return '';

    return subscription.interval === 'year' ? t('billing.cycleYearly') : t('billing.cycleMonthly');
  }

  function scrollToPlans() {
    document.getElementById('billing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handlePortal(key: string) {
    setPortalLoadingKey(key);
    try {
      window.location.href = await getPortalUrl();
    } catch {
      notify.error(t('toast.error'), t('toast.somethingWrong'));
      setPortalLoadingKey(null);
    }
  }

  function handleRetry() {
    setPollTimedOut(false);
    toastFiredRef.current = false;
    reconciledRef.current = false;
    setRetryCount((c) => c + 1);
  }

  const planCard = (
    <CurrentPlanCard
      cycleNote={cycleNote()}
      isPortalLoading={portalLoadingKey === 'portal'}
      meters={meters}
      onPortal={() => handlePortal('portal')}
      onUpgrade={scrollToPlans}
      periodLabel={t('billing.usagePeriod', {
        start: formatShortDate(usage.periodStartDate, language),
        end: formatShortDate(resetIso, language),
      })}
      planLabel={planLabel}
      price={priceLabel()}
      renewalNote={renderRenewalNote()}
      showPortal={hasStripeCustomer}
      showUpgrade={usage.plan === 'free' || usage.plan === 'pro'}
      statusLabel={statusInfo?.label ?? null}
      statusTone={statusInfo?.tone ?? 'ok'}
    />
  );

  return (
    <div className="flex flex-col gap-8">
      {renderReconcileBanner()}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-stretch">
        {planCard}
        <div className="flex flex-col gap-5">
          {!detailsSettled && usage.hasStripePortalAccess ? (
            <Skeleton className="h-full min-h-72 w-full rounded-xl" />
          ) : details ? (
            <>
              <PaymentMethodCard
                className="flex-1"
                isPortalLoading={portalLoadingKey === 'portal'}
                onManage={() => handlePortal('portal')}
                paymentMethod={details.paymentMethod}
                profile={details.profile}
              />
              {details.upcomingInvoice && (
                <NextChargeCard paymentMethod={details.paymentMethod} upcoming={details.upcomingInvoice} />
              )}
            </>
          ) : (
            <EmptyBillingCard onUpgrade={scrollToPlans} showUpgrade={usage.plan === 'free'} />
          )}
        </div>
      </div>

      {!isInternalPlan && (
        <div id="billing-plans">
          <PlanSwitcher currentPlan={usage.plan} hasStripeSubscription={!!subscription} />
        </div>
      )}

      {details && details.invoices.length > 0 && (
        <BillingHistoryTable
          invoices={details.invoices}
          isPortalLoading={portalLoadingKey === 'portal'}
          onViewAll={() => handlePortal('portal')}
        />
      )}

      <ReferralCard />

      {hasActiveSubscription && (
        <CancelSubscriptionPanel
          accessUntilNote={accessUntilNote}
          freeQuestionsLimit={String(PLAN_LIMITS.free.questionsPerPeriod)}
          onCanceled={refetchAll}
          planLabel={planLabel}
        />
      )}
    </div>
  );

  function renderReconcileBanner() {
    if (!isReconcileFlow) return null;

    if (isReconciling) {
      return (
        <section className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex items-center gap-4">
          <Spinner color="primary" size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t('billing.reconciling.title')}</p>
            <p className="text-xs text-default-500">{t('billing.reconciling.description')}</p>
          </div>
        </section>
      );
    }

    if (pollTimedOut) {
      return (
        <section className="bg-warning/10 border border-warning/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon className="text-warning mt-0.5 shrink-0" icon={faTriangleExclamation} />
            <div>
              <p className="text-sm font-semibold text-foreground">{t('billing.reconciling.timeoutTitle')}</p>
              <p className="text-xs text-default-500">{t('billing.reconciling.timeoutDescription')}</p>
            </div>
          </div>
          <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={handleRetry}>
            {t('billing.reconciling.retryButton')}
          </Button>
        </section>
      );
    }

    return null;
  }
}
