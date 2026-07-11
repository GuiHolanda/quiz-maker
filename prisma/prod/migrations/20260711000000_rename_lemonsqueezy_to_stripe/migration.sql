-- Rename LemonSqueezy columns to Stripe equivalents
ALTER TABLE "User" RENAME COLUMN "lemonSqueezyCustomerId" TO "stripeCustomerId";
ALTER TABLE "User" RENAME COLUMN "lemonSqueezySubscriptionId" TO "stripeSubscriptionId";

-- Add unique constraint that the Prisma schema requires on stripeSubscriptionId
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
