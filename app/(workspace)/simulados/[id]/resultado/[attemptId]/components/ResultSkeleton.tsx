import { Skeleton } from '@heroui/skeleton';

import { WorkspaceSplitLayout } from '@/shared/components/ui/WorkspaceSplitLayout';

export function ResultSkeleton() {
  return (
    <WorkspaceSplitLayout
      rail={
        <>
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </>
      }
    >
      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6 md:p-7">
        <div className="grid gap-8 md:grid-cols-[232px_minmax(0,1fr)] md:items-center">
          <Skeleton className="mx-auto h-[232px] w-[232px] rounded-full md:mx-0" />
          <div className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
        <Skeleton className="h-5 w-48 rounded-lg" />
        <div className="mt-5 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="mt-5 flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </WorkspaceSplitLayout>
  );
}
