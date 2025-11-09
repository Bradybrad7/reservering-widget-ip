/**
 * MonthOverview - Contextueel dashboard voor de geselecteerde maand
 * 
 * Wordt getoond in de rechter kolom (70%) wanneer GEEN event is geselecteerd.
 * Geeft een visueel overzicht van de hele maand met:
 * - Maand titel
 * - Quick stats specifiek voor deze maand
 * - Compacte kalender view van alleen deze maand
 * 
 * Dit geeft context en overzicht terwijl de admin door de navigator browset.
 */

import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Users, CheckCircle, Euro } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { cn, formatCurrency } from '../../utils';

interface MonthOverviewProps {
  month: number; // 0-11
  year: number;
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  onEventClick: (eventId: string) => void;
}

interface MonthStats {
  totalEvents: number;
  activeEvents: number;
  totalCapacity: number;
  totalBookedPersons: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
}

export const MonthOverview: React.FC<MonthOverviewProps> = ({
  month,
  year,
  events,
  reservations,
  waitlistEntries,
  onEventClick,
}) => {
  // Filter events voor deze specifieke maand
  const monthEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  }, [events, month, year]);

  // Bereken stats voor deze maand
  const monthStats = useMemo((): MonthStats => {
    const activeEvents = monthEvents.filter(e => e.isActive);
    const totalCapacity = monthEvents.reduce((sum, e) => sum + e.capacity, 0);
    
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalBookedPersons = 0;

    monthEvents.forEach(event => {
      const eventReservations = reservations.filter(r => r.eventId === event.id);
      const confirmedReservations = eventReservations.filter(
        r => r.status === 'confirmed' || r.status === 'checked-in'
      );
      
      totalBookings += confirmedReservations.length;
      totalRevenue += confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      totalBookedPersons += confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    });

    const averageOccupancy = totalCapacity > 0 
      ? (totalBookedPersons / totalCapacity) * 100 
      : 0;

    return {
      totalEvents: monthEvents.length,
      activeEvents: activeEvents.length,
      totalCapacity,
      totalBookedPersons,
      totalBookings,
      totalRevenue,
      averageOccupancy
    };
  }, [monthEvents, reservations]);

  // Maak kalender grid voor deze maand
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Start van de week (maandag = 1)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek; // Zondag = 7
    
    const days: (Date | null)[] = [];
    
    // Padding voor dagen vóór de 1e
    for (let i = 1; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dagen van de maand
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [month, year]);

  // Groepeer events per datum
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AdminEvent[]>();
    
    monthEvents.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [monthEvents]);

  const monthLabel = new Date(year, month).toLocaleDateString('nl-NL', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
          <CalendarIcon className="w-7 h-7 text-gold-400" />
          {monthLabel}
        </h2>
        <p className="text-neutral-400 mt-1">
          Overzicht van alle events deze maand
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarIcon}
          label="Events"
          value={monthStats.totalEvents}
          subValue={`${monthStats.activeEvents} actief`}
          color="blue"
        />

        <StatCard
          icon={CheckCircle}
          label="Boekingen"
          value={monthStats.totalBookings}
          subValue={`${monthStats.totalBookedPersons} personen`}
          color="green"
        />

        <StatCard
          icon={TrendingUp}
          label="Bezetting"
          value={`${monthStats.averageOccupancy.toFixed(0)}%`}
          subValue="gemiddeld"
          color="orange"
        />

        <StatCard
          icon={Euro}
          label="Omzet"
          value={formatCurrency(monthStats.totalRevenue)}
          subValue="deze maand"
          color="gold"
        />
      </div>

      {/* Kalender View */}
      <div className="flex-1 bg-neutral-800/50 rounded-xl border border-neutral-700 p-4 overflow-auto">
        <div className="min-w-[500px]">
          {/* Dag Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-neutral-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Kalender Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateKey = day.toDateString();
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'aspect-square rounded-lg border-2 p-2 transition-all',
                    isToday 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-neutral-700 bg-neutral-900/50',
                    dayEvents.length > 0 && 'hover:border-gold-500/50 cursor-pointer'
                  )}
                >
                  {/* Dag nummer */}
                  <div className={cn(
                    'text-sm font-semibold mb-1',
                    isToday ? 'text-gold-400' : 'text-white'
                  )}>
                    {day.getDate()}
                  </div>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event.id)}
                          className={cn(
                            'w-full h-1.5 rounded-full transition-all hover:h-2',
                            event.isActive ? 'bg-green-500' : 'bg-gray-500'
                          )}
                          title={`${event.type} - ${event.startsAt}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-neutral-400 text-center">
                          +{dayEvents.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Klik op een event in de navigator (links) om details te bekijken en te bewerken.
          De kalender hierboven toont alle events van deze maand in één overzicht.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue: string;
  color: 'blue' | 'green' | 'orange' | 'gold';
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    gold: 'text-gold-400',
  };

  return (
    <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
      <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      <div className={cn('text-xs', colorClasses[color])}>
        {subValue}
      </div>
    </div>
  );
};
