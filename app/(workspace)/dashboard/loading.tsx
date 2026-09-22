'use client';

import { Skeleton } from '@heroui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="app-bg">
      <div className="w-full px-6 md:px-12 py-6 md:py-12">
        <div className="space-y-6" aria-hidden>
          <Skeleton className="h-20 w-full rounded-xl" />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4">
            <div className="grid gap-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="grid gap-4">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
