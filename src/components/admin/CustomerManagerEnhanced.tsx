import React, { useState, useEffect } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { useAdminStore } from '../../store/adminStore';
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
  const { selectedItemId, clearSelectedItemId } = useAdminStore();

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
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {selectedCustomer ? (
        // Customer Detail View
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => selectCustomer(null)}
              className="p-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{selectedCustomer.companyName}</h2>
              <p className="text-neutral-400">{selectedCustomer.contactPerson}</p>
            </div>
            <div className={cn('text-2xl', getCustomerLevel(selectedCustomer.totalSpent).color)}>
              {getCustomerLevel(selectedCustomer.totalSpent).icon} {getCustomerLevel(selectedCustomer.totalSpent).level}
            </div>
          </div>

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
                    selectedCustomer.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))
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
      ) : (
        // Customer List View
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-white">Klanten Overzicht</h2>
            <p className="text-neutral-400 mt-1">
              {filteredCustomers.length} van {customers.length} klanten
            </p>
          </div>

          {/* Search & Sort */}
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Zoek klanten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                >
                  <option value="lastBooking">Laatste Boeking</option>
                  <option value="name">Naam (A-Z)</option>
                  <option value="bookings">Meeste Boekingen</option>
                  <option value="spent">Hoogste Omzet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="grid gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="bg-neutral-800/50 rounded-lg p-12 text-center">
                <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 text-lg">Geen klanten gevonden</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const level = getCustomerLevel(customer.totalSpent);
                
                return (
                  <div
                    key={customer.email}
                    onClick={() => handleSelectCustomer(customer)}
                    className="bg-neutral-800/50 rounded-lg p-6 border-2 border-transparent hover:border-gold-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {customer.companyName}
                          </h3>
                          <span className={cn('text-lg', level.color)}>
                            {level.icon}
                          </span>
                          {customer.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
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
      )}
    </div>
  );
};
