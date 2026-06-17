import { Suspense } from 'react';

import { ResetPasswordForm } from './components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="auth-bg">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
