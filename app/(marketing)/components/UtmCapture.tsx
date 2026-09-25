'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { captureUtmFromUrl } from '@/lib/utm';

export function UtmCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmFromUrl(searchParams);
  }, [searchParams]);

  return null;
}
