import { prisma } from '@/lib/prisma';
import { REFERRAL_REWARD } from '@/config/constants';

export class ReferralService {
  // Called after a real activation event (first question batch generated, first mock exam
  // completed) — never at signup, per the audit's antifraud reasoning. Cheap no-op for the
  // vast majority of callers (not a referred user, or already activated), so it's safe to
  // call on every such event rather than tracking "is this the user's first one" separately.
  async activateIfEligible(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByUserId: true, referralActivatedAt: true },
    });

    if (!user?.referredByUserId || user.referralActivatedAt) return;

    // Conditional update doubles as the duplicate-grant lock: if another concurrent call
    // already activated this user, count is 0 and we bail out without paying out twice.
    const activated = await prisma.user.updateMany({
      where: { id: userId, referralActivatedAt: null },
      data: { referralActivatedAt: new Date(), bonusQuestions: { increment: REFERRAL_REWARD.referredBonus } },
    });

    if (activated.count === 0) return;

    const rewardedReferralsCount = await prisma.user.count({
      where: { referredByUserId: user.referredByUserId, referralActivatedAt: { not: null } },
    });

    if (rewardedReferralsCount > REFERRAL_REWARD.maxRewardedReferralsPerAccount) return;

    await prisma.user.update({
      where: { id: user.referredByUserId },
      data: { bonusQuestions: { increment: REFERRAL_REWARD.referrerBonus } },
    });
  }
}
