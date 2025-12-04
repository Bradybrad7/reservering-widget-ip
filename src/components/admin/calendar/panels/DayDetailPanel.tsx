import React, { useMemo } from 'react';
import { X, Calendar, Users, DollarSign, Plus, TrendingUp } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../../../utils';

interface DayDetailPanelProps {
  date: Date;
  events: any[];
  reservations: any[];
  onClose: () => void;
  onAddEvent: () => void;
}

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  date,
  events,
  reservations,
  onClose,
  onAddEvent
}) => {
  // Get reservations for this day
  const dayReservations = useMemo(() => {
    return reservations.filter(res => {
      const event = events.find(e => e.id === res.eventId);
      if (!event) return false;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, date);
    });
  }, [date, events, reservations]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const totalBookings = dayReservations.length;
    const totalPersons = dayReservations.reduce((sum, res) => sum + (res.numberOfPersons || 0), 0);
    const totalRevenue = dayReservations.reduce((sum, res) => sum + (res.totalPrice || 0), 0);
    
    const totalCapacity = events.reduce((sum, event) => sum + (event.maxCapacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalPersons / totalCapacity) * 100) : 0;

    return { totalEvents, totalBookings, totalPersons, totalRevenue, occupancyRate };
  }, [events, dayReservations]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {format(date, 'EEEE', { locale: nl })}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {format(date, 'd MMMM yyyy', { locale: nl })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="p-6 border-b border-slate-700 grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Events</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs">Reserveringen</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Bezetting</span>
          </div>
          <div className={cn(
            'text-2xl font-bold',
            stats.occupancyRate >= 90 ? 'text-red-400' : stats.occupancyRate >= 70 ? 'text-orange-400' : 'text-green-400'
          )}>
            {stats.occupancyRate}%
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Omzet</span>
          </div>
          <div className="text-2xl font-bold text-[#d4af37]">
            €{stats.totalRevenue.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white">Events ({events.length})</h4>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37] hover:bg-[#c19b2f] text-slate-900 text-sm font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Geen events gepland</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const eventReservations = dayReservations.filter(r => r.eventId === event.id);
              const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
              const occupancy = event.capacity > 0 ? Math.round((bookedSeats / event.capacity) * 100) : 0;

              return (
                <button
                  key={event.id}
                  onClick={onAddEvent}
                  className="w-full p-4 bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-white">
                        {event.type?.replace('_', ' ').charAt(0).toUpperCase() + event.type?.slice(1).replace('_', ' ') || 'Event'}
                      </div>
                      <div className="text-sm text-slate-400">⏰ {event.startsAt}</div>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-bold',
                      !event.isActive ? 'bg-slate-700 text-slate-400' :
                      occupancy >= 100 ? 'bg-red-500/20 text-red-300' :
                      'bg-green-500/20 text-green-300'
                    )}>
                      {!event.isActive ? 'Inactief' :
                       occupancy >= 100 ? 'Uitverkocht' : 'Actief'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{bookedSeats} / {event.capacity}</span>
                    </div>
                    <div className={cn(
                      'font-bold',
                      occupancy >= 90 ? 'text-red-400' : occupancy >= 70 ? 'text-orange-400' : 'text-green-400'
                    )}>
                      {occupancy}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
