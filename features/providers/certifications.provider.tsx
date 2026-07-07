import type { Certification, CertificationsStoreApi } from '@/shared/types';

import React, { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';

import { certificationsReducer } from '../reducers/certifications.reducer';
import { getCertifications } from '../connectors';

import { CERTIFICATIONS_LOCAL_STORAGE_KEY, INITIAL_CERTIFICATIONS_STATE } from '@/config/constants';

export const CertificationsContext = React.createContext<CertificationsStoreApi | null>(null);

export function CertificationsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(certificationsReducer, INITIAL_CERTIFICATIONS_STATE);
  const hydrated = useRef(false);

  useEffect(() => {
    let storedKey: string | null = null;
    let storedTopics: string[] = [];

    try {
      const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        storedKey = parsed?.selectedCertification?.key ?? null;
        storedTopics = parsed?.selectedTopics ?? [];
      }
    } catch (err) {
      console.warn('Failed to read UI state from storage', err);
    }

    getCertifications()
      .then((certs) => {
        dispatch({ type: 'setCertifications', payload: { certifications: certs } });
        if (storedKey) dispatch({ type: 'setSelectedCertification', payload: { key: storedKey } });
        dispatch({ type: 'setSelectedTopics', payload: { topics: storedTopics } });
        hydrated.current = true;
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(CERTIFICATIONS_LOCAL_STORAGE_KEY);

          if (!raw) {
            hydrated.current = true;
            return;
          }
          const parsed = JSON.parse(raw);

          if (Array.isArray(parsed?.certifications)) {
            dispatch({ type: 'setCertifications', payload: { certifications: parsed.certifications } });
            if (storedKey) dispatch({ type: 'setSelectedCertification', payload: { key: storedKey } });
            dispatch({ type: 'setSelectedTopics', payload: { topics: storedTopics } });
          }
        } catch {}
        hydrated.current = true;
      })
      .finally(() => dispatch({ type: 'setLoading', payload: { isLoading: false } }));
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
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
      isLoading: state.isLoading,
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
      state.isLoading,
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
