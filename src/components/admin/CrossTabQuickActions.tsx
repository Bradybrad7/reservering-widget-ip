/**
 * 🚀 CROSS-TAB QUICK ACTIONS - Context-Aware Navigation
 * 
 * Smart quick action buttons voor naadloze workflow tussen tabs
 * 
 * Examples:
 * - In Event detail → "View Reservations" (navigeert naar Reservations tab met event filter)
 * - In Reservation detail → "View Event", "View Customer", "Check Payment"
 * - In Customer detail → "View All Reservations", "Payment History"
 */

import React from 'react';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  ListChecks,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useOperationsStore } from '../../store/operationsStore';
import { cn } from '../../utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  targetTab: 'events' | 'reservations' | 'waitlist' | 'customers' | 'payments';
  gradient: string;
  onClick?: () => void;
}

interface CrossTabQuickActionsProps {
  actions: QuickAction[];
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CrossTabQuickActions: React.FC<CrossTabQuickActionsProps> = ({ 
  actions, 
  variant = 'horizontal',
  size = 'md',
  className 
}) => {
  const { setActiveTab } = useOperationsStore();

  const handleAction = (action: QuickAction) => {
    // Voer custom onClick uit indien aanwezig
    if (action.onClick) {
      action.onClick();
    }
    
    // Navigeer naar target tab
    setActiveTab(action.targetTab);
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-3'
  };

  return (
    <div className={cn(
      'flex',
      variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      'gap-2',
      className
    )}>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className={cn(
              'group relative flex items-center font-bold rounded-xl transition-all duration-200',
              'hover:scale-105 hover:shadow-xl',
              'bg-white dark:bg-slate-800 border-2',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              sizeClasses[size]
            )}
            style={{
              borderColor: 'transparent',
            }}
          >
            {/* Gradient border + background on hover */}
            <div 
              className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl',
                `bg-gradient-to-br ${action.gradient}`
              )}
              style={{ zIndex: -1 }}
            />
            
            {/* Icon */}
            <div className={cn(
              'relative p-1.5 rounded-lg transition-all shrink-0',
              `bg-gradient-to-br ${action.gradient}`,
              'group-hover:scale-110'
            )}>
              <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Label */}
            <span className={cn(
              'relative transition-colors font-bold',
              'text-slate-700 dark:text-slate-300',
              'group-hover:text-white'
            )}>
              {action.label}
            </span>
            
            {/* Arrow */}
            <ArrowRight className={cn(
              'w-4 h-4 opacity-0 group-hover:opacity-100 transition-all shrink-0',
              'text-white transform group-hover:translate-x-1'
            )} />
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS - Quick Action Generators
// ============================================================================

/**
 * Generate quick actions for Event detail view
 */
export const createEventQuickActions = (
  eventId: string,
  setEventContext: (id: string, name?: string) => void
): QuickAction[] => [
  {
    id: 'view-reservations',
    label: 'Bekijk Reserveringen',
    icon: ListChecks,
    targetTab: 'reservations',
    gradient: 'from-purple-500 to-pink-500',
    onClick: () => setEventContext(eventId)
  },
  {
    id: 'view-waitlist',
    label: 'Bekijk Wachtlijst',
    icon: Clock,
    targetTab: 'waitlist',
    gradient: 'from-orange-500 to-amber-500',
    onClick: () => setEventContext(eventId)
  },
  {
    id: 'check-payments',
    label: 'Controleer Betalingen',
    icon: CreditCard,
    targetTab: 'payments',
    gradient: 'from-red-500 to-rose-500',
    onClick: () => setEventContext(eventId)
  }
];

/**
 * Generate quick actions for Reservation detail view
 */
export const createReservationQuickActions = (
  eventId: string,
  customerEmail: string,
  setEventContext: (id: string) => void,
  setCustomerContext: (id: string) => void
): QuickAction[] => [
  {
    id: 'view-event',
    label: 'Bekijk Event',
    icon: Calendar,
    targetTab: 'events',
    gradient: 'from-blue-500 to-indigo-500',
    onClick: () => setEventContext(eventId)
  },
  {
    id: 'view-customer',
    label: 'Bekijk Klant',
    icon: Users,
    targetTab: 'customers',
    gradient: 'from-green-500 to-emerald-500',
    onClick: () => setCustomerContext(customerEmail)
  },
  {
    id: 'check-payment',
    label: 'Controleer Betaling',
    icon: CreditCard,
    targetTab: 'payments',
    gradient: 'from-red-500 to-rose-500',
    onClick: () => {} // Already in context
  }
];

/**
 * Generate quick actions for Customer detail view
 */
export const createCustomerQuickActions = (
  customerEmail: string,
  setCustomerContext: (id: string) => void
): QuickAction[] => [
  {
    id: 'view-reservations',
    label: 'Alle Reserveringen',
    icon: ListChecks,
    targetTab: 'reservations',
    gradient: 'from-purple-500 to-pink-500',
    onClick: () => setCustomerContext(customerEmail)
  },
  {
    id: 'payment-history',
    label: 'Betalingshistorie',
    icon: CreditCard,
    targetTab: 'payments',
    gradient: 'from-red-500 to-rose-500',
    onClick: () => setCustomerContext(customerEmail)
  }
];
