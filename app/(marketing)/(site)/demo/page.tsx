import type { Metadata } from 'next';
import { DemoFlowClient } from '@/app/(marketing)/components/demo/DemoFlowClient';

export const metadata: Metadata = {
  title: 'Demonstração interativa · CertifiqueAI',
  description:
    'Experimente como funciona: escolha uma certificação, distribua as questões por tópico, responda e veja seu diagnóstico.',
  alternates: { canonical: 'https://www.certifiqueai.com/demo' },
  openGraph: {
    title: 'Demonstração interativa · CertifiqueAI',
    description:
      'Experimente como funciona: escolha uma certificação, distribua as questões por tópico, responda e veja seu diagnóstico.',
    url: 'https://www.certifiqueai.com/demo',
    type: 'website',
  },
};

export default function DemoPage() {
  return <DemoFlowClient />;
}
