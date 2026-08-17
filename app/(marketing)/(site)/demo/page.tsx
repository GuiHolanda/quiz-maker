import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DemoFlowClient } from '@/app/(marketing)/components/demo/DemoFlowClient';
import { DemoCatalogSkeleton } from '@/app/(marketing)/components/demo/DemoCatalogSkeleton';

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
  // DemoFlowClient reads the ?exam= deep link via useSearchParams, which needs a
  // Suspense boundary to keep this route statically renderable.
  return (
    <Suspense fallback={<DemoCatalogSkeleton />}>
      <DemoFlowClient />
    </Suspense>
  );
}
