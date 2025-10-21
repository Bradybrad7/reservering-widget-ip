import React from 'react';

/**
 * Skeleton Loaders
 * 
 * Provides better UX during loading states by showing placeholder content
 */

export const CalendarSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Calendar Grid */}
    <div className="grid grid-cols-7 gap-2">
      {/* Day headers */}
      {[...Array(7)].map((_, i) => (
        <div key={`header-${i}`} className="h-8 bg-gray-200 rounded"></div>
      ))}
      
      {/* Calendar days */}
      {[...Array(35)].map((_, i) => (
        <div key={`day-${i}`} className="h-20 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

export const ReservationFormSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* Form fields */}
    {[...Array(8)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    ))}
    
    {/* Button */}
    <div className="h-12 bg-gray-200 rounded w-full"></div>
  </div>
);

export const EventCardSkeleton: React.FC = () => (
  <div className="animate-pulse p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <div className="h-6 bg-gray-200 rounded w-32"></div>
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

export const ReservationListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="animate-pulse p-6 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-20"></div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse">
    {/* Table Header */}
    <div className="grid gap-4 mb-3 border-b border-gray-200 pb-3" 
         style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {[...Array(cols)].map((_, i) => (
        <div key={`header-${i}`} className="h-4 bg-gray-200 rounded w-3/4"></div>
      ))}
    </div>
    
    {/* Table Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`}
        className="grid gap-4 mb-3 py-3 border-b border-gray-100"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {[...Array(cols)].map((_, colIndex) => (
          <div key={`cell-${rowIndex}-${colIndex}`} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="flex items-end justify-between h-64 gap-2">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="bg-gray-200 rounded-t w-full"
          style={{ height: `${Math.random() * 100}%` }}
        ></div>
      ))}
    </div>
    <div className="flex justify-between mt-2">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded w-6"></div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Chart */}
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <ChartSkeleton />
    </div>

    {/* Table */}
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <TableSkeleton />
    </div>
  </div>
);

// Pulse animation keyframes are handled by Tailwind's animate-pulse utility

/**
 * Usage Examples:
 * 
 * // In a component:
 * {isLoading ? <CalendarSkeleton /> : <Calendar events={events} />}
 * {isLoading ? <ReservationListSkeleton count={3} /> : <ReservationList items={items} />}
 * {isLoading ? <DashboardSkeleton /> : <Dashboard data={data} />}
 */
