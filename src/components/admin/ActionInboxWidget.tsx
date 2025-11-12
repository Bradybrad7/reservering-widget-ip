/**
 * ActionInboxWidget - De "To-Do" lijst voor de admin
 * 
 * Transformatie van FocusPointsWidget van "informatie" naar "uitvoerbare items".
 * Toont concrete acties die de admin kan uitvoeren, gesorteerd op urgentie.
 * 
 * Categorieën:
 * - 🔥 Urgent: Nieuwe aanvragen, expirerende opties, bijna-vol events
 * - ⚠️ Aandacht: Onbetaalde reserveringen, lage bezetting
 * - 📈 Kansen: Groeiende wachtlijsten, populaire events
 */

import { useMemo } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Clock,
  DollarSign,
  Users,
  Calendar,
  ListChecks
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, formatCurrency, cn } from '../../utils';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';

interface ActionInboxWidgetProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
}

type ActionItem = {
  id: string;
  type: 'reservation' | 'event' | 'payment' | 'waitlist';
  title: string;
  subtitle: string;
  metadata?: string;
  icon: React.ElementType;
  action: () => void;
  urgency: 'high' | 'medium' | 'low';
};

export const ActionInboxWidget: React.FC<ActionInboxWidgetProps> = ({
  events,
  reservations,
  waitlistEntries,
}) => {
  const { setActiveSection, setSelectedItemId } = useAdminStore();

  // ============================================================================
  // GENERATE ACTION ITEMS
  // ============================================================================

  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    const now = new Date();

    // 🔥 HIGH URGENCY
    // ---------------

    // 1. Nieuwe reservering aanvragen (pending/request status)
    const newRequests = reservations
      .filter(r => r.status === 'pending' || r.status === 'request')
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        type: 'reservation' as const,
        title: `Nieuwe aanvraag: ${r.companyName || r.contactPerson}`,
        subtitle: `${r.numberOfPersons} personen • ${formatDate(r.eventDate)}`,
        metadata: r.status === 'request' ? 'Over capaciteit' : 'Wacht op goedkeuring',
        icon: ListChecks,
        urgency: 'high' as const,
        action: () => {
          setActiveSection('reservations');
          setSelectedItemId(r.id);
        }
      }));
    items.push(...newRequests);

    // 2. Expirerende opties (binnen 24 uur)
    const expiringOptions = reservations
      .filter(r => {
        if (r.status !== 'option') return false;
        if (!r.optionExpiresAt) return false;
        const expiresAt = new Date(r.optionExpiresAt);
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
      })
      .slice(0, 3)
      .map(r => ({
        id: r.id,
        type: 'reservation' as const,
        title: `Optie verloopt: ${r.companyName || r.contactPerson}`,
        subtitle: `${r.numberOfPersons} personen • ${formatDate(r.eventDate)}`,
        metadata: `Verloopt ${formatDate(r.optionExpiresAt!)}`,
        icon: Clock,
        urgency: 'high' as const,
        action: () => {
          setActiveSection('reservations');
          setSelectedItemId(r.id);
        }
      }));
    items.push(...expiringOptions);

    // 3. Bijna-vol events (> 90% capaciteit, binnen 2 weken)
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const almostFullEvents = events
      .filter(e => {
        if (!e.isActive) return false;
        const eventDate = new Date(e.date);
        if (eventDate < now || eventDate > twoWeeksFromNow) return false;

        const bookedPersons = e.reservations.reduce((sum, r) => {
          if (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending') {
            return sum + r.numberOfPersons;
          }
          return sum;
        }, 0);

        const capacityPercentage = (bookedPersons / e.capacity) * 100;
        return capacityPercentage >= 90 && capacityPercentage < 100;
      })
      .slice(0, 3)
      .map(e => {
        const bookedPersons = e.reservations.reduce((sum, r) => 
          (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending') 
            ? sum + r.numberOfPersons : sum, 0);
        const percentage = Math.round((bookedPersons / e.capacity) * 100);

        return {
          id: e.id,
          type: 'event' as const,
          title: `${percentage}% vol: ${formatDate(e.date)}`,
          subtitle: `${e.type} • ${e.startsAt}`,
          metadata: `${bookedPersons}/${e.capacity} personen`,
          icon: Flame,
          urgency: 'high' as const,
          action: () => {
            setActiveSection('events');
            setSelectedItemId(e.id);
          }
        };
      });
    items.push(...almostFullEvents);

    // ⚠️ MEDIUM URGENCY
    // ------------------

    // 4. Onbetaalde confirmed reserveringen (> 7 dagen oud)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const unpaidReservations = reservations
      .filter(r => {
        if (r.status !== 'confirmed') return false;
        const createdDate = r.createdAt ? new Date(r.createdAt) : now;
        if (createdDate > sevenDaysAgo) return false;
        
        // Check if event is in the future
        const eventDate = new Date(r.eventDate);
        if (eventDate < now) return false;

        // For now, we mark as unpaid if there's no explicit payment field
        // This can be enhanced with proper payment tracking
        return true;
      })
      .slice(0, 3)
      .map(r => ({
        id: r.id,
        type: 'payment' as const,
        title: `Betaling volgt: ${r.companyName || r.contactPerson}`,
        subtitle: `${formatCurrency(r.totalPrice || 0)} • ${formatDate(r.eventDate)}`,
        metadata: 'Bevestigd, wacht op betaling',
        icon: DollarSign,
        urgency: 'medium' as const,
        action: () => {
          setActiveSection('payments');
          setSelectedItemId(r.id);
        }
      }));
    items.push(...unpaidReservations);

    // 5. Lage bezetting events (< 30%, binnen 3 weken)
    const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const lowOccupancyEvents = events
      .filter(e => {
        if (!e.isActive) return false;
        const eventDate = new Date(e.date);
        if (eventDate < now || eventDate > threeWeeksFromNow) return false;

        const bookedPersons = e.reservations.reduce((sum, r) => 
          (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
            ? sum + r.numberOfPersons : sum, 0);

        const capacityPercentage = (bookedPersons / e.capacity) * 100;
        return capacityPercentage < 30;
      })
      .slice(0, 3)
      .map(e => {
        const bookedPersons = e.reservations.reduce((sum, r) => 
          (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
            ? sum + r.numberOfPersons : sum, 0);
        const percentage = Math.round((bookedPersons / e.capacity) * 100);
        const daysUntil = Math.ceil((new Date(e.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: e.id,
          type: 'event' as const,
          title: `${percentage}% bezet: ${formatDate(e.date)}`,
          subtitle: `${e.type} • ${daysUntil} dagen`,
          metadata: `${bookedPersons}/${e.capacity} personen`,
          icon: AlertTriangle,
          urgency: 'medium' as const,
          action: () => {
            setActiveSection('events');
            setSelectedItemId(e.id);
          }
        };
      });
    items.push(...lowOccupancyEvents);

    // 📈 LOW URGENCY (Opportunities)
    // -------------------------------

    // 6. Groeiende wachtlijsten
    const growingWaitlists = events
      .filter(e => e.isActive && e.waitlistActive)
      .map(e => {
        const eventWaitlist = waitlistEntries.filter(w => w.eventId === e.id && w.status === 'pending');
        const totalPersons = eventWaitlist.reduce((sum, w) => sum + w.numberOfPersons, 0);
        return { event: e, waitlistCount: eventWaitlist.length, totalPersons };
      })
      .filter(({ totalPersons }) => totalPersons > 0)
      .sort((a, b) => b.totalPersons - a.totalPersons)
      .slice(0, 3)
      .map(({ event, waitlistCount, totalPersons }) => ({
        id: event.id,
        type: 'waitlist' as const,
        title: `Wachtlijst: ${formatDate(event.date)}`,
        subtitle: `${event.type} • ${event.startsAt}`,
        metadata: `${totalPersons} personen (${waitlistCount} aanmeldingen)`,
        icon: TrendingUp,
        urgency: 'low' as const,
        action: () => {
          setActiveSection('waitlist');
          // Filter waitlist by this event
          // This can be enhanced with a filter state in waitlistStore
        }
      }));
    items.push(...growingWaitlists);

    return items;
  }, [events, reservations, waitlistEntries, setActiveSection, setSelectedItemId]);

  // ============================================================================
  // GROUP BY URGENCY
  // ============================================================================

  const highUrgency = actionItems.filter(i => i.urgency === 'high');
  const mediumUrgency = actionItems.filter(i => i.urgency === 'medium');
  const lowUrgency = actionItems.filter(i => i.urgency === 'low');

  return (
    <div className="space-y-6">
      {/* HIGH URGENCY */}
      {highUrgency.length > 0 && (
        <ActionSection 
          title="🔥 Urgent" 
          description="Directe actie vereist"
          items={highUrgency}
          color="red"
        />
      )}

      {/* MEDIUM URGENCY */}
      {mediumUrgency.length > 0 && (
        <ActionSection 
          title="⚠️ Aandacht Nodig" 
          description="Binnenkort actie vereist"
          items={mediumUrgency}
          color="orange"
        />
      )}

      {/* LOW URGENCY (Opportunities) */}
      {lowUrgency.length > 0 && (
        <ActionSection 
          title="📈 Kansen" 
          description="Mogelijkheden om te benutten"
          items={lowUrgency}
          color="blue"
        />
      )}

      {/* EMPTY STATE */}
      {actionItems.length === 0 && (
        <div className="bg-neutral-800/50 rounded-xl border-2 border-neutral-700 p-12 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Alles onder controle!
          </h3>
          <p className="text-neutral-400">
            Geen openstaande acties. Je bent helemaal bij.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ACTION SECTION COMPONENT
// ============================================================================

interface ActionSectionProps {
  title: string;
  description: string;
  items: ActionItem[];
  color: 'red' | 'orange' | 'blue';
}

const ActionSection: React.FC<ActionSectionProps> = ({
  title,
  description,
  items,
  color,
}) => {
  const colorClasses = {
    red: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      hoverBg: 'hover:bg-red-500/20',
      iconBg: 'bg-red-500/20',
    },
    orange: {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      hoverBg: 'hover:bg-orange-500/20',
      iconBg: 'bg-orange-500/20',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      hoverBg: 'hover:bg-blue-500/20',
      iconBg: 'bg-blue-500/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn(
      'bg-neutral-800/50 rounded-xl border-2 overflow-hidden',
      colors.border
    )}>
      {/* Header */}
      <div className={cn('p-4 border-b border-neutral-700 flex items-center justify-between', colors.bg)}>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-neutral-400">{description}</p>
        </div>
        <div className={cn('px-3 py-1 rounded-full text-sm font-bold', colors.text, colors.iconBg)}>
          {items.length}
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all group',
                  'flex items-center gap-3',
                  colors.hoverBg
                )}
              >
                {/* Icon */}
                <div className={cn('p-2 rounded-lg flex-shrink-0', colors.iconBg)}>
                  <Icon className={cn('w-4 h-4', colors.text)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {item.subtitle}
                  </div>
                  {item.metadata && (
                    <div className={cn('text-xs font-medium mt-0.5', colors.text)}>
                      {item.metadata}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className={cn(
                  'w-4 h-4 flex-shrink-0 transition-transform',
                  'group-hover:translate-x-1',
                  colors.text
                )} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
