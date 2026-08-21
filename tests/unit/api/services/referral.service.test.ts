import { prismaMock } from '../__mocks__/prisma';
import { ReferralService } from '@/features/services/referral.service';

describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(() => {
    service = new ReferralService();
  });

  // Behaviour 1: not a referred user — no-op
  it('does nothing when the user was not referred by anyone', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ referredByUserId: null, referralActivatedAt: null } as any);

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  // Behaviour 2: already activated — no-op
  it('does nothing when the referral was already activated', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByUserId: 'referrer-1',
      referralActivatedAt: new Date(),
    } as any);

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  // Behaviour 3: first activation grants both sides under the cap
  it('grants the referred bonus and the referrer bonus on first activation', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByUserId: 'referrer-1',
      referralActivatedAt: null,
    } as any);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.user.count.mockResolvedValue(3); // referrer has 3 activated referrals, well under the cap

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', referralActivatedAt: null },
      data: { referralActivatedAt: expect.any(Date), bonusQuestions: { increment: 100 } },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'referrer-1' },
      data: { bonusQuestions: { increment: 150 } },
    });
  });

  // Behaviour 4: a concurrent call already activated this user — never touch the referrer
  it('skips the referrer bonus when the conditional update loses the activation race', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByUserId: 'referrer-1',
      referralActivatedAt: null,
    } as any);
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 } as any);

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.count).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  // Behaviour 5: referrer already past the cap — referred user keeps their bonus, referrer gets nothing more
  it('withholds the referrer bonus once maxRewardedReferralsPerAccount is exceeded', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByUserId: 'referrer-1',
      referralActivatedAt: null,
    } as any);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.user.count.mockResolvedValue(11); // this activation was the 11th

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.updateMany).toHaveBeenCalled(); // referred user still got their +100
    expect(prismaMock.user.update).not.toHaveBeenCalled(); // referrer did not
  });

  // Behaviour 6: exactly at the cap boundary still counts in the referrer's favor
  it('grants the referrer bonus when this activation is exactly the 10th', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      referredByUserId: 'referrer-1',
      referralActivatedAt: null,
    } as any);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.user.count.mockResolvedValue(10);

    await service.activateIfEligible('user-1');

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'referrer-1' },
      data: { bonusQuestions: { increment: 150 } },
    });
  });
});
