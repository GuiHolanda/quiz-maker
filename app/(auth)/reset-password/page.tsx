import { Suspense } from 'react';

import { ResetPasswordForm } from './components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
