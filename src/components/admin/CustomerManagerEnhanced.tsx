import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  ArrowLeft,
  Tag,
  FileText,
  Clock,
  BarChart3,
  Package,
  X,
  ArrowUpDown,
  List
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { useAdminStore } from '../../store/adminStore';
import { useOperationsStore } from '../../store/operationsStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import type { CustomerProfile } from '../../types';

export const CustomerManagerEnhanced: React.FC = () => {
  // ✨ REFACTORED: Use customersStore instead of adminStore (October 2025)
  const {
    customers,
    selectedCustomer,
    isLoadingCustomers,
    loadCustomers,
    loadCustomer,
    selectCustomer,
    updateCustomer
  } = useCustomersStore();

  // Get selectedItemId from adminStore for deep linking from search
  const { selectedItemId, clearSelectedItemId, setActiveSection } = useAdminStore();
  
  // ✨ Operations Store - Voor context-bewuste workflow
  const { setCustomerContext } = useOperationsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerProfile[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'spent' | 'lastBooking'>('lastBooking');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // ✨ NEW: Auto-select customer when coming from search
  useEffect(() => {
    if (selectedItemId && customers.length > 0) {
      // selectedItemId is the email for customers
      const customer = customers.find(c => c.email === selectedItemId);
      if (customer) {
        selectCustomer(customer);
        // Clear the selectedItemId after selecting
        clearSelectedItemId();
      }
    }
  }, [selectedItemId, customers, selectCustomer, clearSelectedItemId]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, sortBy]);

  useEffect(() => {
    if (selectedCustomer) {
      setNotes(selectedCustomer.notes || '');
      setTags(selectedCustomer.tags || []);
    }
  }, [selectedCustomer]);

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.companyName.toLowerCase().includes(term) ||
        c.contactPerson.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
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
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const handleSelectCustomer = async (customer: CustomerProfile) => {
    await loadCustomer(customer.email);
    // ✨ Set context voor Operations Control Center
    setCustomerContext(customer.email, customer.companyName || customer.contactPerson);
  };

  const handleSaveNotes = async () => {
    if (selectedCustomer) {
      await updateCustomer(selectedCustomer.email, { notes });
      setEditingNotes(false);
    }
  };

  const handleSaveTags = async () => {
    if (selectedCustomer) {
      await updateCustomer(selectedCustomer.email, { tags });
      setEditingTags(false);
      await loadCustomer(selectedCustomer.email);
    }
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const getCustomerLevel = (totalSpent: number) => {
    if (totalSpent >= 5000) return { level: 'Platinum', color: 'text-purple-400', icon: '👑' };
    if (totalSpent >= 2500) return { level: 'Gold', color: 'text-gold-400', icon: '⭐' };
    if (totalSpent >= 1000) return { level: 'Silver', color: 'text-neutral-400', icon: '🥈' };
    return { level: 'Bronze', color: 'text-orange-400', icon: '🥉' };
  };

  if (isLoadingCustomers && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-neutral-700 border-t-gold-500 mb-6"></div>
            <div className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full h-16 w-16 border-2 border-gold-500/30"></div>
          </div>
          <p className="text-lg font-semibold text-neutral-300 mb-2">Klanten laden...</p>
          <p className="text-sm text-neutral-500">Even geduld, we halen alles op</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {selectedCustomer ? (
        // Customer Detail View
        <div className="flex flex-col h-full">
          {/* Enhanced Header with Back Button */}
          <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex items-center gap-5">
                {/* Back button met moderne styling */}
                <button
                  onClick={() => selectCustomer(null)}
                  className="p-3 bg-gradient-to-br from-neutral-700 to-neutral-800 text-white rounded-xl hover:from-neutral-600 hover:to-neutral-700 transition-all duration-200 shadow-lg hover:scale-105 group"
                  title="Terug naar overzicht"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-200" />
                </button>

                {/* Customer info met level badge */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
                      {selectedCustomer.companyName}
                    </h2>
                    {/* Customer Level Badge */}
                    <div className={cn(
                      'px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2',
                      getCustomerLevel(selectedCustomer.totalSpent).level === 'Gold' && 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-gold-500/30',
                      getCustomerLevel(selectedCustomer.totalSpent).level === 'Silver' && 'bg-gradient-to-br from-neutral-400 to-neutral-500 text-white shadow-neutral-400/30',
                      getCustomerLevel(selectedCustomer.totalSpent).level === 'Bronze' && 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/30'
                    )}>
                      <span className="text-lg">{getCustomerLevel(selectedCustomer.totalSpent).icon}</span>
                      <span>{getCustomerLevel(selectedCustomer.totalSpent).level}</span>
                    </div>
                  </div>
                  <p className="text-neutral-400 mt-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedCustomer.contactPerson} • {selectedCustomer.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Customer Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-gold-400" />
                <div className="text-sm text-neutral-400">Totaal Besteed</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(selectedCustomer.totalSpent)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div className="text-sm text-neutral-400">Totaal Boekingen</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {selectedCustomer.totalBookings}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-purple-400" />
                <div className="text-sm text-neutral-400">Gem. Groepsgrootte</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {selectedCustomer.averageGroupSize}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div className="text-sm text-neutral-400">Laatste Boeking</div>
              </div>
              <div className="text-lg font-bold text-white">
                {formatDate(selectedCustomer.lastBooking)}
              </div>
            </div>
          </div>

          {/* Contact Info & Tags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-neutral-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Contactinformatie
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-300">
                  <Mail className="w-5 h-5 text-neutral-500" />
                  <div>
                    <div className="text-xs text-neutral-500">Email</div>
                    <div>{selectedCustomer.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-neutral-300">
                  <Users className="w-5 h-5 text-neutral-500" />
                  <div>
                    <div className="text-xs text-neutral-500">Contactpersoon</div>
                    <div>{selectedCustomer.contactPerson}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-neutral-300">
                  <Calendar className="w-5 h-5 text-neutral-500" />
                  <div>
                    <div className="text-xs text-neutral-500">Klant Sinds</div>
                    <div>{formatDate(selectedCustomer.firstBooking)}</div>
                  </div>
                </div>
                {selectedCustomer.preferredArrangement && (
                  <div className="flex items-center gap-3 text-neutral-300">
                    <Package className="w-5 h-5 text-neutral-500" />
                    <div>
                      <div className="text-xs text-neutral-500">Voorkeur Arrangement</div>
                      <div>{selectedCustomer.preferredArrangement}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✨ INTELLIGENTE CROSS-NAVIGATION: Spring naar Reserveringen of Betalingen met context */}
              <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                <button
                  onClick={() => {
                    // Context is al gezet door handleSelectCustomer
                    // Wissel alleen naar de juiste tab
                    const { setActiveTab } = useOperationsStore.getState();
                    setActiveTab('reservations');
                  }}
                  className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 group"
                >
                  <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Bekijk Reserveringen ({selectedCustomer.totalBookings})</span>
                </button>
                
                <button
                  onClick={() => {
                    const { setActiveTab } = useOperationsStore.getState();
                    setActiveTab('payments');
                  }}
                  className="w-full px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:text-green-300 transition-all flex items-center justify-center gap-2 group"
                >
                  <DollarSign className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Bekijk Betalingen</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-neutral-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </h3>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="text-sm text-gold-400 hover:text-gold-300"
                >
                  {editingTags ? 'Annuleren' : 'Bewerken'}
                </button>
              </div>

              {editingTags ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-gold-300">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['VIP', 'Corporate', 'Vaste Klant', 'Zakelijk', 'Birthday'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        disabled={tags.includes(tag)}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm',
                          tags.includes(tag)
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                            : 'bg-neutral-700 text-neutral-300 hover:bg-gold-500 hover:text-white'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveTags}
                    className="w-full px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                  >
                    Tags Opslaan
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.length === 0 ? (
                    <span className="text-neutral-500 text-sm">Geen tags</span>
                  ) : (
                    selectedCustomer.tags.map(tag => {
                      const tagId = typeof tag === 'string' ? tag : 
                        (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                      return (
                        <span
                          key={tagId}
                          className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm"
                        >
                          {tagId}
                        </span>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-neutral-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notities
              </h3>
              <button
                onClick={() => {
                  if (editingNotes) {
                    setEditingNotes(false);
                    setNotes(selectedCustomer.notes || '');
                  } else {
                    setEditingNotes(true);
                  }
                }}
                className="text-sm text-gold-400 hover:text-gold-300"
              >
                {editingNotes ? 'Annuleren' : 'Bewerken'}
              </button>
            </div>

            {editingNotes ? (
              <div className="space-y-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Voeg notities toe over deze klant..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                >
                  Notities Opslaan
                </button>
              </div>
            ) : (
              <div className="text-neutral-300">
                {selectedCustomer.notes || (
                  <span className="text-neutral-500 italic">Geen notities</span>
                )}
              </div>
            )}
          </div>

          {/* Booking History */}
          <div className="bg-neutral-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Boekingsgeschiedenis ({selectedCustomer.reservations.length})
            </h3>

            <div className="space-y-3">
              {selectedCustomer.reservations.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">Geen boekingen gevonden</p>
              ) : (
                selectedCustomer.reservations.map((reservation) => {
                  const statusColors: Record<string, string> = {
                    confirmed: 'bg-green-500/20 text-green-400',
                    pending: 'bg-orange-500/20 text-orange-400',
                    waitlist: 'bg-blue-500/20 text-blue-400',
                    cancelled: 'bg-neutral-500/20 text-neutral-400',
                    rejected: 'bg-red-500/20 text-red-400',
                    request: 'bg-purple-500/20 text-purple-400',
                    'checked-in': 'bg-teal-500/20 text-teal-400'
                  };

                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          <span className="font-medium text-white">
                            {formatDate(reservation.eventDate)}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            statusColors[reservation.status]
                          )}>
                            {reservation.status}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-400">
                          {reservation.numberOfPersons} personen • {reservation.arrangement}
                          {reservation.preDrink.enabled && ' • Pre-drink'}
                          {reservation.afterParty.enabled && ' • After-party'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gold-400">
                          {formatCurrency(reservation.totalPrice)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatDate(reservation.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          </div>
        </div>
        </div>
      ) : (
        // Customer List View
        <div className="flex flex-col h-full">
          {/* Enhanced Header */}
          <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 shadow-xl">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                {/* Linker sectie: Titel */}
                <div className="flex items-center gap-5">
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl">
                    <Users className="w-8 h-8 text-white relative z-10" />
                    <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-200 to-teal-400 bg-clip-text text-transparent">
                      Klanten Overzicht
                    </h1>
                    <p className="text-neutral-400 mt-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {filteredCustomers.length} van {customers.length} klanten
                    </p>
                  </div>
                </div>

                {/* Rechter sectie: Stats */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="px-5 py-3 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 shadow-lg">
                    <div className="text-2xl font-bold text-emerald-400">
                      {customers.length}
                    </div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider">
                      Totaal Klanten
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Sort Bar */}
            <div className="px-8 pb-6">
              <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enhanced Search */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-gold-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Zoek op naam, bedrijf of email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-400" />
                      </button>
                    )}
                  </div>

                  {/* Enhanced Sort */}
                  <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all appearance-none cursor-pointer"
                    >
                      <option value="lastBooking">Laatste Boeking</option>
                      <option value="name">Naam (A-Z)</option>
                      <option value="bookings">Meeste Boekingen</option>
                      <option value="spent">Hoogste Omzet</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer List - Scrollable Content Area */}
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="grid gap-4 max-w-7xl mx-auto">
              {filteredCustomers.length === 0 ? (
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-neutral-700 shadow-xl">
                  <Users className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
                  <p className="text-neutral-300 text-xl font-semibold mb-2">Geen klanten gevonden</p>
                  <p className="text-neutral-500">Pas je zoekfilters aan of voeg nieuwe klanten toe</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => {
                  const level = getCustomerLevel(customer.totalSpent);
                  
                  return (
                    <div
                      key={customer.email}
                      onClick={() => handleSelectCustomer(customer)}
                      className="group relative bg-gradient-to-br from-neutral-800/80 to-neutral-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-neutral-700 hover:border-gold-500/50 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold-500/10"
                    >
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 to-gold-500/0 group-hover:from-gold-500/5 group-hover:to-transparent rounded-xl transition-all duration-200"></div>
                      
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {/* Company name */}
                            <h3 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                              {customer.companyName}
                            </h3>
                            
                            {/* Level badge */}
                            <span className={cn(
                              'px-3 py-1 rounded-lg font-bold text-sm shadow-lg flex items-center gap-1.5',
                              level.level === 'Gold' && 'bg-gradient-to-br from-gold-500 to-gold-600 text-white',
                              level.level === 'Silver' && 'bg-gradient-to-br from-neutral-400 to-neutral-500 text-white',
                              level.level === 'Bronze' && 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                            )}>
                              <span>{level.icon}</span>
                              <span>{level.level}</span>
                            </span>
                            
                            {/* Tags */}
                            {customer.tags.map(tag => {
                              const tagId = typeof tag === 'string' ? tag : 
                                (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                              return (
                                <span
                                  key={tagId}
                                  className="px-3 py-1 bg-gradient-to-br from-gold-500/20 to-gold-600/10 text-gold-400 rounded-lg text-xs font-semibold border border-gold-500/30"
                                >
                                  {tagId}
                                </span>
                              );
                            })}
                          </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-neutral-300">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-500" />
                            <span>{customer.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-neutral-500" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <span>{customer.totalBookings} boekingen</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutral-500" />
                            <span>{formatDate(customer.lastBooking)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gold-400">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                        <div className="text-xs text-neutral-500">Totaal besteed</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
