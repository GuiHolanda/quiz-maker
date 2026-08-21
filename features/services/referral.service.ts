import { prisma } from '@/lib/prisma';
import { REFERRAL_REWARD } from '@/config/constants';
import { EmailService } from '@/features/services/email.service';
import { generateUniqueReferralCode } from '@/lib/referral-code';

export class ReferralService {
  private emailServiceInstance: EmailService | null = null;

  private get emailService(): EmailService {
    this.emailServiceInstance ??= new EmailService();

    return this.emailServiceInstance;
  }

  // Called after a real activation event (first question batch generated, first mock exam
  // completed) — never at signup, per the audit's antifraud reasoning. Cheap no-op for the
  // vast majority of callers (not a referred user, or already activated), so it's safe to
  // call on every such event rather than tracking "is this the user's first one" separately.
  async activateIfEligible(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, referredByUserId: true, referralActivatedAt: true },
    });

    if (!user?.referredByUserId || user.referralActivatedAt) return;

    // Conditional update doubles as the duplicate-grant lock: if another concurrent call
    // already activated this user, count is 0 and we bail out without paying out twice.
    const activated = await prisma.user.updateMany({
      where: { id: userId, referralActivatedAt: null },
      data: { referralActivatedAt: new Date(), bonusQuestions: { increment: REFERRAL_REWARD.referredBonus } },
    });

    if (activated.count === 0) return;

    const dashboardUrl = `${process.env.AUTH_URL}/dashboard`;

    // Notification is best-effort — the bonus is already durably granted above, so a Resend
    // failure here must never look like the activation itself failed.
    try {
      await this.emailService.sendReferralRewardToFriend(user.email, REFERRAL_REWARD.referredBonus, dashboardUrl);
    } catch (err) {
      console.error('Failed to send referral reward email to friend:', err);
    }

    const rewardedReferralsCount = await prisma.user.count({
      where: { referredByUserId: user.referredByUserId, referralActivatedAt: { not: null } },
    });

    if (rewardedReferralsCount > REFERRAL_REWARD.maxRewardedReferralsPerAccount) return;

    const referrer = await prisma.user.update({
      where: { id: user.referredByUserId },
      data: { bonusQuestions: { increment: REFERRAL_REWARD.referrerBonus } },
      select: { email: true },
    });

    try {
      await this.emailService.sendReferralRewardToReferrer(referrer.email, REFERRAL_REWARD.referrerBonus, dashboardUrl);
    } catch (err) {
      console.error('Failed to send referral reward email to referrer:', err);
    }
  }

  // Lazily backfills a referralCode for users who signed up before this field existed —
  // RegisterService only assigns one at signup, so anyone from before that migration has
  // none until they first open the "convide amigos" card.
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });

    if (user.referralCode) return user.referralCode;

    const code = await generateUniqueReferralCode(async (candidate) => {
      const existing = await prisma.user.findUnique({ where: { referralCode: candidate }, select: { id: true } });

      return !!existing;
    });

    await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });

    return code;
  }

  async getStats(userId: string): Promise<{
    referralCode: string;
    referralLink: string;
    referredCount: number;
    activatedCount: number;
    bonusQuestionsEarned: number;
  }> {
    const [referralCode, referredCount, activatedCount] = await Promise.all([
      this.getOrCreateReferralCode(userId),
      prisma.user.count({ where: { referredByUserId: userId } }),
      prisma.user.count({ where: { referredByUserId: userId, referralActivatedAt: { not: null } } }),
    ]);

    // Deterministic from activatedCount rather than read off bonusQuestions, which pools every
    // bonus source together and drains as the user spends it — this reflects what referrals
    // specifically earned, capped the same way the payout itself is.
    const rewardedCount = Math.min(activatedCount, REFERRAL_REWARD.maxRewardedReferralsPerAccount);
    const bonusQuestionsEarned = rewardedCount * REFERRAL_REWARD.referrerBonus;
    const referralLink = `${process.env.AUTH_URL}/register?ref=${referralCode}`;

    return { referralCode, referralLink, referredCount, activatedCount, bonusQuestionsEarned };
  }
}
