/**
 * EventAnalyticsCard - Rijke analytics kaart voor een event
 * 
 * Toont gedetailleerde statistieken en trends voor een specifiek evenement
 */


import { TrendingUp, TrendingDown, Users, Clock, AlertCircle, CheckCircle, Minus } from 'lucide-react';
import type { EventStats } from '../../utils/eventHelpers';
import type { AdminEvent } from '../../types';

interface EventAnalyticsCardProps {
  event: AdminEvent;
  stats: EventStats;
  trend?: 'up' | 'down' | 'stable';
}

export const EventAnalyticsCard: React.FC<EventAnalyticsCardProps> = ({ 
  event, 
  stats,
  trend = 'stable'
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white">
              {new Date(event.date).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {getTrendIcon()}
          </div>
          <p className="text-sm text-gray-400">
            {event.type} • {event.startsAt} - {event.endsAt}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
          stats.status.color === 'green' ? 'bg-green-500/20 text-green-400' :
          stats.status.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
          stats.status.color === 'red' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {stats.status.text}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Capacity */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Users className="w-4 h-4" />
            <span>CAPACITEIT</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.totalConfirmedPersons} <span className="text-gray-500 text-lg">/ {event.capacity}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                stats.capacityPercentage >= 100 ? 'bg-red-500' :
                stats.capacityPercentage >= 80 ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">
            {Math.round(stats.capacityPercentage)}% bezet
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>BOEKINGEN</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {stats.totalBookings}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Bevestigd</span>
              <span className="text-green-400 font-semibold">{stats.confirmedCount}</span>
            </div>
            {stats.pendingCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Pending</span>
                <span className="text-yellow-400 font-semibold">{stats.pendingCount}</span>
              </div>
            )}
            {stats.optionCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Optie</span>
                <span className="text-blue-400 font-semibold">{stats.optionCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Waitlist */}
        {stats.waitlistCount > 0 && (
          <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center gap-2 text-orange-400 text-xs mb-2">
              <Clock className="w-4 h-4" />
              <span>WACHTLIJST</span>
            </div>
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {stats.waitlistPersonCount}
            </div>
            <div className="text-xs text-gray-400">
              {stats.waitlistCount} {stats.waitlistCount === 1 ? 'entry' : 'entries'}
            </div>
          </div>
        )}

        {/* Check-ins */}
        {stats.checkedInCount > 0 && (
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>INGECHECKT</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.checkedInCount}
            </div>
            <div className="text-xs text-gray-400">
              {Math.round((stats.checkedInCount / stats.confirmedCount) * 100)}% van bevestigd
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {stats.capacityPercentage >= 90 && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          stats.capacityPercentage >= 100 
            ? 'bg-red-500/10 border border-red-500/30' 
            : 'bg-orange-500/10 border border-orange-500/30'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            stats.capacityPercentage >= 100 ? 'text-red-400' : 'text-orange-400'
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              stats.capacityPercentage >= 100 ? 'text-red-400' : 'text-orange-400'
            }`}>
              {stats.capacityPercentage >= 100 ? 'Event is volledig uitverkocht' : 'Event is bijna vol'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.capacityPercentage >= 100 
                ? stats.waitlistCount > 0 
                  ? `${stats.waitlistPersonCount} mensen staan op de wachtlijst`
                  : 'Overweeg om de wachtlijst te activeren'
                : `Nog ${event.capacity - stats.totalConfirmedPersons} plaatsen beschikbaar`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
