/**
 * EventWorkshopOverview - Tab 1: Overzicht
 * 
 * De standaard landing pagina voor de Event Werkplaats.
 * Combineert bestaande QuickStats met de nieuwe FocusPointsWidget voor
 * snelle inzichten en actie-gerichte informatie.
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { cn, formatCurrency } from '../../utils';
import { FocusPointsWidget } from './FocusPointsWidget';

interface EventWorkshopOverviewProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  onEventClick: (eventId: string) => void;
}

interface QuickStats {
  totalEvents: number;
  activeEvents: number;
  totalCapacity: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
}

export const EventWorkshopOverview: React.FC<EventWorkshopOverviewProps> = ({
  events,
  reservations,
  waitlistEntries,
  onEventClick,
}) => {
  // Bereken quick statistieken
  const quickStats = useMemo((): QuickStats => {
    const activeEvents = events.filter(e => e.isActive);
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
    
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalOccupiedCapacity = 0;

    events.forEach(event => {
      const eventReservations = reservations.filter(r => r.eventId === event.id);
      const confirmedReservations = eventReservations.filter(
        r => r.status === 'confirmed' || r.status === 'checked-in'
      );
      
      totalBookings += confirmedReservations.length;
      totalRevenue += confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      totalOccupiedCapacity += confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    });

    const averageOccupancy = totalCapacity > 0 
      ? (totalOccupiedCapacity / totalCapacity) * 100 
      : 0;

    return {
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      totalCapacity,
      totalBookings,
      totalRevenue,
      averageOccupancy
    };
  }, [events, reservations]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          📊 Overzicht
        </h2>
        <p className="text-neutral-400 mt-2">
          In één oogopslag: wat heeft jouw aandacht nodig?
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Calendar}
          label="Events"
          value={quickStats.totalEvents}
          subValue={`${quickStats.activeEvents} actief`}
          color="blue"
        />

        <StatCard
          icon={Users}
          label="Capaciteit"
          value={quickStats.totalCapacity}
          subValue="totale plaatsen"
          color="purple"
        />

        <StatCard
          icon={CheckCircle}
          label="Reserveringen"
          value={quickStats.totalBookings}
          subValue="bevestigd"
          color="green"
        />

        <StatCard
          icon={TrendingUp}
          label="Bezetting"
          value={`${quickStats.averageOccupancy.toFixed(0)}%`}
          subValue="gemiddeld"
          color="orange"
        />

        <StatCard
          icon={DollarSign}
          label="Omzet"
          value={formatCurrency(quickStats.totalRevenue)}
          subValue="totale omzet"
          color="gold"
          span="col-span-2"
        />
      </div>

      {/* Focus Points Widget */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">🎯 Focus Punten</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Events die jouw aandacht nodig hebben
          </p>
        </div>

        <FocusPointsWidget
          events={events}
          reservations={reservations}
          waitlistEntries={waitlistEntries}
          onEventClick={onEventClick}
        />
      </div>

      {/* Helpende Text */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h4 className="text-lg font-semibold text-white mb-2">💡 Hoe werkt de Werkplaats?</h4>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">📊</span>
            <span><strong>Overzicht (deze pagina):</strong> Quick stats en focus punten voor snelle beslissingen</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-400 font-bold">🛠️</span>
            <span><strong>Werkplaats:</strong> Beheer alle events met filters, kalender en inline editing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">⚙️</span>
            <span><strong>Tools & Bulk:</strong> Bulk acties, dupliceren en exporteren</span>
          </li>
        </ul>
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
  color: 'blue' | 'purple' | 'green' | 'orange' | 'gold';
  span?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  span,
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    gold: 'text-gold-400',
  };

  return (
    <div className={cn(
      'bg-neutral-800/50 rounded-xl p-4 border border-neutral-700',
      span
    )}>
      <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
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
