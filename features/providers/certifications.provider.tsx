import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Certification, CertificationsStoreApi } from '@/types';
import { CERTIFICATIONS_LOCAL_STORAGE_KEY, INITIAL_CERTIFICATIONS_STATE } from '@/config/constants';
import { certificationsReducer } from '../reducers/certifications.reducer';

export const CertificationsContext = React.createContext<CertificationsStoreApi | null>(null);

export function CertificationsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(certificationsReducer, INITIAL_CERTIFICATIONS_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      let normalized: { certifications: Certification[]; selectedCertification: Certification | null } | null = null;
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.certifications)) {
        normalized = {
          certifications: parsed.certifications,
          selectedCertification: parsed.selectedCertification || null,
        };
      } else if (Array.isArray(parsed)) {
        normalized = { certifications: parsed, selectedCertification: null };
      }

      if (normalized) {
        dispatch({ type: 'setState', payload: { state: normalized } });
      }
    } catch (err) {
      console.warn('Failed to read certifications from storage', err);
    }
  }, []);

  useEffect(() => {
    try {
      const toStore = { certifications: state.certifications, selectedCertification: state.selectedCertification };
      localStorage.setItem(CERTIFICATIONS_LOCAL_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.warn('Persist certifications failed', err);
    }
  }, [state.certifications, state.selectedCertification]);

  const setCertifications = useCallback(
    (certs: Certification[]) => dispatch({ type: 'setCertifications', payload: { certifications: certs } }),
    []
  );

  const setSelectedCertification = useCallback(
    (cert: Certification | null) => dispatch({ type: 'setSelectedCertification', payload: { key: cert?.key || null } }),
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
    () => ({
      certifications: state.certifications,
      selectedCertification: state.selectedCertification,
      setCertifications,
      setSelectedCertification,
      addCertification,
      removeCertification,
      updateCertification,
    }),
    [
      state.certifications,
      state.selectedCertification,
      setCertifications,
      setSelectedCertification,
      addCertification,
      removeCertification,
      updateCertification,
    ]
  );

  return <CertificationsContext.Provider value={api}>{children}</CertificationsContext.Provider>;
}

export default CertificationsProvider;
