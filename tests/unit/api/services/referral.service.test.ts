import { vi } from 'vitest';

vi.mock('@/features/services/email.service', () => {
  const EmailService = vi.fn();

  EmailService.prototype.sendReferralRewardToFriend = vi.fn().mockResolvedValue(undefined);
  EmailService.prototype.sendReferralRewardToReferrer = vi.fn().mockResolvedValue(undefined);

  return { EmailService };
});

import { prismaMock } from '../__mocks__/prisma';
import { ReferralService } from '@/features/services/referral.service';
import { EmailService } from '@/features/services/email.service';

const sendReferralRewardToFriend = EmailService.prototype.sendReferralRewardToFriend as ReturnType<typeof vi.fn>;
const sendReferralRewardToReferrer = EmailService.prototype.sendReferralRewardToReferrer as ReturnType<typeof vi.fn>;

describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(() => {
    service = new ReferralService();
    sendReferralRewardToFriend.mockClear();
    sendReferralRewardToReferrer.mockClear();
  });

  describe('activateIfEligible', () => {
    // Behaviour 1: not a referred user — no-op
    it('does nothing when the user was not referred by anyone', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        referredByUserId: null,
        referralActivatedAt: null,
      } as any);

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    });

    // Behaviour 2: already activated — no-op
    it('does nothing when the referral was already activated', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: new Date(),
      } as any);

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    });

    // Behaviour 3: first activation grants both sides under the cap and emails both
    it('grants the referred bonus and the referrer bonus on first activation', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'friend@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: null,
      } as any);
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.user.count.mockResolvedValue(3); // referrer has 3 activated referrals, well under the cap
      prismaMock.user.update.mockResolvedValue({ email: 'referrer@example.com' } as any);

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', referralActivatedAt: null },
        data: { referralActivatedAt: expect.any(Date), bonusQuestions: { increment: 100 } },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: { bonusQuestions: { increment: 150 } },
        select: { email: true },
      });
      expect(sendReferralRewardToFriend).toHaveBeenCalledWith('friend@example.com', 100, expect.any(String));
      expect(sendReferralRewardToReferrer).toHaveBeenCalledWith('referrer@example.com', 150, expect.any(String));
    });

    // Behaviour 4: a concurrent call already activated this user — never touch the referrer
    it('skips the referrer bonus when the conditional update loses the activation race', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'friend@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: null,
      } as any);
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.count).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(sendReferralRewardToFriend).not.toHaveBeenCalled();
      expect(sendReferralRewardToReferrer).not.toHaveBeenCalled();
    });

    // Behaviour 5: referrer already past the cap — referred user keeps their bonus, referrer gets nothing more
    it('withholds the referrer bonus once maxRewardedReferralsPerAccount is exceeded', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'friend@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: null,
      } as any);
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.user.count.mockResolvedValue(11); // this activation was the 11th

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.updateMany).toHaveBeenCalled(); // referred user still got their +100
      expect(prismaMock.user.update).not.toHaveBeenCalled(); // referrer did not
      expect(sendReferralRewardToReferrer).not.toHaveBeenCalled();
    });

    // Behaviour 6: exactly at the cap boundary still counts in the referrer's favor
    it('grants the referrer bonus when this activation is exactly the 10th', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'friend@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: null,
      } as any);
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.user.count.mockResolvedValue(10);
      prismaMock.user.update.mockResolvedValue({ email: 'referrer@example.com' } as any);

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: { bonusQuestions: { increment: 150 } },
        select: { email: true },
      });
    });

    // Behaviour 7: the friend's email failing must not block the referrer's DB grant
    it('still grants the referrer bonus when the friend notification email throws', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        email: 'friend@example.com',
        referredByUserId: 'referrer-1',
        referralActivatedAt: null,
      } as any);
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaMock.user.count.mockResolvedValue(3);
      prismaMock.user.update.mockResolvedValue({ email: 'referrer@example.com' } as any);
      sendReferralRewardToFriend.mockRejectedValueOnce(new Error('Resend down'));

      await service.activateIfEligible('user-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-1' },
        data: { bonusQuestions: { increment: 150 } },
        select: { email: true },
      });
    });
  });

  describe('getOrCreateReferralCode', () => {
    // Behaviour 8: returns the existing code untouched
    it('returns the existing referralCode without generating a new one', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ referralCode: 'EXISTING1' } as any);

      const code = await service.getOrCreateReferralCode('user-1');

      expect(code).toBe('EXISTING1');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    // Behaviour 9: backfills and persists a code for a user who has none yet
    it('generates and persists a referralCode when the user has none', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ referralCode: null } as any);
      prismaMock.user.findUnique.mockResolvedValue(null); // no collision on the generated candidate

      const code = await service.getOrCreateReferralCode('user-1');

      expect(code).toMatch(/^[A-Z2-9]{8}$/);
      expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { referralCode: code } });
    });
  });

  describe('getStats', () => {
    // Behaviour 10: aggregates referral code, counts, and earned bonus (capped)
    it('caps bonusQuestionsEarned at maxRewardedReferralsPerAccount even with more activated referrals', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({ referralCode: 'MYCODE01' } as any);
      prismaMock.user.count.mockResolvedValueOnce(15).mockResolvedValueOnce(12); // referred, then activated

      const stats = await service.getStats('user-1');

      expect(stats.referralCode).toBe('MYCODE01');
      expect(stats.referredCount).toBe(15);
      expect(stats.activatedCount).toBe(12);
      expect(stats.bonusQuestionsEarned).toBe(10 * 150); // capped at 10 rewarded referrals
      expect(stats.referralLink).toContain('MYCODE01');
    });
  });
});
