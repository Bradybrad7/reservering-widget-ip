/**
 * DashboardTab - Tab 1: "📊 Dashboard"
 * 
 * DOEL: De admin in 5 seconden vertellen wat de status is en welke boekingen directe actie vereisen.
 * 
 * COMPONENTEN:
 * - QuickStats: Interactieve statistieken (klikbaar om naar Werkplaats te navigeren)
 * - FocusPoints: Widget met urgente items (verlopen opties, pending requests, late payments)
 */

import React, { useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import type { Reservation, Event } from '../../../types';
import { isOptionExpired, isOptionExpiringSoon } from '../../../utils/optionHelpers';
import { formatCurrency, formatDate, cn } from '../../../utils';

interface DashboardTabProps {
  reservations: Reservation[];
  events: Event[];
  onNavigateToFiltered: (filter: {
    status?: Reservation['status'];
    payment?: 'paid' | 'pending' | 'overdue';
    custom?: string;
  }) => void;
  onRefresh: () => void;
}

interface QuickStats {
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  optionCount: number;
  cancelledCount: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalPersons: number;
  averageGroupSize: number;
  paymentDeadlineWarnings: number;
  optionExpiringWarnings: number;
}

interface FocusItem {
  id: string;
  type: 'option-expiring' | 'pending-request' | 'payment-overdue';
  title: string;
  subtitle: string;
  urgency: 'high' | 'medium' | 'low';
  reservation: Reservation;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  reservations,
  events,
  onNavigateToFiltered,
  onRefresh
}) => {
  
  // Bereken Quick Stats
  const quickStats = useMemo((): QuickStats => {
    const activeReservations = reservations.filter(r => r.status !== 'waitlist');
    const totalReservations = activeReservations.length;
    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    const confirmedCount = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked-in').length;
    const optionCount = reservations.filter(r => r.status === 'option').length;
    const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

    const confirmedReservations = reservations.filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );
    
    const totalRevenue = confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const paidRevenue = confirmedReservations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const pendingRevenue = totalRevenue - paidRevenue;

    const totalPersons = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const averageGroupSize = confirmedReservations.length > 0 
      ? totalPersons / confirmedReservations.length 
      : 0;

    // Warnings
    const now = new Date();
    
    // Payment deadline warnings (betaling pending + deadline verstreken)
    const paymentDeadlineWarnings = reservations.filter(r => {
      if (r.paymentStatus !== 'pending' || !r.paymentDueDate) return false;
      return new Date(r.paymentDueDate) < now;
    }).length;

    // Option expiring warnings
    const optionExpiringWarnings = reservations.filter(r => {
      return r.status === 'option' && (isOptionExpired(r) || isOptionExpiringSoon(r));
    }).length;

    return {
      totalReservations,
      pendingCount,
      confirmedCount,
      optionCount,
      cancelledCount,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalPersons,
      averageGroupSize,
      paymentDeadlineWarnings,
      optionExpiringWarnings
    };
  }, [reservations]);

  // Bereken Focus Points (urgente items)
  const focusItems = useMemo((): FocusItem[] => {
    const items: FocusItem[] = [];
    const now = new Date();

    // 1. Opties die vandaag/morgen verlopen
    reservations
      .filter(r => r.status === 'option' && isOptionExpiringSoon(r))
      .forEach(r => {
        const event = events.find(e => e.id === r.eventId);
        const expiryDate = r.optionExpiresAt ? new Date(r.optionExpiresAt) : null;
        const daysUntil = expiryDate 
          ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        items.push({
          id: r.id,
          type: 'option-expiring',
          title: `⚠️ Optie verloopt ${daysUntil === 0 ? 'vandaag' : daysUntil === 1 ? 'morgen' : `over ${daysUntil} dagen`}`,
          subtitle: `${r.contactPerson} • ${event ? formatDate(event.date) : 'Event onbekend'} • ${formatCurrency(r.totalPrice || 0)}`,
          urgency: daysUntil === 0 ? 'high' : 'medium',
          reservation: r
        });
      });

    // 2. Nieuwe Aanvragen (Pending)
    reservations
      .filter(r => r.status === 'pending')
      .slice(0, 5) // Max 5 tonen
      .forEach(r => {
        const event = events.find(e => e.id === r.eventId);
        items.push({
          id: r.id,
          type: 'pending-request',
          title: `📋 Nieuwe aanvraag van ${r.contactPerson}`,
          subtitle: `${r.numberOfPersons} personen • ${event ? formatDate(event.date) : 'Event onbekend'} • ${formatCurrency(r.totalPrice || 0)}`,
          urgency: 'medium',
          reservation: r
        });
      });

    // 3. Betalingstermijn Verstreken
    reservations
      .filter(r => {
        if (r.paymentStatus !== 'pending' || !r.paymentDueDate) return false;
        return new Date(r.paymentDueDate) < now;
      })
      .forEach(r => {
        const event = events.find(e => e.id === r.eventId);
        const daysOverdue = Math.floor((now.getTime() - new Date(r.paymentDueDate!).getTime()) / (1000 * 60 * 60 * 24));
        
        items.push({
          id: r.id,
          type: 'payment-overdue',
          title: `❌ Betaling ${daysOverdue} dagen te laat`,
          subtitle: `${r.contactPerson} • ${event ? formatDate(event.date) : 'Event onbekend'} • ${formatCurrency(r.totalPrice || 0)}`,
          urgency: 'high',
          reservation: r
        });
      });

    // Sort: high urgency first
    return items.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [reservations, events]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        
        {/* Interactieve Quick Stats */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            📊 Overzicht
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Totaal */}
            <StatCard
              icon={Users}
              label="Totaal"
              value={quickStats.totalReservations}
              sublabel="reserveringen"
              color="neutral"
              onClick={() => onNavigateToFiltered({})}
            />

            {/* Pending (KLIKBAAR → filter status: pending) */}
            <StatCard
              icon={Clock}
              label="In afwachting"
              value={quickStats.pendingCount}
              sublabel={quickStats.optionExpiringWarnings > 0 ? `⚠️ ${quickStats.optionExpiringWarnings} opties verlopen` : undefined}
              color="yellow"
              onClick={() => onNavigateToFiltered({ status: 'pending' })}
              clickable
            />

            {/* Confirmed */}
            <StatCard
              icon={CheckCircle}
              label="Bevestigd"
              value={quickStats.confirmedCount}
              sublabel={`${quickStats.totalPersons} personen`}
              color="green"
              onClick={() => onNavigateToFiltered({ status: 'confirmed' })}
              clickable
            />

            {/* Opties (KLIKBAAR → filter status: option) */}
            <StatCard
              icon={AlertCircle}
              label="Opties"
              value={quickStats.optionCount}
              sublabel="1-week hold"
              color="purple"
              onClick={() => onNavigateToFiltered({ status: 'option' })}
              clickable
            />

            {/* Omzet */}
            <StatCard
              icon={DollarSign}
              label="Omzet"
              value={`€${quickStats.totalRevenue.toFixed(0)}`}
              sublabel={`€${quickStats.paidRevenue.toFixed(0)} betaald`}
              color="neutral"
            />

            {/* Openstaand (KLIKBAAR → filter payment: pending) */}
            <StatCard
              icon={CreditCard}
              label="Openstaand"
              value={`€${quickStats.pendingRevenue.toFixed(0)}`}
              sublabel={quickStats.paymentDeadlineWarnings > 0 ? `⚠️ ${quickStats.paymentDeadlineWarnings} te laat` : undefined}
              color="orange"
              onClick={() => onNavigateToFiltered({ payment: 'pending' })}
              clickable
            />
          </div>
        </div>

        {/* Focus Points Widget */}
        {focusItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🎯 Aandachtspunten
              <span className="text-sm text-neutral-400 font-normal">
                ({focusItems.length} items)
              </span>
            </h2>

            <div className="space-y-3">
              {focusItems.map((item) => (
                <FocusItemCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    // Navigate naar werkplaats met focus op deze reservering
                    if (item.type === 'option-expiring') {
                      onNavigateToFiltered({ status: 'option' });
                    } else if (item.type === 'pending-request') {
                      onNavigateToFiltered({ status: 'pending' });
                    } else if (item.type === 'payment-overdue') {
                      onNavigateToFiltered({ payment: 'overdue' });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lege state als er geen focus items zijn */}
        {focusItems.length === 0 && (
          <div className="bg-neutral-800/30 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Alles onder controle!
            </h3>
            <p className="text-neutral-400">
              Geen urgente items die aandacht vereisen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================
// Sub-componenten
// ============================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sublabel?: string;
  color: 'neutral' | 'yellow' | 'green' | 'purple' | 'orange';
  onClick?: () => void;
  clickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
  onClick,
  clickable = false
}) => {
  const colorClasses = {
    neutral: 'text-neutral-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400'
  };

  return (
    <div
      className={cn(
        'bg-neutral-900/50 rounded-lg p-4 transition-all',
        clickable && 'cursor-pointer hover:bg-neutral-800/70 hover:scale-105'
      )}
      onClick={clickable ? onClick : undefined}
    >
      <div className={cn('flex items-center gap-2 text-sm mb-1', colorClasses[color])}>
        <Icon className="w-4 h-4" />
        {label}
        {clickable && <span className="text-xs opacity-50">→</span>}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
      </div>
      {sublabel && (
        <div className={cn(
          'text-xs mt-1',
          sublabel.includes('⚠️') ? 'text-orange-400' : 'text-neutral-400'
        )}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

interface FocusItemCardProps {
  item: FocusItem;
  onClick: () => void;
}

const FocusItemCard: React.FC<FocusItemCardProps> = ({ item, onClick }) => {
  const urgencyColors = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-orange-500/50 bg-orange-500/10',
    low: 'border-yellow-500/50 bg-yellow-500/10'
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 cursor-pointer hover:bg-neutral-800/50 transition-all',
        urgencyColors[item.urgency]
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium text-white mb-1">
            {item.title}
          </div>
          <div className="text-sm text-neutral-400">
            {item.subtitle}
          </div>
        </div>
        <button className="text-neutral-400 hover:text-white transition-colors">
          →
        </button>
      </div>
    </div>
  );
};
