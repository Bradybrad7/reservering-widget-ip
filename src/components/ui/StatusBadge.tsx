import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Users, 
  UserCheck,
  CreditCard,
  Ban
} from 'lucide-react';
import { cn } from '../../utils';
import type { Reservation } from '../../types';

interface StatusBadgeProps {
  type: 'booking' | 'payment';
  status: Reservation['status'] | 'pending' | 'paid' | 'overdue' | 'refunded';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * StatusBadge Component
 * 
 * Functionele gekleurde badges voor visuele hiërarchie in het admin panel.
 * Gebruikt consistent kleurgebruik:
 * 
 * Booking Status:
 * - Pending/Request: Oranje (actie vereist)
 * - Confirmed: Groen (OK/voltooid)
 * - Waitlist: Blauw (informatief)
 * - Cancelled/Rejected: Rood (negatief/fout)
 * - Checked-in: Paars (speciale status)
 * 
 * Payment Status:
 * - Pending: Oranje (actie vereist)
 * - Paid: Groen (OK)
 * - Overdue: Rood (urgent)
 * - Refunded: Grijs (neutraal)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getBookingConfig = () => {
    switch (status) {
      case 'pending':
      case 'request':
        return {
          label: 'Pending',
          icon: Clock,
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/50',
          iconColor: 'text-orange-400'
        };
      case 'confirmed':
        return {
          label: 'Bevestigd',
          icon: CheckCircle,
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/50',
          iconColor: 'text-green-400'
        };
      case 'option':
        return {
          label: 'Optie',
          icon: Clock,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/50',
          iconColor: 'text-blue-400'
        };
      case 'waitlist':
        return {
          label: 'Wachtlijst',
          icon: Users,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/50',
          iconColor: 'text-blue-400'
        };
      case 'cancelled':
      case 'rejected':
        return {
          label: status === 'cancelled' ? 'Geannuleerd' : 'Afgewezen',
          icon: XCircle,
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          iconColor: 'text-red-400'
        };
      case 'checked-in':
        return {
          label: 'Ingecheckt',
          icon: UserCheck,
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/50',
          iconColor: 'text-purple-400'
        };
      default:
        return {
          label: status as string,
          icon: AlertCircle,
          bgColor: 'bg-neutral-500/20',
          textColor: 'text-neutral-400',
          borderColor: 'border-neutral-500/50',
          iconColor: 'text-neutral-400'
        };
    }
  };

  const getPaymentConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Te Betalen',
          icon: Clock,
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/50',
          iconColor: 'text-orange-400'
        };
      case 'paid':
        return {
          label: 'Betaald',
          icon: CheckCircle,
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/50',
          iconColor: 'text-green-400'
        };
      case 'overdue':
        return {
          label: 'Achterstallig',
          icon: AlertCircle,
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          iconColor: 'text-red-400'
        };
      case 'refunded':
        return {
          label: 'Terugbetaald',
          icon: Ban,
          bgColor: 'bg-neutral-500/20',
          textColor: 'text-neutral-400',
          borderColor: 'border-neutral-500/50',
          iconColor: 'text-neutral-400'
        };
      default:
        return {
          label: status as string,
          icon: CreditCard,
          bgColor: 'bg-neutral-500/20',
          textColor: 'text-neutral-400',
          borderColor: 'border-neutral-500/50',
          iconColor: 'text-neutral-400'
        };
    }
  };

  const config = type === 'booking' ? getBookingConfig() : getPaymentConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], config.iconColor)} />}
      <span>{config.label}</span>
    </span>
  );
};

/**
 * ActionRequiredIndicator Component
 * 
 * Visuele indicator voor rijen in tabellen die actie vereisen.
 * Gebruikt een kleurgecodeerde verticale lijn links van de rij.
 */
interface ActionRequiredIndicatorProps {
  status: Reservation['status'];
  paymentStatus?: 'pending' | 'paid' | 'overdue' | 'refunded';
  className?: string;
}

export const ActionRequiredIndicator: React.FC<ActionRequiredIndicatorProps> = ({
  status,
  paymentStatus,
  className
}) => {
  // Bepaal of de rij actie vereist
  const requiresAction = status === 'pending' || status === 'request' || paymentStatus === 'overdue';

  if (!requiresAction) {
    return null;
  }

  const colorClass = paymentStatus === 'overdue' ? 'border-red-500' : 'border-orange-500';

  return (
    <div
      className={cn(
        'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
        'border-l-4',
        colorClass,
        className
      )}
      aria-label="Actie vereist"
    />
  );
};
