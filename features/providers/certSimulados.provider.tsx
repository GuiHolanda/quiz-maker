'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';

import { CertSimuladoListItem } from '@/shared/types';
import { certSimuladosReducer, CertSimuladosState } from '@/features/reducers/certSimulados.reducer';
import { CERT_SIMULADOS_LOCAL_STORAGE_KEY, INITIAL_CERT_SIMULADOS_STATE } from '@/config/constants';
import { getCertSimulados } from '@/features/connectors';

interface CertSimuladosContextValue extends CertSimuladosState {
  setSimulados: (simulados: CertSimuladoListItem[]) => void;
  addSimulado: (simulado: CertSimuladoListItem) => void;
  removeSimulado: (id: number) => void;
}

const CertSimuladosContext = createContext<CertSimuladosContextValue | null>(null);

export function CertSimuladosProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(certSimuladosReducer, INITIAL_CERT_SIMULADOS_STATE);

  useEffect(() => {
    getCertSimulados()
      .then((simulados) => dispatch({ type: 'setSimulados', payload: simulados }))
      .catch(() => {
        const stored = localStorage.getItem(CERT_SIMULADOS_LOCAL_STORAGE_KEY);

        if (stored) {
          try {
            dispatch({ type: 'setSimulados', payload: JSON.parse(stored) });
          } catch {
            // ignore
          }
        }
      })
      .finally(() => dispatch({ type: 'setLoading', payload: false }));
  }, []);

  useEffect(() => {
    localStorage.setItem(CERT_SIMULADOS_LOCAL_STORAGE_KEY, JSON.stringify(state.simulados));
  }, [state.simulados]);

  const value: CertSimuladosContextValue = {
    ...state,
    setSimulados: (simulados) => dispatch({ type: 'setSimulados', payload: simulados }),
    addSimulado: (simulado) => dispatch({ type: 'addSimulado', payload: simulado }),
    removeSimulado: (id) => dispatch({ type: 'removeSimulado', payload: id }),
  };

  return <CertSimuladosContext.Provider value={value}>{children}</CertSimuladosContext.Provider>;
}

export function useCertSimuladosContext(): CertSimuladosContextValue {
  const ctx = useContext(CertSimuladosContext);

  if (!ctx) throw new Error('useCertSimuladosContext must be used inside CertSimuladosProvider');

  return ctx;
}
