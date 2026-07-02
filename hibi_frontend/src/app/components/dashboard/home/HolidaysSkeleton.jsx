"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function HolidaysSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-muted/60 rounded-lg px-4 py-3 text-base animate-pulse"
        >
          <div className="flex gap-3 items-center flex-wrap">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-5 w-3 rounded" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      ))}
    </div>
  );
}
