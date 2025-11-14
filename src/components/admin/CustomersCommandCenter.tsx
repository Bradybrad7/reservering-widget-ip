/**
 * 👥 CUSTOMERS COMMAND CENTER - Complete CRM System
 * 
 * Features:
 * - Customer list met real-time stats
 * - Customer detail panel met complete history
 * - Customer segmentation (VIP, Regular, New)
 * - Lifetime value tracking
 * - Recent activity timeline
 * - Quick actions (email, reserveren, view history)
 * - Advanced filtering en search
 * - Customer notes en tags
 * 
 * November 2025
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Tag,
  FileText,
  Clock,
  Star,
  Award,
  Package,
  Phone,
  MapPin,
  History,
  Plus,
  ExternalLink,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useOperationsStore } from '../../store/operationsStore';
import type { CustomerProfile, Reservation } from '../../types';
import { cn, formatCurrency, formatDate } from '../../utils';
import { GlobalQuickStats } from './GlobalQuickStats';
import { useDebounce } from '../../hooks/useDebounce';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'bookings' | 'spent' | 'lastBooking' | 'firstBooking';
type FilterBy = 'all' | 'vip' | 'regular' | 'new' | 'inactive';

interface CustomerStats {
  total: number;
  vip: number;
  regular: number;
  newCustomers: number;
  inactive: number;
  totalRevenue: number;
  averageValue: number;
}

export const CustomersCommandCenter: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('lastBooking');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Stores
  const { customers, loadCustomers, isLoadingCustomers } = useCustomersStore();
  const { reservations, loadReservations } = useReservationsStore();
  const { setActiveTab, setCustomerContext } = useOperationsStore();

  // Load data
  React.useEffect(() => {
    loadCustomers();
    loadReservations();
  }, [loadCustomers, loadReservations]);

  // Customer segmentation helper
  const getCustomerSegment = (customer: CustomerProfile): 'vip' | 'regular' | 'new' | 'inactive' => {
    const daysSinceLastBooking = Math.floor(
      (new Date().getTime() - new Date(customer.lastBooking).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastBooking > 365) return 'inactive';
    if (customer.totalSpent >= 5000 || customer.totalBookings >= 10) return 'vip';
    if (customer.totalBookings === 1) return 'new';
    return 'regular';
  };

  // Calculate stats
  const stats = useMemo<CustomerStats>(() => {
    const segments = customers.map(getCustomerSegment);
    return {
      total: customers.length,
      vip: segments.filter(s => s === 'vip').length,
      regular: segments.filter(s => s === 'regular').length,
      newCustomers: segments.filter(s => s === 'new').length,
      inactive: segments.filter(s => s === 'inactive').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      averageValue: customers.length > 0 
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
        : 0
    };
  }, [customers]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Filter by segment
    if (filterBy !== 'all') {
      filtered = filtered.filter(c => getCustomerSegment(c) === filterBy);
    }

    // Search
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.companyName.toLowerCase().includes(query) ||
        c.contactPerson.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.phone && c.phone.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'lastBooking':
          return new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime();
        case 'firstBooking':
          return new Date(b.firstBooking).getTime() - new Date(a.firstBooking).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, filterBy, debouncedSearchQuery, sortBy]);

  const selectedCustomer = customers.find(c => c.email === selectedCustomerId);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-green-950/20 dark:to-emerald-950/20">
      {/* Global Quick Stats */}
      <GlobalQuickStats />

      {/* Header */}
      <div className="flex-shrink-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl shadow-lg">
                <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Klanten CRM
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Complete klantendatabase en relatiebeheer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* TODO: Export */}}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all hover:shadow-lg font-bold text-sm border-2 border-slate-200 dark:border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatsCard
            label="Totaal Klanten"
            value={stats.total.toString()}
            subValue="in database"
            icon={Users}
            gradient="from-blue-500 to-indigo-500"
          />
          <StatsCard
            label="VIP Klanten"
            value={stats.vip.toString()}
            subValue="high value"
            icon={Star}
            gradient="from-purple-500 to-pink-500"
          />
          <StatsCard
            label="Actieve Klanten"
            value={stats.regular.toString()}
            subValue="regelmatig"
            icon={CheckCircle}
            gradient="from-green-500 to-emerald-500"
          />
          <StatsCard
            label="Nieuwe Klanten"
            value={stats.newCustomers.toString()}
            subValue="eerste boeking"
            icon={TrendingUp}
            gradient="from-cyan-500 to-blue-500"
          />
          <StatsCard
            label="Inactief"
            value={stats.inactive.toString()}
            subValue="> 1 jaar geleden"
            icon={AlertCircle}
            gradient="from-orange-500 to-red-500"
          />
          <StatsCard
            label="Totale Omzet"
            value={formatCurrency(stats.totalRevenue)}
            subValue="lifetime value"
            icon={DollarSign}
            gradient="from-emerald-500 to-teal-500"
          />
          <StatsCard
            label="Gem. Waarde"
            value={formatCurrency(stats.averageValue)}
            subValue="per klant"
            icon={BarChart3}
            gradient="from-teal-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex-shrink-0 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          {/* Segment filters */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <FilterButton
              active={filterBy === 'all'}
              onClick={() => setFilterBy('all')}
              icon={Users}
              label="Alle"
              count={stats.total}
            />
            <FilterButton
              active={filterBy === 'vip'}
              onClick={() => setFilterBy('vip')}
              icon={Star}
              label="VIP"
              count={stats.vip}
            />
            <FilterButton
              active={filterBy === 'regular'}
              onClick={() => setFilterBy('regular')}
              icon={CheckCircle}
              label="Actief"
              count={stats.regular}
            />
            <FilterButton
              active={filterBy === 'new'}
              onClick={() => setFilterBy('new')}
              icon={TrendingUp}
              label="Nieuw"
              count={stats.newCustomers}
            />
            <FilterButton
              active={filterBy === 'inactive'}
              onClick={() => setFilterBy('inactive')}
              icon={AlertCircle}
              label="Inactief"
              count={stats.inactive}
            />
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Zoek klant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
            >
              <option value="lastBooking">Laatste boeking</option>
              <option value="firstBooking">Eerste boeking</option>
              <option value="name">Naam</option>
              <option value="bookings">Aantal boekingen</option>
              <option value="spent">Totale besteding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full flex gap-6">
          {/* Customer List */}
          <div className={cn(
            'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden',
            selectedCustomer ? 'w-2/5' : 'w-full'
          )}>
            <div className="h-full overflow-y-auto p-4 space-y-2">
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Laden...</p>
                  </div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Geen klanten gevonden
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pas je filters aan of zoek opnieuw
                    </p>
                  </div>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.email}
                    customer={customer}
                    segment={getCustomerSegment(customer)}
                    isSelected={selectedCustomerId === customer.email}
                    onClick={() => {
                      setSelectedCustomerId(customer.email);
                      setCustomerContext(customer.email, customer.companyName || customer.contactPerson);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Customer Detail */}
          {selectedCustomer && (
            <CustomerDetailPanel
              customer={selectedCustomer}
              segment={getCustomerSegment(selectedCustomer)}
              reservations={reservations.filter(r => r.email === selectedCustomer.email)}
              onClose={() => setSelectedCustomerId(null)}
              onViewReservations={() => {
                setActiveTab('reservations');
                // Context is already set
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatsCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  gradient: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, icon: Icon, gradient }) => (
  <div className="relative group bg-white dark:bg-slate-900 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg transition-all">
    <div className={cn(
      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl',
      `bg-gradient-to-br ${gradient}`
    )}></div>
    
    <div className="relative z-10">
      <div className={cn('inline-flex p-2 rounded-lg mb-2', `bg-gradient-to-br ${gradient}`)}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      
      <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-white transition-colors">
        {value}
      </div>
      
      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors">
        {label}
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-500 group-hover:text-white/70 transition-colors mt-1">
        {subValue}
      </div>
    </div>
  </div>
);

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all',
      active
        ? 'bg-green-600 text-white shadow-lg'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-black',
      active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
    )}>
      {count}
    </span>
  </button>
);

interface CustomerCardProps {
  customer: CustomerProfile;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  isSelected: boolean;
  onClick: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, segment, isSelected, onClick }) => {
  const segmentConfig = {
    vip: { icon: Star, color: 'from-purple-500 to-pink-500', label: 'VIP', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    regular: { icon: CheckCircle, color: 'from-green-500 to-emerald-500', label: 'Actief', bg: 'bg-green-50 dark:bg-green-900/20' },
    new: { icon: TrendingUp, color: 'from-cyan-500 to-blue-500', label: 'Nieuw', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    inactive: { icon: AlertCircle, color: 'from-orange-500 to-red-500', label: 'Inactief', bg: 'bg-orange-50 dark:bg-orange-900/20' }
  };

  const config = segmentConfig[segment];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl transition-all border-2',
        isSelected
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg'
          : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">
              {customer.companyName}
            </h4>
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black',
              `bg-gradient-to-r ${config.color} text-white`
            )}>
              <Icon className="w-3 h-3" />
              {config.label}
            </div>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {customer.contactPerson}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {customer.totalBookings} boekingen
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(customer.totalSpent)}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(customer.totalSpent)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {formatDate(customer.lastBooking)}
          </div>
        </div>
      </div>
    </button>
  );
};

interface CustomerDetailPanelProps {
  customer: CustomerProfile;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  reservations: Reservation[];
  onClose: () => void;
  onViewReservations: () => void;
}

const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  segment,
  reservations,
  onClose,
  onViewReservations
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(customer.notes || customer.customerNotes || '');

  const segmentConfig = {
    vip: { icon: Star, color: 'from-purple-500 to-pink-500', label: 'VIP Client' },
    regular: { icon: CheckCircle, color: 'from-green-500 to-emerald-500', label: 'Actieve Klant' },
    new: { icon: TrendingUp, color: 'from-cyan-500 to-blue-500', label: 'Nieuwe Klant' },
    inactive: { icon: AlertCircle, color: 'from-orange-500 to-red-500', label: 'Inactieve Klant' }
  };

  const config = segmentConfig[segment];
  const Icon = config.icon;

  // Sort reservations by date (newest first)
  const sortedReservations = [...reservations].sort((a, b) => 
    new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  return (
    <div className="w-3/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className={cn(
        'relative p-6',
        `bg-gradient-to-r ${config.color}`
      )}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-black text-white">
                {customer.companyName}
              </h3>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold text-white">
                {config.label}
              </span>
            </div>
            <p className="text-white/90 font-medium">{customer.contactPerson}</p>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {customer.totalBookings}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Boekingen</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {formatCurrency(customer.totalSpent)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Lifetime Value</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
            {customer.averageGroupSize}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Gem. Groepsgrootte</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewReservations}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl transition-all font-bold text-sm"
            >
              <Eye className="w-4 h-4" />
              Bekijk Reserveringen
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl transition-all font-bold text-sm"
            >
              <Mail className="w-4 h-4" />
              Email Sturen
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Notities</h4>
            {!editingNotes && (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Bewerken
              </button>
            )}
          </div>
          
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all resize-none"
                rows={4}
                placeholder="Voeg notities toe over deze klant..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // TODO: Save notes
                    setEditingNotes(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setNotes(customer.notes || customer.customerNotes || '');
                    setEditingNotes(false);
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              {notes || 'Nog geen notities toegevoegd'}
            </p>
          )}
        </div>

        {/* Recent Reservations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Recente Boekingen ({reservations.length})
            </h4>
            <button
              onClick={onViewReservations}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
            >
              Bekijk alles
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {sortedReservations.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-4">
                Nog geen reserveringen
              </p>
            ) : (
              sortedReservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatDate(reservation.eventDate)}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-black',
                      reservation.status === 'confirmed' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                      reservation.status === 'pending' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                      reservation.status === 'cancelled' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    )}>
                      {reservation.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{reservation.numberOfPersons} personen</span>
                    <span>{formatCurrency(reservation.totalPrice)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
