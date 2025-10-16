import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Certification, Certifications, CertificationsStoreApi } from '@/types';
import { CERTIFICATIONS_LOCAL_STORAGE_KEY, CERTIFICATIONS as INITIAL_CERTIFICATIONS } from '@/config/constants';
import { certificationsReducer } from '../reducers/certifications.reducer';

export const CertificationsContext = React.createContext<CertificationsStoreApi | null>(null);

export function CertificationsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(certificationsReducer, INITIAL_CERTIFICATIONS as any);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);
      if (raw) dispatch({ type: 'setCertifications', payload: { certifications: JSON.parse(raw) as Certifications } });
    } catch (err) {
      console.warn('Failed to read certifications from storage', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CERTIFICATIONS_LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Persist certifications failed', err);
    }
  }, [state]);

  const setCertifications = useCallback(
    (certs: Certifications) => dispatch({ type: 'setCertifications', payload: { certifications: certs } }),
    []
  );
  const addCertification = useCallback(
    (cert: Certification) => dispatch({ type: 'addCertification', payload: { certification: cert } }),
    []
  );
  const removeCertification = useCallback(
    (key: string) => dispatch({ type: 'removeCertification', payload: { key } }),
    []
  );
  const updateCertification = useCallback(
    (key: string, patch: Partial<Certification>) =>
      dispatch({ type: 'updateCertification', payload: { key, certification: patch } }),
    []
  );

  const api = useMemo<CertificationsStoreApi>(
    () => ({ certifications: state, setCertifications, addCertification, removeCertification, updateCertification }),
    [state, setCertifications, addCertification, removeCertification, updateCertification]
  );

  return <CertificationsContext.Provider value={api}>{children}</CertificationsContext.Provider>;
}

export default CertificationsProvider;
