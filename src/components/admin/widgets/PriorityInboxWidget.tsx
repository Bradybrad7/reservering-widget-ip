/**
 * ✨ PRIORITY INBOX WIDGET
 * 
 * Toont items die NU actie vereisen met directe actieknoppen
 * 
 * CATEGORIES:
 * - 🔴 Urgent: Opties verlopen vandaag, betalingen te laat
 * - 🟡 Attention: Nieuwe aanvragen, wachtlijst items
 * - 🟢 Success: Recente bevestigingen, check-ins
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Mail, 
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useWaitlistStore } from '../../../store/waitlistStore';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PriorityItem {
  id: string;
  type: 'urgent' | 'attention' | 'success';
  category: 'reservation' | 'payment' | 'waitlist';
  title: string;
  subtitle: string;
  timestamp: Date;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
}

export const PriorityInboxWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);

  // Bereken priority items
  useEffect(() => {
    const items: PriorityItem[] = [];
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 🔴 URGENT: Opties die vandaag verlopen
    reservations
      .filter(r => r.status === 'pending' && r.optionExpiresAt)
      .forEach(reservation => {
        const expiryDate = new Date(reservation.optionExpiresAt!);
        if (expiryDate <= todayEnd && expiryDate > now) {
          const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
          items.push({
            id: `reservation-expiry-${reservation.id}`,
            type: 'urgent',
            category: 'reservation',
            title: `Optie verloopt vandaag: ${customerName}`,
            subtitle: `${reservation.numberOfPersons} personen - Verloopt om ${expiryDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`,
            timestamp: expiryDate,
            actions: [
              {
                label: 'Herinnering',
                onClick: () => console.log('Send reminder', reservation.id),
                variant: 'primary'
              },
              {
                label: 'Verleng 24u',
                onClick: () => console.log('Extend option', reservation.id),
                variant: 'secondary'
              }
            ]
          });
        }
      });

    // 🔴 URGENT: Betalingen te laat
    reservations
      .filter(r => r.status === 'confirmed' && r.paymentStatus === 'pending')
      .forEach(reservation => {
        if (reservation.paymentDueDate) {
          const dueDate = new Date(reservation.paymentDueDate);
          if (dueDate < now) {
            const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
            items.push({
              id: `payment-overdue-${reservation.id}`,
              type: 'urgent',
              category: 'payment',
              title: `Betaling te laat: ${customerName}`,
              subtitle: `€${reservation.totalPrice?.toFixed(2)} - ${formatDistanceToNow(dueDate, { addSuffix: true, locale: nl })}`,
              timestamp: dueDate,
              actions: [
                {
                  label: 'Herinnering',
                  onClick: () => console.log('Send payment reminder', reservation.id),
                  variant: 'danger'
                },
                {
                  label: 'Bekijken',
                  onClick: () => console.log('View reservation', reservation.id),
                  variant: 'secondary'
                }
              ]
            });
          }
        }
      });

    // 🟡 ATTENTION: Nieuwe aanvragen (laatste 2 uur)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    reservations
      .filter(r => r.status === 'pending' && new Date(r.createdAt) > twoHoursAgo)
      .forEach(reservation => {
        const customerName = reservation.companyName || `${reservation.firstName} ${reservation.lastName}`;
        items.push({
          id: `new-request-${reservation.id}`,
          type: 'attention',
          category: 'reservation',
          title: `Nieuwe aanvraag: ${customerName}`,
          subtitle: `${reservation.numberOfPersons} personen - ${formatDistanceToNow(new Date(reservation.createdAt), { addSuffix: true, locale: nl })}`,
          timestamp: new Date(reservation.createdAt),
          actions: [
            {
              label: 'Bevestigen',
              onClick: () => console.log('Confirm reservation', reservation.id),
              variant: 'primary'
            },
            {
              label: 'Bekijken',
              onClick: () => console.log('View reservation', reservation.id),
              variant: 'secondary'
            }
          ]
        });
      });

    // 🟡 ATTENTION: Wachtlijst items
    waitlistEntries
      .filter(w => w.status === 'pending')
      .slice(0, 3)
      .forEach(entry => {
        items.push({
          id: `waitlist-${entry.id}`,
          type: 'attention',
          category: 'waitlist',
          title: `Wachtlijst: ${entry.customerName}`,
          subtitle: `${entry.numberOfPersons} personen - ${formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: nl })}`,
          timestamp: new Date(entry.createdAt),
          actions: [
            {
              label: 'Contact',
              onClick: () => console.log('Contact waitlist', entry.id),
              variant: 'primary'
            },
            {
              label: 'Bekijken',
              onClick: () => console.log('View waitlist', entry.id),
              variant: 'secondary'
            }
          ]
        });
      });

    // Sorteer op type (urgent eerst) en dan op timestamp
    items.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = { urgent: 0, attention: 1, success: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setPriorityItems(items.slice(0, 10)); // Max 10 items
  }, [reservations, waitlistEntries]);

  const urgentCount = priorityItems.filter(i => i.type === 'urgent').length;
  const attentionCount = priorityItems.filter(i => i.type === 'attention').length;

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Actie Vereist
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {urgentCount} urgent • {attentionCount} aandacht
              </p>
            </div>
          </div>
          
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-black">{urgentCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {priorityItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Alles is onder controle!
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-xs">
              Geen items die directe actie vereisen. Goed bezig! 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {priorityItems.map(item => {
              const typeConfig = {
                urgent: {
                  bg: 'bg-red-50 dark:bg-red-950/20',
                  border: 'border-red-200 dark:border-red-800',
                  icon: AlertCircle,
                  iconBg: 'bg-red-500',
                  pulse: true
                },
                attention: {
                  bg: 'bg-orange-50 dark:bg-orange-950/20',
                  border: 'border-orange-200 dark:border-orange-800',
                  icon: Clock,
                  iconBg: 'bg-orange-500',
                  pulse: false
                },
                success: {
                  bg: 'bg-green-50 dark:bg-green-950/20',
                  border: 'border-green-200 dark:border-green-800',
                  icon: CheckCircle2,
                  iconBg: 'bg-green-500',
                  pulse: false
                }
              };

              const config = typeConfig[item.type];
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                    config.bg
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 p-2 rounded-lg',
                      config.iconBg,
                      config.pulse && 'animate-pulse'
                    )}>
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        {item.subtitle}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {item.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              action.variant === 'primary' && 'bg-blue-500 hover:bg-blue-600 text-white',
                              action.variant === 'secondary' && 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200',
                              action.variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
