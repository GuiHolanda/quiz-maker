'use client';

import { Skeleton } from '@heroui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="app-bg">
      <div className="w-full px-6 md:px-12 py-6 md:py-12">
        <div className="space-y-5" aria-hidden>
          <Skeleton className="h-44 w-full rounded-xl" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Skeleton className="h-72 w-full rounded-xl lg:col-span-3" />
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          </div>

          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
