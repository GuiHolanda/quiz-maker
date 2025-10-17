import type { Certification } from '@/types';

export interface CertificationsState {
  certifications: Certification[];
  selectedCertification: Certification | null;
}

export type CertificationsAction =
  | { type: 'setState'; payload: { state: CertificationsState } }
  | { type: 'setCertifications'; payload: { certifications: Certification[] } }
  | { type: 'setSelectedCertification'; payload: { key: string | null } }
  | { type: 'addCertification'; payload: { certification: Certification } }
  | { type: 'removeCertification'; payload: { key: string } }
  | { type: 'updateCertification'; payload: { key: string; certification: Partial<Certification> } };

export function certificationsReducer(state: CertificationsState, action: CertificationsAction): CertificationsState {
  switch (action.type) {
    case 'setState':
      return action.payload.state;
    case 'setCertifications':
      return { ...state, certifications: action.payload.certifications };
    case 'setSelectedCertification':
      return {
        ...state,
        selectedCertification: state.certifications.find((c) => c.key === action.payload.key) || null,
      };
    case 'addCertification':
      return { ...state, certifications: [...state.certifications, action.payload.certification] };
    case 'removeCertification':
      return { ...state, certifications: state.certifications.filter((c) => c.key !== action.payload.key) };
    case 'updateCertification':
      return {
        ...state,
        certifications: state.certifications.map((c) =>
          c.key === action.payload.key ? { ...c, ...action.payload.certification } : c
        ),
      };
    default:
      return state;
  }
}

export default certificationsReducer;
