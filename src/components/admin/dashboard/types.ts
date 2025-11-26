/**
 * 🎯 Dashboard Types
 * 
 * Local types for ReservationsDashboard components
 */

export type MainTab = 'reserveringen' | 'betalingen' | 'opties' | 'archief';

export type ReserveringenSubTab = 'dashboard' | 'pending' | 'confirmed' | 'all' | 'today' | 'week' | 'month';

export type BetalingenSubTab = 'overview' | 'overdue' | 'unpaid' | 'partial' | 'history';

export type OptiesSubTab = 'overview' | 'expiring' | 'expired' | 'all';

export type DateFilter = 
  | { type: 'all' }
  | { type: 'day'; date: Date }
  | { type: 'week'; weekStart: Date; weekEnd: Date }
  | { type: 'month'; month: number; year: number };

export interface QuickStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

export interface CapacityInfo {
  current: number;
  max: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  shouldUseWaitlist: boolean;
}
