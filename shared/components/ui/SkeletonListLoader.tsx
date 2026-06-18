'use client';
import { Skeleton } from '@heroui/skeleton';

interface SkeletonListLoaderProps {
  readonly count?: number;
  readonly height?: string;
  readonly className?: string;
}

export function SkeletonListLoader({ count = 3, height = 'h-14', className }: SkeletonListLoaderProps) {
  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} w-full rounded-xl`} />
      ))}
    </div>
  );
}
