/**
 * 🔔 SMART NOTIFICATION CENTER
 * 
 * Een geavanceerd notification systeem met:
 * - Prioriteitsniveaus (urgent, belangrijk, info)
 * - Grouping van gerelateerde notificaties
 * - Action buttons voor directe acties
 * - Markeer als gelezen/ongelezen
 * - Snooze functionaliteit
 * - Desktop notificaties voor urgent items
 * - Filtering en zoeken
 * 
 * FILOSOFIE:
 * - Minder noise, meer signaal
 * - Actionable notifications alleen
 * - Context-aware (toon relevante acties)
 * - Niet-invasief maar urgent wanneer nodig
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  BellOff,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Clock,
  Mail,
  DollarSign,
  Users,
  Calendar,
  ChevronDown,
  Filter,
  Search,
  Trash2,
  Check,
  MoreHorizontal,
  ExternalLink,
  Zap
} from 'lucide-react';
import { cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import type { Reservation } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

type NotificationPriority = 'urgent' | 'important' | 'info';
type NotificationCategory = 'reservation' | 'payment' | 'waitlist' | 'event' | 'system';

interface SmartNotification {
  id: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isSnoozed: boolean;
  snoozeUntil?: Date;
  actionable: boolean;
  actions?: NotificationAction[];
  relatedId?: string; // ID van reservering, event, etc.
  groupKey?: string; // Voor groeperen van gelijksoortige notificaties
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  icon?: React.ComponentType<{ className?: string }>;
}

interface NotificationGroup {
  key: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  count: number;
  notifications: SmartNotification[];
  latestTimestamp: Date;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// NOTIFICATION GENERATOR
// ============================================================================

const generateNotifications = (
  reservations: Reservation[],
  events: any[],
  waitlistEntries: any[]
): SmartNotification[] => {
  const notifications: SmartNotification[] = [];
  const now = new Date();
  
  // ========================================================================
  // URGENT: Late Betalingen (>7 dagen na due date)
  // ========================================================================
  reservations
    .filter(r => {
      if (r.status === 'cancelled' || r.status === 'rejected') return false;
      if (!r.paymentDueDate) return false;
      
      const totalPaid = r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRefunded = r.refunds?.reduce((sum, ref) => sum + ref.amount, 0) || 0;
      const netAmount = totalPaid - totalRefunded;
      const amountDue = r.totalPrice - netAmount;
      
      if (amountDue <= 0) return false;
      
      const daysOverdue = Math.floor((now.getTime() - new Date(r.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue > 7;
    })
    .forEach(r => {
      const daysOverdue = Math.floor((now.getTime() - new Date(r.paymentDueDate!).getTime()) / (1000 * 60 * 60 * 24));
      const totalPaid = r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRefunded = r.refunds?.reduce((sum, ref) => sum + ref.amount, 0) || 0;
      const amountDue = r.totalPrice - (totalPaid - totalRefunded);
      
      notifications.push({
        id: `late_payment_${r.id}`,
        priority: 'urgent',
        category: 'payment',
        title: `Betaling ${daysOverdue} dagen te laat`,
        message: `${r.contactPerson} (${r.companyName || 'Particulier'}) - €${amountDue.toFixed(2)} openstaand`,
        timestamp: new Date(r.paymentDueDate!),
        isRead: false,
        isSnoozed: false,
        actionable: true,
        relatedId: r.id,
        groupKey: 'late_payments',
        actions: [
          {
            label: 'Email sturen',
            action: () => console.log('Send payment reminder', r.id),
            variant: 'primary',
            icon: Mail
          },
          {
            label: 'Bekijk reservering',
            action: () => console.log('View reservation', r.id),
            variant: 'secondary',
            icon: ExternalLink
          }
        ]
      });
    });
  
  // ========================================================================
  // IMPORTANT: Nieuwe Reserveringsaanvragen (pending)
  // ========================================================================
  reservations
    .filter(r => r.status === 'pending')
    .forEach(r => {
      const hoursAgo = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60));
      
      notifications.push({
        id: `pending_reservation_${r.id}`,
        priority: hoursAgo > 24 ? 'urgent' : 'important',
        category: 'reservation',
        title: hoursAgo > 24 ? `Aanvraag wacht ${Math.floor(hoursAgo / 24)} dagen` : 'Nieuwe reserveringsaanvraag',
        message: `${r.contactPerson} - ${r.pricingSnapshot?.numberOfPersons || 0} personen op ${new Date(r.eventDate).toLocaleDateString('nl-NL')}`,
        timestamp: new Date(r.createdAt),
        isRead: false,
        isSnoozed: false,
        actionable: true,
        relatedId: r.id,
        groupKey: 'pending_reservations',
        actions: [
          {
            label: 'Bevestigen',
            action: () => console.log('Confirm reservation', r.id),
            variant: 'primary',
            icon: CheckCircle
          },
          {
            label: 'Afwijzen',
            action: () => console.log('Reject reservation', r.id),
            variant: 'danger',
            icon: X
          },
          {
            label: 'Bekijken',
            action: () => console.log('View reservation', r.id),
            variant: 'secondary',
            icon: ExternalLink
          }
        ]
      });
    });
  
  // ========================================================================
  // IMPORTANT: Betalingen binnenkort vervallen (< 3 dagen)
  // ========================================================================
  reservations
    .filter(r => {
      if (r.status === 'cancelled' || r.status === 'rejected') return false;
      if (!r.paymentDueDate) return false;
      
      const totalPaid = r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRefunded = r.refunds?.reduce((sum, ref) => sum + ref.amount, 0) || 0;
      const netAmount = totalPaid - totalRefunded;
      const amountDue = r.totalPrice - netAmount;
      
      if (amountDue <= 0) return false;
      
      const daysUntilDue = Math.floor((new Date(r.paymentDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue < 3;
    })
    .forEach(r => {
      const daysUntilDue = Math.floor((new Date(r.paymentDueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const totalPaid = r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalRefunded = r.refunds?.reduce((sum, ref) => sum + ref.amount, 0) || 0;
      const amountDue = r.totalPrice - (totalPaid - totalRefunded);
      
      notifications.push({
        id: `payment_due_soon_${r.id}`,
        priority: 'important',
        category: 'payment',
        title: `Betaling vervalt ${daysUntilDue === 0 ? 'vandaag' : `over ${daysUntilDue} dag${daysUntilDue > 1 ? 'en' : ''}`}`,
        message: `${r.contactPerson} - €${amountDue.toFixed(2)} openstaand`,
        timestamp: new Date(r.paymentDueDate!),
        isRead: false,
        isSnoozed: false,
        actionable: true,
        relatedId: r.id,
        groupKey: 'payments_due_soon'
      });
    });
  
  // ========================================================================
  // IMPORTANT: Verlopen Opties (options langer dan configured dagen)
  // ========================================================================
  reservations
    .filter(r => {
      if (r.status !== 'option') return false;
      const optionDays = 7; // TODO: Get from config
      const daysOld = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysOld >= optionDays;
    })
    .forEach(r => {
      const daysOld = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      
      notifications.push({
        id: `expired_option_${r.id}`,
        priority: 'important',
        category: 'reservation',
        title: 'Optie verlopen',
        message: `${r.contactPerson} - Optie van ${daysOld} dagen geleden`,
        timestamp: new Date(r.createdAt),
        isRead: false,
        isSnoozed: false,
        actionable: true,
        relatedId: r.id,
        groupKey: 'expired_options',
        actions: [
          {
            label: 'Bevestigen',
            action: () => console.log('Confirm expired option', r.id),
            variant: 'primary',
            icon: CheckCircle
          },
          {
            label: 'Verwijderen',
            action: () => console.log('Delete expired option', r.id),
            variant: 'danger',
            icon: Trash2
          }
        ]
      });
    });
  
  // ========================================================================
  // INFO: Actieve Wachtlijst Entries
  // ========================================================================
  if (waitlistEntries.length > 0) {
    notifications.push({
      id: 'waitlist_summary',
      priority: 'info',
      category: 'waitlist',
      title: `${waitlistEntries.length} ${waitlistEntries.length === 1 ? 'persoon' : 'personen'} op wachtlijst`,
      message: 'Bekijk of er capaciteit vrijgekomen is',
      timestamp: new Date(),
      isRead: false,
      isSnoozed: false,
      actionable: true,
      groupKey: 'waitlist_items',
      actions: [
        {
          label: 'Wachtlijst bekijken',
          action: () => console.log('View waitlist'),
          variant: 'secondary',
          icon: Users
        }
      ]
    });
  }
  
  return notifications;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SmartNotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  
  // Generate notifications
  const allNotifications = useMemo(() => {
    return generateNotifications(reservations, events, waitlistEntries);
  }, [reservations, events, waitlistEntries]);
  
  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(n => {
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      if (showOnlyUnread && n.isRead) return false;
      if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (n.isSnoozed && n.snoozeUntil && n.snoozeUntil > new Date()) return false;
      return true;
    });
  }, [allNotifications, filterPriority, showOnlyUnread, searchQuery]);
  
  // Group notifications
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, NotificationGroup>();
    
    filteredNotifications.forEach(n => {
      if (!n.groupKey) {
        // Standalone notification
        groups.set(n.id, {
          key: n.id,
          priority: n.priority,
          category: n.category,
          title: n.title,
          count: 1,
          notifications: [n],
          latestTimestamp: n.timestamp
        });
      } else {
        // Grouped notification
        if (!groups.has(n.groupKey)) {
          groups.set(n.groupKey, {
            key: n.groupKey,
            priority: n.priority,
            category: n.category,
            title: n.title,
            count: 0,
            notifications: [],
            latestTimestamp: n.timestamp
          });
        }
        
        const group = groups.get(n.groupKey)!;
        group.count++;
        group.notifications.push(n);
        
        // Update to highest priority
        if (n.priority === 'urgent') group.priority = 'urgent';
        else if (n.priority === 'important' && group.priority !== 'urgent') group.priority = 'important';
        
        // Update to latest timestamp
        if (n.timestamp > group.latestTimestamp) {
          group.latestTimestamp = n.timestamp;
          group.title = n.title;
        }
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 0, important: 1, info: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (newest first)
      return b.latestTimestamp.getTime() - a.latestTimestamp.getTime();
    });
  }, [filteredNotifications]);
  
  // Stats
  const stats = useMemo(() => {
    const urgent = allNotifications.filter(n => n.priority === 'urgent' && !n.isRead).length;
    const important = allNotifications.filter(n => n.priority === 'important' && !n.isRead).length;
    const total = allNotifications.filter(n => !n.isRead).length;
    
    return { urgent, important, total };
  }, [allNotifications]);
  
  // Request desktop notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  // Send desktop notifications for urgent items
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const urgentUnread = allNotifications.filter(n => 
      n.priority === 'urgent' && !n.isRead && !n.isSnoozed
    );
    
    urgentUnread.slice(0, 3).forEach(n => {
      new Notification(n.title, {
        body: n.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: n.id,
        requireInteraction: true
      });
    });
  }, [allNotifications]);
  
  if (!isOpen) return null;
  
  const priorityConfig = {
    urgent: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      label: 'Urgent'
    },
    important: {
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      label: 'Belangrijk'
    },
    info: {
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      label: 'Info'
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-start justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Notificaties
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stats.total} ongelezen • {stats.urgent} urgent
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Stats */}
          {stats.urgent > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <Zap className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              <span className="text-sm font-bold text-red-700 dark:text-red-300">
                {stats.urgent} {stats.urgent === 1 ? 'urgent item' : 'urgente items'} vereist actie
              </span>
            </div>
          )}
          
          {/* Search & Filters */}
          <div className="mt-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Zoek notificaties..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterPriority('all')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors',
                  filterPriority === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                Alles ({allNotifications.length})
              </button>
              <button
                onClick={() => setFilterPriority('urgent')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors',
                  filterPriority === 'urgent'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                Urgent ({stats.urgent})
              </button>
              <button
                onClick={() => setFilterPriority('important')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors',
                  filterPriority === 'important'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                Belangrijk ({stats.important})
              </button>
              
              <div className="flex-1"></div>
              
              <button
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5',
                  showOnlyUnread
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {showOnlyUnread ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                Alleen ongelezen
              </button>
            </div>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Alles afgehandeld!
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Je hebt geen notificaties
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {groupedNotifications.map((group) => {
                const config = priorityConfig[group.priority];
                const Icon = config.icon;
                const isGrouped = group.count > 1;
                
                return (
                  <div
                    key={group.key}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg',
                      config.bg,
                      config.border
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn('flex-shrink-0 p-2 rounded-lg', config.bg)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-xs font-bold uppercase', config.color)}>
                            {config.label}
                          </span>
                          {isGrouped && (
                            <span className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black rounded">
                              {group.count}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          {isGrouped ? `${group.count} ${group.title.toLowerCase()}` : group.title}
                        </h3>
                        
                        {!isGrouped && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {group.notifications[0].message}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(group.latestTimestamp).toLocaleString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {group.notifications[0].actions && group.notifications[0].actions.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.notifications[0].actions.map((action, idx) => {
                          const ActionIcon = action.icon;
                          
                          return (
                            <button
                              key={idx}
                              onClick={action.action}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 hover:shadow-md',
                                action.variant === 'primary' && 'bg-blue-500 hover:bg-blue-600 text-white',
                                action.variant === 'secondary' && 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600',
                                action.variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
                              )}
                            >
                              {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Grouped notifications details */}
                    {isGrouped && group.notifications.length > 1 && (
                      <details className="mt-3 group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                          <span>Bekijk alle {group.count} items</span>
                        </summary>
                        <div className="mt-3 space-y-2 pl-6 border-l-2 border-slate-300 dark:border-slate-600">
                          {group.notifications.map(n => (
                            <div key={n.id} className="text-sm">
                              <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                              <p className="text-slate-600 dark:text-slate-400">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
