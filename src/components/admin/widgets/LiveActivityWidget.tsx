import React, { useMemo } from 'react';
import { Activity, DollarSign, UserPlus, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { formatCurrency, formatDate, cn } from '../../../utils';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'checkin' | 'capacity-alert' | 'waitlist';
  timestamp: Date;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Live Activiteiten Tijdlijn Widget
 * 
 * Real-time feed van recente activiteiten.
 * Geeft het dashboard een "levend" gevoel.
 */
export const LiveActivityWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Recent bookings (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    reservations
      .filter(r => new Date(r.createdAt) > oneDayAgo)
      .slice(0, 5)
      .forEach(reservation => {
        items.push({
          id: `booking-${reservation.id}`,
          type: 'booking',
          timestamp: new Date(reservation.createdAt),
          title: `Nieuwe boeking (${reservation.numberOfPersons}p)`,
          subtitle: `${reservation.companyName || reservation.contactPerson} - ${reservation.arrangement}`,
          icon: UserPlus,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        });
      });

    // Recent payments (confirmed reservations in last 24h with paid status)
    reservations
      .filter(r => 
        r.paymentStatus === 'paid' && 
        r.paymentReceivedAt && 
        new Date(r.paymentReceivedAt) > oneDayAgo
      )
      .slice(0, 3)
      .forEach(reservation => {
        items.push({
          id: `payment-${reservation.id}`,
          type: 'payment',
          timestamp: new Date(reservation.paymentReceivedAt!),
          title: `Betaling ontvangen (${formatCurrency(reservation.totalPrice)})`,
          subtitle: `Reservering #${reservation.id.substring(0, 8)}`,
          icon: DollarSign,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30'
        });
      });

    // Recent check-ins (last 24h)
    reservations
      .filter(r => r.status === 'checked-in')
      .slice(0, 3)
      .forEach(reservation => {
        items.push({
          id: `checkin-${reservation.id}`,
          type: 'checkin',
          timestamp: new Date(reservation.createdAt), // Would ideally have checkInDate
          title: `Gast ingecheckt`,
          subtitle: `${reservation.companyName || reservation.contactPerson} (${reservation.numberOfPersons}p)`,
          icon: CheckCircle,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30'
        });
      });

    // Capacity alerts (events reaching 80%+ in next 7 days)
    const now = new Date();
    events
      .filter(e => {
        const eventDate = new Date(e.date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0 || daysUntil > 7 || !e.isActive) return false;

        const totalBookedPersons = e.reservations?.filter(r => 
          r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
        ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
        
        const utilization = (totalBookedPersons / e.capacity) * 100;
        return utilization >= 80;
      })
      .slice(0, 2)
      .forEach(event => {
        const totalBookedPersons = event.reservations?.filter(r => 
          r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
        ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
        
        const utilization = Math.round((totalBookedPersons / event.capacity) * 100);

        items.push({
          id: `capacity-${event.id}`,
          type: 'capacity-alert',
          timestamp: new Date(), // Current time for alerts
          title: `'${event.showId}' is nu ${utilization}% vol`,
          subtitle: formatDate(event.date),
          icon: TrendingUp,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30'
        });
      });

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  }, [reservations, events]);

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Zojuist';
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    return timestamp.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  if (activities.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <Activity className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50 animate-pulse" />
        <p className="text-neutral-400">Wachten op activiteit...</p>
        <p className="text-xs text-neutral-500 mt-1">Nieuwe events verschijnen hier automatisch</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold-400 animate-pulse" />
          Live Activiteiten
        </h3>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Activity Feed */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold-500/50 via-neutral-700 to-transparent" />

        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const isRecent = new Date().getTime() - activity.timestamp.getTime() < 3600000; // Last hour

            return (
              <div
                key={activity.id}
                className={cn(
                  'relative pl-12 pr-4 py-3 rounded-lg border transition-all hover:scale-[1.02]',
                  activity.bgColor,
                  activity.borderColor,
                  isRecent && 'animate-pulse-subtle'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'absolute left-2 top-3 w-8 h-8 rounded-full flex items-center justify-center border-2',
                  activity.bgColor,
                  activity.borderColor,
                  'bg-neutral-900'
                )}>
                  <Icon className={cn('w-4 h-4', activity.color)} />
                </div>

                {/* Content */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm flex items-center gap-2">
                      {activity.title}
                      {isRecent && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/40">
                          NIEUW
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {activity.subtitle}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-neutral-500 ml-3">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-neutral-800/30 border border-neutral-700 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            Laatste 24 uur activiteit
          </span>
          <span className="text-gold-400 font-medium">
            {activities.filter(a => 
              new Date().getTime() - a.timestamp.getTime() < 86400000
            ).length} events
          </span>
        </div>
      </div>
    </div>
  );
};
