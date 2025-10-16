import { useContext } from 'react';
import { CertificationsContext } from '@/features/providers/certifications.provider';

export function useCertificationsContext() {
  const ctx = useContext(CertificationsContext as any);
  if (!ctx) throw new Error('useCertificationsContext must be used within a CertificationsProvider');
  return ctx;
}

export default useCertificationsContext;
