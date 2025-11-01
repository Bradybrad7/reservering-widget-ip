import React, { useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  CalendarPlus,
  FileDown,
  RefreshCw,
  ArrowRight,
  Star,
  CreditCard,
  UserCheck,
  Mail
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import { isOptionExpiringSoon, getDaysUntilExpiry } from '../../utils/optionHelpers';
import type { AdminSection } from '../../types';

export const DashboardEnhanced: React.FC = () => {
  // UI state and stats from adminStore
  const { 
    setActiveSection,
    stats,
    isLoadingStats,
    loadStats
  } = useAdminStore();
  
  // Data from specialized stores
  const {
    reservations,
    loadReservations,
    confirmReservation,
    bulkExport
  } = useReservationsStore();
  
  const {
    events,
    loadEvents
  } = useEventsStore();

  useEffect(() => {
    loadStats();
    loadReservations();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate urgent actions
  const urgentData = useMemo(() => {
    const pendingReservations = reservations.filter(r => r.status === 'pending');
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && e.isActive;
    });
    const almostFullEvents = events.filter(e => {
      // Bereken het werkelijke aantal geboekte personen
      const totalBookedPersons = e.reservations.filter(r => 
        r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in'
      ).reduce((sum, r) => sum + r.numberOfPersons, 0);
      const filled = (totalBookedPersons / e.capacity) * 100;
      return filled >= 80 && e.isActive;
    });

    return {
      pendingCount: pendingReservations.length,
      upcomingCount: upcomingEvents.length,
      almostFullCount: almostFullEvents.length,
      pendingReservations,
      upcomingEvents,
      almostFullEvents
    };
  }, [reservations, events]);

  const quickActions = [
    {
      id: 'new-event' as AdminSection,
      label: 'Nieuw Event Aanmaken',
      icon: CalendarPlus,
      color: 'gold',
      action: () => setActiveSection('events')
    },
    {
      id: 'pending-reservations' as AdminSection,
      label: 'Pending Reserveringen',
      icon: Clock,
      color: 'orange',
      badge: urgentData.pendingCount,
      action: () => setActiveSection('reservations')
    },
    {
      id: 'export-data' as AdminSection,
      label: 'Export Data',
      icon: FileDown,
      color: 'blue',
      action: async () => {
        const allIds = reservations.map(r => r.id);
        const blob = await bulkExport(allIds);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reserveringen-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    },
    {
      id: 'customers' as AdminSection,
      label: 'Klanten Beheer',
      icon: Users,
      color: 'purple',
      action: () => setActiveSection('customers')
    }
  ];

  const handleQuickConfirmAll = async () => {
    if (urgentData.pendingCount === 0) return;
    
    if (confirm(`Wil je alle ${urgentData.pendingCount} pending reserveringen bevestigen?`)) {
      for (const reservation of urgentData.pendingReservations) {
        await confirmReservation(reservation.id);
      }
      await loadReservations();
      await loadStats();
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  const thisMonthRevenue = stats?.recentActivity?.revenueThisMonth || 0;
  const lastMonthRevenue = stats?.recentActivity?.revenueLastMonth || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Urgent Actions Banner - Only for pending reservations */}
      {urgentData.pendingCount > 0 && (
        <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Aandacht Vereist</h3>
              <div className="flex items-center justify-between">
                <span className="text-neutral-200">
                  {urgentData.pendingCount} reservering(en) wachten op bevestiging
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection('reservations')}
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Bekijken
                  </button>
                  <button
                    onClick={handleQuickConfirmAll}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Alles Bevestigen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-neutral-800/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-gold-400" />
          Snelle Acties
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              gold: 'bg-gold-500 hover:bg-gold-600',
              orange: 'bg-orange-500 hover:bg-orange-600',
              blue: 'bg-blue-500 hover:bg-blue-600',
              purple: 'bg-purple-500 hover:bg-purple-600'
            };

            return (
              <button
                key={action.id}
                onClick={action.action}
                className={cn(
                  'relative p-4 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg hover:scale-105',
                  colorClasses[action.color as keyof typeof colorClasses]
                )}
              >
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {action.badge}
                  </span>
                )}
                <Icon className="w-6 h-6 mb-2 mx-auto" />
                <div className="text-sm text-center">{action.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards - VERSTERKT: Betere visuele hiërarchie met functionele kleuren */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue - GROEN (positief) */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-green-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            {revenueGrowth !== 0 && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="text-sm text-green-200 font-medium">Totale Omzet</div>
          <div className="text-xs text-neutral-400 mt-2">
            Deze maand: {formatCurrency(thisMonthRevenue)}
          </div>
        </div>

        {/* Total Reservations - BLAUW (informatief) */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.totalReservations || 0}
          </div>
          <div className="text-sm text-blue-200 font-medium">Totale Reserveringen</div>
          <div className="text-xs text-neutral-400 mt-2">
            Gemiddelde groepsgrootte: {stats?.averageGroupSize || 0}
          </div>
        </div>

        {/* Total Events - PAARS (speciale status) */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.totalEvents || 0}
          </div>
          <div className="text-sm text-purple-200 font-medium">Totale Evenementen</div>
          <div className="text-xs text-neutral-400 mt-2">
            Aankomend deze week: {urgentData.upcomingCount}
          </div>
        </div>

        {/* Popular Arrangement - GOUD (branding) */}
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border-2 border-gold-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-gold-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 text-gold-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.popularArrangement || 'BWF'}
          </div>
          <div className="text-sm text-gold-200 font-medium">Populairste Arrangement</div>
          <div className="text-xs text-neutral-400 mt-2">
            Meest geboekt
          </div>
        </div>
      </div>

      {/* ✨ VERSTERKT: Financial & Operations Widgets met functionele iconen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Openstaande Betalingen - ORANJE met CreditCard icoon */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/40 rounded-lg p-6 hover:shadow-lg hover:shadow-orange-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-orange-400" />
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {reservations.filter(r => 
              r.paymentStatus === 'overdue' || r.paymentStatus === 'pending'
            ).length}
          </div>
          <div className="text-sm text-orange-200 font-medium mb-2">Openstaande Betalingen</div>
          <div className="text-xs text-neutral-400">
            Totaal: {formatCurrency(
              reservations
                .filter(r => r.paymentStatus === 'overdue' || r.paymentStatus === 'pending')
                .reduce((sum, r) => sum + r.totalPrice, 0)
            )}
          </div>
          <button
            onClick={() => setActiveSection('reservations')}
            className="mt-3 w-full py-2 bg-orange-500/30 hover:bg-orange-500/40 text-orange-200 font-medium rounded-lg text-sm transition-colors"
          >
            Bekijk Openstaande
          </button>
        </div>

        {/* Te Bevestigen Boekingen - ORANJE met Clock icoon */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/40 rounded-lg p-6 hover:shadow-lg hover:shadow-orange-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-400" />
            <CheckCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {reservations.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-orange-200 font-medium mb-2">Te Bevestigen Boekingen</div>
          <div className="text-xs text-neutral-400">
            Waarde: {formatCurrency(
              reservations
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + r.totalPrice, 0)
            )}
          </div>
          <button
            onClick={handleQuickConfirmAll}
            disabled={urgentData.pendingCount === 0}
            className="mt-3 w-full py-2 bg-orange-500/30 hover:bg-orange-500/40 text-orange-200 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bevestig Alles
          </button>
        </div>

        {/* ✨ NEW: Aflopende Opties - ROOD met AlertCircle icoon (October 2025) */}
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/40 rounded-lg p-6 hover:shadow-lg hover:shadow-red-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <Clock className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {reservations.filter(r => 
              r.status === 'option' && isOptionExpiringSoon(r)
            ).length}
          </div>
          <div className="text-sm text-red-200 font-medium mb-2">Aflopende Opties</div>
          <div className="text-xs text-neutral-400">
            Binnen 3 dagen: {reservations.filter(r => {
              if (r.status !== 'option') return false;
              const days = getDaysUntilExpiry(r);
              return days !== null && days <= 3 && days > 0;
            }).length}
          </div>
          <button
            onClick={() => setActiveSection('reservations')}
            className="mt-3 w-full py-2 bg-red-500/30 hover:bg-red-500/40 text-red-200 font-medium rounded-lg text-sm transition-colors"
          >
            Bekijk Opties
          </button>
        </div>

        {/* Vandaag Inchecken - BLAUW met UserCheck icoon */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/40 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="w-8 h-8 text-blue-400" />
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {reservations.filter(r => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const eventDate = new Date(r.eventDate);
              eventDate.setHours(0, 0, 0, 0);
              return eventDate.getTime() === today.getTime() && 
                     (r.status === 'confirmed' || r.status === 'checked-in');
            }).length}
          </div>
          <div className="text-sm text-blue-200 font-medium mb-2">Vandaag Inchecken</div>
          <div className="text-xs text-neutral-400">
            {reservations
              .filter(r => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const eventDate = new Date(r.eventDate);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === today.getTime() && 
                       (r.status === 'confirmed' || r.status === 'checked-in');
              })
              .reduce((sum, r) => sum + r.numberOfPersons, 0)
            } personen
          </div>
          <button
            onClick={() => setActiveSection('reservations')}
            className="mt-3 w-full py-2 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 font-medium rounded-lg text-sm transition-colors"
          >
            Toon Check-ins
          </button>
        </div>
      </div>

      {/* ✨ NEW: Urgente Acties Widgets (October 2025) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aflopende Opties Details */}
        {(() => {
          const expiringOptions = reservations.filter(r => 
            r.status === 'option' && isOptionExpiringSoon(r)
          ).sort((a, b) => {
            const daysA = getDaysUntilExpiry(a) || 999;
            const daysB = getDaysUntilExpiry(b) || 999;
            return daysA - daysB;
          });

          if (expiringOptions.length === 0) return null;

          return (
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Aflopende Opties ({expiringOptions.length})
              </h3>
              <div className="space-y-3">
                {expiringOptions.slice(0, 5).map(reservation => {
                  const days = getDaysUntilExpiry(reservation);
                  const isUrgent = days !== null && days <= 1;

                  return (
                    <button
                      key={reservation.id}
                      onClick={() => setActiveSection('reservations')}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg hover:bg-neutral-800/50 transition-colors text-left border border-red-500/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {reservation.companyName || reservation.contactPerson}
                          {isUrgent && (
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-semibold text-red-400">
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-400">
                          {reservation.numberOfPersons} personen - {formatCurrency(reservation.totalPrice)}
                        </div>
                        <div className="text-xs text-red-400 mt-1">
                          ⏰ Verloopt {days === 0 ? 'vandaag' : days === 1 ? 'morgen' : `over ${days} dagen`}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await confirmReservation(reservation.id);
                            await loadReservations();
                            await loadStats();
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                        >
                          Bevestig
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Betalingen Te Laat Details */}
        {(() => {
          const overduePayments = reservations.filter(r => 
            r.paymentStatus === 'overdue' && r.status !== 'cancelled'
          ).sort((a, b) => {
            // Sort by payment due date if available
            const dateA = a.paymentDueDate ? new Date(a.paymentDueDate).getTime() : 0;
            const dateB = b.paymentDueDate ? new Date(b.paymentDueDate).getTime() : 0;
            return dateA - dateB;
          });

          if (overduePayments.length === 0) return null;

          return (
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-400" />
                Betalingen Te Laat ({overduePayments.length})
              </h3>
              <div className="space-y-3">
                {overduePayments.slice(0, 5).map(reservation => {
                  const daysSince = reservation.paymentDueDate 
                    ? Math.floor((new Date().getTime() - new Date(reservation.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <button
                      key={reservation.id}
                      onClick={() => setActiveSection('reservations')}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg hover:bg-neutral-800/50 transition-colors text-left border border-red-500/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {reservation.companyName || reservation.contactPerson}
                        </div>
                        <div className="text-sm text-neutral-400 flex items-center gap-2">
                          <span>{formatCurrency(reservation.totalPrice)}</span>
                          {daysSince !== null && (
                            <span className="text-red-400">
                              • {daysSince} {daysSince === 1 ? 'dag' : 'dagen'} te laat
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {reservation.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Send payment reminder
                            window.open(`mailto:${reservation.email}?subject=Herinnering Betaling Reservering ${reservation.id}`, '_blank');
                          }}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                          title="Stuur herinnering"
                        >
                          <Mail className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  );
                })}
                {overduePayments.length > 5 && (
                  <button
                    onClick={() => setActiveSection('reservations')}
                    className="w-full text-center text-sm text-red-400 hover:text-red-300 py-2"
                  >
                    +{overduePayments.length - 5} meer bekijken
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Recent Activity - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-neutral-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Aankomende Events (7 dagen)</span>
            <button
              onClick={() => setActiveSection('events')}
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              Alle events <ArrowRight className="w-4 h-4" />
            </button>
          </h3>
          <div className="space-y-3">
            {urgentData.upcomingEvents.length === 0 ? (
              <p className="text-neutral-500 text-sm">Geen aankomende events</p>
            ) : (
              urgentData.upcomingEvents.slice(0, 5).map((event) => {
                const eventDate = new Date(event.date);
                // Bereken het werkelijke aantal geboekte personen
                const totalBookedPersons = event.reservations.filter(r => 
                  r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in'
                ).reduce((sum, r) => sum + r.numberOfPersons, 0);
                const filled = (totalBookedPersons / event.capacity) * 100;
                // Haal wachtlijst-totaal op
                const waitlistCount = useWaitlistStore.getState().getWaitlistCount(event.id);
                
                // Check if this is today's event
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const eventDateOnly = new Date(eventDate);
                eventDateOnly.setHours(0, 0, 0, 0);
                const isToday = eventDateOnly.getTime() === today.getTime();
                
                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      if (isToday) {
                        // ⚡ Quick Check-in: Navigate to today's check-in for this event
                        setActiveSection('checkin');
                        // TODO: Pass eventId to CheckInManager to auto-select
                      } else {
                        setActiveSection('events');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        {formatDate(eventDate)}
                        {isToday && (
                          <span className="px-2 py-0.5 bg-gold-500/20 border border-gold-500/40 rounded-full text-xs font-semibold text-gold-400">
                            Vandaag
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400">
                        Geboekt: <span className={cn(
                          "font-semibold",
                          totalBookedPersons > event.capacity ? "text-red-400" : "text-white"
                        )}>{totalBookedPersons}</span> / {event.capacity}
                        {waitlistCount > 0 && (
                          <span className="ml-1 text-orange-400"> (+{waitlistCount} wachtlijst)</span>
                        )}
                      </div>
                      {isToday && (
                        <div className="text-xs text-gold-400 mt-1">
                          → Klik voor snelle check-in
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      filled >= 80 ? 'bg-red-500/20 text-red-400' :
                      filled >= 50 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    )}>
                      {filled >= 80 ? 'Bijna vol' : filled >= 50 ? 'Halvol' : 'Beschikbaar'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Pending Reservations */}
        <div className="bg-neutral-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Recente Pending Reserveringen</span>
            <button
              onClick={() => setActiveSection('reservations')}
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              Alle pending <ArrowRight className="w-4 h-4" />
            </button>
          </h3>
          <div className="space-y-3">
            {urgentData.pendingReservations.length === 0 ? (
              <p className="text-neutral-500 text-sm">Geen pending reserveringen</p>
            ) : (
              urgentData.pendingReservations.slice(0, 5).map((reservation) => {
                // ⚡ CRM: Check if this is a returning customer
                const isReturningCustomer = reservation.communicationLog?.some(
                  log => log.message?.includes('Terugkerende klant')
                );
                const isVIP = reservation.communicationLog?.some(
                  log => log.message?.includes('VIP/Corporate')
                );
                
                return (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-white">{reservation.companyName}</div>
                        {isVIP && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-full text-xs font-semibold text-yellow-400">
                            <Star className="w-3 h-3" /> VIP
                          </span>
                        )}
                        {isReturningCustomer && !isVIP && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400">
                            🔁 Terugkerend
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {reservation.numberOfPersons} personen - {formatCurrency(reservation.totalPrice)}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await confirmReservation(reservation.id);
                        await loadReservations();
                        await loadStats();
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      Bevestig
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
