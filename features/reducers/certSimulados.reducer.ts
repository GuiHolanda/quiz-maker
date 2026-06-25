import { CertSimuladoListItem } from '@/shared/types';

export interface CertSimuladosState {
  simulados: CertSimuladoListItem[];
  isLoading: boolean;
}

type CertSimuladosAction =
  | { type: 'setSimulados'; payload: CertSimuladoListItem[] }
  | { type: 'addSimulado'; payload: CertSimuladoListItem }
  | { type: 'removeSimulado'; payload: number }
  | { type: 'setLoading'; payload: boolean };

export function certSimuladosReducer(state: CertSimuladosState, action: CertSimuladosAction): CertSimuladosState {
  switch (action.type) {
    case 'setSimulados':
      return { ...state, simulados: action.payload, isLoading: false };
    case 'addSimulado':
      return { ...state, simulados: [action.payload, ...state.simulados] };
    case 'removeSimulado':
      return { ...state, simulados: state.simulados.filter((s) => s.id !== action.payload) };
    case 'setLoading':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}
