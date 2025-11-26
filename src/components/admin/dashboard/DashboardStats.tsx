/**
 * 📊 DashboardStats Component
 * 
 * Displays quick statistics cards for the dashboard
 * Optimized with React.memo for better performance
 */

import React, { memo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { cn } from '../../../utils';
import type { QuickStat } from './types';

interface DashboardStatsProps {
  stats: QuickStat[];
  isLoading?: boolean;
}

export const DashboardStats = memo<DashboardStatsProps>(({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700 animate-pulse"
          >
            <div className="h-8 w-8 bg-neutral-700 rounded-lg mb-3"></div>
            <div className="h-4 w-20 bg-neutral-700 rounded mb-2"></div>
            <div className="h-8 w-16 bg-neutral-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <button
            key={index}
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className={cn(
              'bg-gradient-to-br from-neutral-800/80 to-neutral-800/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all duration-200',
              stat.onClick 
                ? 'border-neutral-700 hover:border-gold-500/50 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-gold-500/10'
                : 'border-neutral-700 cursor-default',
              stat.color
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'p-3 rounded-xl shadow-lg',
                stat.color.includes('gold') && 'bg-gradient-to-br from-gold-500/20 to-gold-600/10',
                stat.color.includes('blue') && 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
                stat.color.includes('green') && 'bg-gradient-to-br from-green-500/20 to-green-600/10',
                stat.color.includes('orange') && 'bg-gradient-to-br from-orange-500/20 to-orange-600/10',
                stat.color.includes('purple') && 'bg-gradient-to-br from-purple-500/20 to-purple-600/10'
              )}>
                <Icon className={cn('w-6 h-6', stat.color)} />
              </div>
              {stat.trend && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              )}
            </div>
            
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-400 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-white">
                {stat.value.toLocaleString()}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
