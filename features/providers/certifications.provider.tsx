import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Certification, CertificationsStoreApi } from '@/types';
import { CERTIFICATIONS_LOCAL_STORAGE_KEY, INITIAL_CERTIFICATIONS_STATE } from '@/config/constants';
import { certificationsReducer } from '../reducers/certifications.reducer';
import { getCertifications } from '../connectors';

export const CertificationsContext = React.createContext<CertificationsStoreApi | null>(null);

export function CertificationsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(certificationsReducer, INITIAL_CERTIFICATIONS_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: 'setSelectedCertification', payload: { key: parsed?.selectedCertification?.key ?? null } });
        dispatch({ type: 'setSelectedTopics', payload: { topics: parsed?.selectedTopics ?? [] } });
      }
    } catch (err) {
      console.warn('Failed to read UI state from storage', err);
    }

    getCertifications()
      .then((certs) => dispatch({ type: 'setCertifications', payload: { certifications: certs } }))
      .catch(() => {
        try {
          const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.certifications)) {
            dispatch({ type: 'setCertifications', payload: { certifications: parsed.certifications } });
          }
        } catch {}
      });
  }, []);

  useEffect(() => {
    try {
      const toStore = { selectedCertification: state.selectedCertification, selectedTopics: state.selectedTopics };
      localStorage.setItem(CERTIFICATIONS_LOCAL_STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.warn('Persist certifications failed', err);
    }
  }, [state.selectedCertification, state.selectedTopics]);

  useEffect(() => {
    const handler = (e: Event) => {
      const cert = (e as CustomEvent<Certification>).detail;
      if (cert) dispatch({ type: 'addCertification', payload: { certification: cert } });
    };
    window.addEventListener('certification-created', handler);
    return () => window.removeEventListener('certification-created', handler);
  }, []);

  const setCertifications = useCallback(
    (certs: Certification[]) => dispatch({ type: 'setCertifications', payload: { certifications: certs } }),
    []
  );

  const setSelectedCertification = useCallback(
    (cert: Certification | null) => dispatch({ type: 'setSelectedCertification', payload: { key: cert?.key || null } }),
    []
  );

  const setSelectedTopics = useCallback(
    (topics: string[]) => dispatch({ type: 'setSelectedTopics', payload: { topics } }),
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
      selectedTopics: state.selectedTopics,
      setCertifications,
      setSelectedCertification,
      setSelectedTopics,
      addCertification,
      removeCertification,
      updateCertification,
    }),
    [
      state.certifications,
      state.selectedCertification,
      state.selectedTopics,
      setCertifications,
      setSelectedCertification,
      setSelectedTopics,
      addCertification,
      removeCertification,
      updateCertification,
    ]
  );

  return <CertificationsContext.Provider value={api}>{children}</CertificationsContext.Provider>;
}

export default CertificationsProvider;
