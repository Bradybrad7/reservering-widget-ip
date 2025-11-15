/**
 * ✨ ACTIVITY FEED WIDGET
 * 
 * Recent activity stream
 * Toont laatste acties in het systeem
 */

import { useMemo } from 'react';
import { 
  Activity, 
  Plus, 
  CheckCircle, 
  DollarSign, 
  Mail, 
  Edit, 
  Trash2,
  UserPlus,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useCustomersStore } from '../../../store/customersStore';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'checkin' | 'email' | 'event' | 'customer';
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const ActivityFeedWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { customers } = useCustomersStore();

  // Genereer activity items van verschillende bronnen
  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];

    // Nieuwe reserveringen (laatste 24 uur)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReservations = reservations
      .filter(r => new Date(r.createdAt) > oneDayAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    recentReservations.forEach(reservation => {
      const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
      items.push({
        id: `booking-${reservation.id}`,
        type: 'booking',
        title: 'Nieuwe reservering',
        subtitle: `${customerName} - ${reservation.numberOfPersons} personen`,
        timestamp: new Date(reservation.createdAt),
        icon: Plus,
        color: 'blue'
      });
    });

    // Recente betalingen
    reservations
      .filter(r => r.paymentStatus === 'paid' && r.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(reservation => {
        const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
        items.push({
          id: `payment-${reservation.id}`,
          type: 'payment',
          title: 'Betaling ontvangen',
          subtitle: `${customerName} - €${reservation.totalPrice?.toFixed(2)}`,
          timestamp: new Date(reservation.updatedAt),
          icon: DollarSign,
          color: 'green'
        });
      });

    // Recente check-ins
    reservations
      .filter(r => r.status === 'checked-in' && r.checkedInAt)
      .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
      .slice(0, 3)
      .forEach(reservation => {
        const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
        items.push({
          id: `checkin-${reservation.id}`,
          type: 'checkin',
          title: 'Check-in voltooid',
          subtitle: `${customerName} - ${reservation.numberOfPersons} personen`,
          timestamp: new Date(reservation.checkedInAt!),
          icon: CheckCircle,
          color: 'purple'
        });
      });

    // Recent events (toekomstige events binnen 7 dagen)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    events
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate > now && eventDate < sevenDaysFromNow && e.isActive;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2)
      .forEach(event => {
        items.push({
          id: `event-${event.id}`,
          type: 'event',
          title: 'Aankomend event',
          subtitle: `Voorstelling ${event.type}`,
          timestamp: new Date(event.date),
          icon: Calendar,
          color: 'orange'
        });
      });

    // Sort alle items op timestamp
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Return top 15
    return items.slice(0, 15);
  }, [reservations, events]);

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/30 dark:via-sky-950/30 dark:to-blue-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Recente Activiteit
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Laatste acties in het systeem
            </p>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-[500px] overflow-y-auto">
        {activityItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
              <Activity className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Nog geen recente activiteit
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {activityItems.map(item => {
              const colorMap: Record<string, { bg: string; iconBg: string; text: string }> = {
                blue: { 
                  bg: 'bg-blue-50 dark:bg-blue-950/20', 
                  iconBg: 'bg-blue-500',
                  text: 'text-blue-600 dark:text-blue-400'
                },
                green: { 
                  bg: 'bg-green-50 dark:bg-green-950/20', 
                  iconBg: 'bg-green-500',
                  text: 'text-green-600 dark:text-green-400'
                },
                purple: { 
                  bg: 'bg-purple-50 dark:bg-purple-950/20', 
                  iconBg: 'bg-purple-500',
                  text: 'text-purple-600 dark:text-purple-400'
                },
                orange: { 
                  bg: 'bg-orange-50 dark:bg-orange-950/20', 
                  iconBg: 'bg-orange-500',
                  text: 'text-orange-600 dark:text-orange-400'
                },
                red: { 
                  bg: 'bg-red-50 dark:bg-red-950/20', 
                  iconBg: 'bg-red-500',
                  text: 'text-red-600 dark:text-red-400'
                }
              };

              const colors = colorMap[item.color];
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 p-2 rounded-lg',
                      colors.iconBg,
                      'group-hover:scale-110 transition-transform'
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: nl })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {activityItems.length > 0 && (
        <div className="px-6 py-3 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Bekijk alle activiteit →
          </button>
        </div>
      )}
    </div>
  );
};
