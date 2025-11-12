import React, { useMemo } from 'react';
import { Sun, AlertCircle, TrendingUp, Calendar, Users, Sparkles } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';
import { isOptionExpiringSoon, getDaysUntilExpiry } from '../../../utils/optionHelpers';
import { cn } from '../../../utils';

/**
 * Intelligente Dagelijkse Briefing Widget
 * 
 * Vat de dag samen in één persoonlijke widget.
 * Prioriteert acties en identificeert kansen.
 */
export const DailyFocusWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  const dailyInsights = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's check-ins
    const todayCheckIns = reservations.filter(r => {
      const eventDate = new Date(r.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime() && 
             (r.status === 'confirmed' || r.status === 'checked-in');
    });
    const todayPersons = todayCheckIns.reduce((sum, r) => sum + r.numberOfPersons, 0);

    // Urgent actions
    const expiringToday = reservations.filter(r => {
      if (r.status !== 'option') return false;
      const days = getDaysUntilExpiry(r);
      return days === 0;
    }).length;

    const overduePayments = reservations.filter(r => 
      r.paymentStatus === 'overdue' && r.status !== 'cancelled'
    ).length;

    const pendingReservations = reservations.filter(r => r.status === 'pending').length;

    // Opportunities (Almost full events in next 14 days)
    const opportunities = events.filter(e => {
      const eventDate = new Date(e.date);
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0 || daysUntil > 14 || !e.isActive) return false;

      const totalBookedPersons = e.reservations?.filter(r => 
        r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
      ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
      
      const utilization = (totalBookedPersons / e.capacity) * 100;
      return utilization >= 80 && utilization < 100;
    });

    const topOpportunity = opportunities.sort((a, b) => {
      const aUtil = ((a.reservations?.filter(r => 
        r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
      ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0) / a.capacity) * 100;
      
      const bUtil = ((b.reservations?.filter(r => 
        r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
      ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0) / b.capacity) * 100;
      
      return bUtil - aUtil;
    })[0];

    const urgentCount = expiringToday + overduePayments + pendingReservations;

    return {
      todayCheckIns: todayCheckIns.length,
      todayPersons,
      urgentCount,
      expiringToday,
      overduePayments,
      pendingReservations,
      topOpportunity,
      hasUrgentActions: urgentCount > 0,
      hasCheckIns: todayCheckIns.length > 0
    };
  }, [reservations, events]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  const getTopOpportunityUtil = () => {
    if (!dailyInsights.topOpportunity) return 0;
    const booked = dailyInsights.topOpportunity.reservations?.filter(r => 
      r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
    ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
    return Math.round((booked / dailyInsights.topOpportunity.capacity) * 100);
  };

  return (
    <div className="bg-gradient-to-br from-gold-500/20 via-purple-500/10 to-blue-500/10 border-2 border-gold-500/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold-500/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {getGreeting()} 👋
            </h3>
            <p className="text-sm text-neutral-300">Je dag in één oogopslag</p>
          </div>
        </div>
        <Sun className="w-8 h-8 text-gold-400 opacity-50" />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Check-ins */}
        <button
          onClick={() => setActiveSection('checkin')}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left',
            dailyInsights.hasCheckIns
              ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
              : 'bg-neutral-800/30 border-neutral-700/30'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className={cn(
              'w-5 h-5',
              dailyInsights.hasCheckIns ? 'text-blue-400' : 'text-neutral-500'
            )} />
            <span className="text-xs font-medium text-neutral-400 uppercase">Vandaag Inchecken</span>
          </div>
          <div className={cn(
            'text-2xl font-bold mb-1',
            dailyInsights.hasCheckIns ? 'text-white' : 'text-neutral-500'
          )}>
            {dailyInsights.todayCheckIns} {dailyInsights.todayCheckIns === 1 ? 'reservering' : 'reserveringen'}
          </div>
          <div className="text-sm text-neutral-400">
            {dailyInsights.todayPersons} {dailyInsights.todayPersons === 1 ? 'gast' : 'gasten'} verwacht
          </div>
        </button>

        {/* Urgent Actions */}
        <button
          onClick={() => setActiveSection('reservations')}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left',
            dailyInsights.hasUrgentActions
              ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
              : 'bg-green-500/10 border-green-500/30'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={cn(
              'w-5 h-5',
              dailyInsights.hasUrgentActions ? 'text-red-400' : 'text-green-400'
            )} />
            <span className="text-xs font-medium text-neutral-400 uppercase">Urgente Acties</span>
          </div>
          <div className={cn(
            'text-2xl font-bold mb-1',
            dailyInsights.hasUrgentActions ? 'text-white' : 'text-green-400'
          )}>
            {dailyInsights.hasUrgentActions ? dailyInsights.urgentCount : 'Alles op orde'}
          </div>
          {dailyInsights.hasUrgentActions && (
            <div className="text-sm text-neutral-400 space-y-1">
              {dailyInsights.expiringToday > 0 && (
                <div>• {dailyInsights.expiringToday} optie(s) verloopt vandaag</div>
              )}
              {dailyInsights.overduePayments > 0 && (
                <div>• {dailyInsights.overduePayments} betaling(en) te laat</div>
              )}
              {dailyInsights.pendingReservations > 0 && (
                <div>• {dailyInsights.pendingReservations} te bevestigen</div>
              )}
            </div>
          )}
          {!dailyInsights.hasUrgentActions && (
            <div className="text-sm text-green-300">Geen urgente taken</div>
          )}
        </button>

        {/* Opportunity */}
        <button
          onClick={() => setActiveSection('events')}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left',
            dailyInsights.topOpportunity
              ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
              : 'bg-neutral-800/30 border-neutral-700/30'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={cn(
              'w-5 h-5',
              dailyInsights.topOpportunity ? 'text-orange-400' : 'text-neutral-500'
            )} />
            <span className="text-xs font-medium text-neutral-400 uppercase">Kans van de Dag</span>
          </div>
          {dailyInsights.topOpportunity ? (
            <>
              <div className="text-lg font-bold text-white mb-1">
                {dailyInsights.topOpportunity.showId} - {dailyInsights.topOpportunity.type}
              </div>
              <div className="text-sm text-orange-300 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date(dailyInsights.topOpportunity.date).toLocaleDateString('nl-NL', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
                <span className="ml-auto text-orange-400 font-bold">
                  {getTopOpportunityUtil()}% vol
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-neutral-500 mb-1">
                Geen kansen nu
              </div>
              <div className="text-sm text-neutral-400">
                Alle events zijn voldoende bezet
              </div>
            </>
          )}
        </button>
      </div>

      {/* Action Bar */}
      {dailyInsights.hasUrgentActions && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">
              💡 Start hier met je prioriteiten
            </span>
            <button
              onClick={() => setActiveSection('reservations')}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Bekijk Acties
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
