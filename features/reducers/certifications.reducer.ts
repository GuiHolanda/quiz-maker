import type { Certification, Certifications } from '@/types';

export type CertificationsState = Certifications;

export type CertificationsAction =
  | { type: 'setCertifications'; payload: { certifications: Certifications } }
  | { type: 'addCertification'; payload: { certification: Certification } }
  | { type: 'removeCertification'; payload: { key: string } }
  | { type: 'updateCertification'; payload: { key: string; certification: Partial<Certification> } };

export function certificationsReducer(state: CertificationsState, action: CertificationsAction): CertificationsState {
  switch (action.type) {
    case 'setCertifications':
      return action.payload.certifications;
    case 'addCertification':
      return [...state, action.payload.certification];
    case 'removeCertification':
      return state.filter(c => c.key !== action.payload.key);
    case 'updateCertification':
      return state.map(c => (c.key === action.payload.key ? { ...c, ...action.payload.certification } : c));
    default:
      return state;
  }
}

export default certificationsReducer;
