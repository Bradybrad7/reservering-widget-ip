/**
 * EventQuickStats - Mini statistieken component
 * 
 * Toont quick stats voor een individueel evenement
 * Gebruikt in tooltips en hover states
 */

import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import type { EventStats } from './EventCommandCenter';

interface EventQuickStatsProps {
  stats: EventStats;
  capacity: number;
}

export const EventQuickStats: React.FC<EventQuickStatsProps> = ({ stats, capacity }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <div className="space-y-2">
        {/* Capacity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Users className="w-3 h-3" />
            <span>Capaciteit</span>
          </div>
          <div className="text-white font-semibold text-sm">
            {stats.totalConfirmedPersons} / {capacity}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all ${
              stats.capacityPercentage >= 100 
                ? 'bg-red-500' 
                : stats.capacityPercentage >= 80 
                  ? 'bg-orange-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
          />
        </div>

        {/* Bookings Breakdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Boekingen</span>
          <div className="flex items-center gap-2">
            {stats.confirmedCount > 0 && (
              <span className="text-green-400">✓ {stats.confirmedCount}</span>
            )}
            {stats.pendingCount > 0 && (
              <span className="text-yellow-400">⏳ {stats.pendingCount}</span>
            )}
            {stats.optionCount > 0 && (
              <span className="text-blue-400">📌 {stats.optionCount}</span>
            )}
          </div>
        </div>

        {/* Waitlist */}
        {stats.waitlistCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Wachtlijst</span>
            <span className="text-orange-400 font-semibold">
              {stats.waitlistPersonCount} pers.
            </span>
          </div>
        )}

        {/* Warnings */}
        {stats.capacityPercentage >= 90 && (
          <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 rounded px-2 py-1">
            <AlertCircle className="w-3 h-3" />
            <span>
              {stats.capacityPercentage >= 100 ? 'Event is vol' : 'Bijna vol!'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
