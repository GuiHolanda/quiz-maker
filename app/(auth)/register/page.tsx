import { Suspense } from 'react';

import { RegisterForm } from './components/RegisterForm';

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
