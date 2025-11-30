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
  Clock,
  ArrowRight
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
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Recente Activiteit</h2>
        <p className="text-sm text-slate-400">Laatste updates en acties</p>
      </div>

      {/* Activity List - Timeline */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {activityItems.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nog geen recente activiteit</p>
          </div>
        ) : (
          activityItems.map(item => {
            const Icon = item.icon;
            const iconColor = item.color === 'green' ? 'text-emerald-400' : item.color === 'blue' ? 'text-primary' : item.color === 'purple' ? 'text-purple-400' : 'text-orange-400';
            
            return (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className={cn('w-4 h-4', iconColor)} />
                  </div>
                  <div className="w-px h-full bg-slate-800 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="text-sm font-medium text-white mb-0.5">{item.title}</div>
                  <div className="text-xs text-slate-400 mb-2">{item.subtitle}</div>
                  <div className="text-xs text-slate-500">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: nl })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      {activityItems.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <a href="#" className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-2">
            Bekijk alle activiteit
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};
