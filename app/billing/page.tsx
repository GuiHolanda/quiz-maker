import { BillingOverview } from '@/app/billing/components/BillingOverview';

export default function BillingPage() {
  return <BillingPageContent />;
}

function BillingPageContent() {
  return (
    <div className="app-bg">
      <div className="container mx-auto max-w-7xl pt-8 px-6 pb-12">
        <BillingOverview />
      </div>
    </div>
  );
}
