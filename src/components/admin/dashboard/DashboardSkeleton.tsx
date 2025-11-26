/**
 * 💀 Dashboard Skeleton Loader
 * 
 * Beautiful loading state for ReservationsDashboard
 * Provides better perceived performance than spinners
 */

import React, { memo } from 'react';
import { Skeleton, SkeletonStat, SkeletonText } from '../../common/SkeletonLoaders';
import { cn } from '../../../utils';

export const DashboardSkeleton = memo(() => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Header Skeleton */}
      <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 shadow-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-9 w-64 mb-2 bg-neutral-700" />
              <Skeleton className="h-4 w-40 bg-neutral-700" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-xl bg-neutral-700" />
              <Skeleton className="h-10 w-40 rounded-xl bg-neutral-700" />
              <Skeleton className="h-10 w-32 rounded-xl bg-neutral-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="w-12 h-12 rounded-xl bg-neutral-700" />
                  <Skeleton className="w-16 h-5 rounded bg-neutral-700" />
                </div>
                <Skeleton className="h-4 w-24 mb-2 bg-neutral-700" />
                <Skeleton className="h-8 w-16 bg-neutral-700" />
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="space-y-4">
            {/* Main Tabs */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11 w-32 rounded-xl bg-neutral-800" />
              ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-12 rounded-xl bg-neutral-700 lg:col-span-2" />
                <Skeleton className="h-12 rounded-xl bg-neutral-700" />
                <Skeleton className="h-12 rounded-xl bg-neutral-700" />
              </div>
            </div>
          </div>

          {/* Reservations List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-neutral-800/80 rounded-xl p-5 border-2 border-neutral-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Date Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-20 rounded bg-neutral-700" />
                      <Skeleton className="h-4 w-40 rounded bg-neutral-700" />
                    </div>

                    {/* Company Name */}
                    <Skeleton className="h-6 w-48 mb-3 bg-neutral-700" />

                    {/* Contact Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-4 w-40 rounded bg-neutral-700" />
                      <Skeleton className="h-4 w-32 rounded bg-neutral-700" />
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24 rounded bg-neutral-700" />
                      <Skeleton className="h-4 w-20 rounded bg-neutral-700" />
                      <Skeleton className="h-6 w-16 rounded bg-neutral-700" />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg bg-neutral-700" />
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-16 rounded bg-neutral-700" />
                      <Skeleton className="h-6 w-16 rounded bg-neutral-700" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-700">
                  <Skeleton className="h-10 flex-1 rounded-lg bg-neutral-700" />
                  <Skeleton className="h-10 flex-1 rounded-lg bg-neutral-700" />
                  <Skeleton className="h-10 w-12 rounded-lg bg-neutral-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';
