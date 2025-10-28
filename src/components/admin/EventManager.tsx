import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  CalendarPlus,
  Trash
} from 'lucide-react';
import type { Event, EventType, Arrangement } from '../../types';
import { useAdminStore } from '../../store/adminStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { formatDate, formatTime, cn, getEventTypeName } from '../../utils';
import { nl, eventTypeConfig } from '../../config/defaults';
import { BulkEventModal } from './BulkEventModal';
import apiService from '../../services/apiService';

export const EventManager: React.FC = () => {
  const {
    isLoadingEvents,
    filters,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setEventTypeFilter,
    setDateRangeFilter,
    getFilteredEvents,
    eventTypesConfig,
    loadConfig,
    shows,
    loadShows
  } = useAdminStore();

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventBookingStats, setEventBookingStats] = useState<{
    confirmedTotal: number;
    pendingTotal: number;
    confirmedCount: number;
    pendingCount: number;
    checkedInTotal: number;
    checkedInCount: number;
  } | null>(null);
  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    date: new Date(),
    doorsOpen: '19:00',
    startsAt: '20:00',
    endsAt: '22:30',
    type: 'REGULAR',
    showId: '', // Will be set to first show on load
    capacity: 230,
    remainingCapacity: 230,
    bookingOpensAt: null,
    bookingClosesAt: null,
    allowedArrangements: ['BWF', 'BWFM'],
    isActive: true
  });
  
  // ✨ NEW: Capacity Override State
  const [capacityOverride, setCapacityOverride] = useState<{
    enabled: boolean;
    capacity: number;
  }>({
    enabled: false,
    capacity: 230
  });

  useEffect(() => {
    loadEvents();
    loadConfig();
    loadShows();
  }, [loadEvents, loadConfig, loadShows]);

  const filteredEvents = getFilteredEvents();

  const handleCreate = () => {
    setEditingEvent(null);
    setEventBookingStats(null);
    // Get first active show or first show as default
    const defaultShow = shows.find(s => s.isActive) || shows[0];
    setFormData({
      date: new Date(),
      doorsOpen: '19:00',
      startsAt: '20:00',
      endsAt: '22:30',
      type: 'REGULAR',
      showId: defaultShow?.id || '',
      capacity: 230,
      remainingCapacity: 230,
      bookingOpensAt: null,
      bookingClosesAt: null,
      allowedArrangements: ['BWF', 'BWFM'],
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      date: event.date,
      doorsOpen: event.doorsOpen,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      type: event.type,
      showId: event.showId,
      capacity: event.capacity,
      remainingCapacity: event.remainingCapacity,
      bookingOpensAt: event.bookingOpensAt,
      bookingClosesAt: event.bookingClosesAt,
      allowedArrangements: event.allowedArrangements,
      customPricing: event.customPricing,
      notes: event.notes,
      isActive: event.isActive
    });
    
    // ✨ NEW: Load capacity override from localStorage
    const overrideKey = `capacity-override-${event.id}`;
    const overrideData = localStorage.getItem(overrideKey);
    if (overrideData) {
      try {
        const parsed = JSON.parse(overrideData);
        setCapacityOverride(parsed);
      } catch (e) {
        console.error('Failed to parse capacity override:', e);
        setCapacityOverride({ enabled: false, capacity: event.capacity });
      }
    } else {
      setCapacityOverride({ enabled: false, capacity: event.capacity });
    }
    
    // Load booking statistics
    loadEventBookingStats(event.id);
    setShowModal(true);
  };

  const loadEventBookingStats = async (eventId: string) => {
    const reservationsResponse = await apiService.getReservationsByEvent(eventId);
    const reservations = reservationsResponse.data || [];
    const confirmedBookings = reservations.filter(r => r.status === 'confirmed');
    const pendingBookings = reservations.filter(r => r.status === 'pending');
    const checkedInBookings = reservations.filter(r => r.status === 'checked-in');
    const confirmedTotal = confirmedBookings.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const pendingTotal = pendingBookings.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const checkedInTotal = checkedInBookings.reduce((sum, r) => sum + r.numberOfPersons, 0);
    
    setEventBookingStats({
      confirmedTotal,
      pendingTotal,
      confirmedCount: confirmedBookings.length,
      pendingCount: pendingBookings.length,
      checkedInTotal,
      checkedInCount: checkedInBookings.length
    });
  };

  const handleDelete = async (event: Event) => {
    // ✅ FIX: Check voor actieve reserveringen
    const reservationsResponse = await apiService.getReservationsByEvent(event.id);
    const reservations = reservationsResponse.data || [];
    const activeReservations = reservations.filter(r => r.status !== 'cancelled');
    
    let confirmMessage = `Weet je zeker dat je dit evenement op ${formatDate(event.date)} wilt verwijderen?`;
    
    if (activeReservations.length > 0) {
      const totalPersons = activeReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      confirmMessage = `⚠️ LET OP: Dit event heeft ${activeReservations.length} actieve reservering(en) voor totaal ${totalPersons} personen.\n\n` +
                       `Deze reserveringen worden ook permanent verwijderd!\n\n` +
                       `Status breakdown:\n` +
                       `- Bevestigd: ${activeReservations.filter(r => r.status === 'confirmed').length}\n` +
                       `- In afwachting: ${activeReservations.filter(r => r.status === 'pending').length}\n` +
                       `- Wachtlijst: ${activeReservations.filter(r => r.status === 'waitlist').length}\n\n` +
                       `Weet je ZEKER dat je door wilt gaan?`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    await deleteEvent(event.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 handleSubmit called', { formData, editingEvent });
    
    // ✅ FIX: Valideer capaciteit bij edit
    if (editingEvent) {
      const reservationsResponse = await apiService.getReservationsByEvent(editingEvent.id);
      const reservations = reservationsResponse.data || [];
      const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');
      const totalBooked = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      
      if (formData.capacity < totalBooked) {
        alert(
          `⚠️ Capaciteit kan niet lager zijn dan ${totalBooked} personen.\n\n` +
          `Er zijn al ${totalBooked} personen geboekt voor dit event:\n` +
          `- ${confirmedReservations.length} reservering(en)\n` +
          `- Huidige capaciteit: ${editingEvent.capacity}\n` +
          `- Nieuwe capaciteit: ${formData.capacity}\n\n` +
          `Verhoog de capaciteit of annuleer eerst enkele reserveringen.`
        );
        return;
      }
      
      // Update remainingCapacity correct
      formData.remainingCapacity = formData.capacity - totalBooked;
    }
    
    console.log('📤 Attempting to save event...', { isEdit: !!editingEvent });
    let success = false;
    if (editingEvent) {
      success = await updateEvent(editingEvent.id, formData);
      console.log('✏️ Update result:', success);
    } else {
      success = await createEvent(formData);
      console.log('➕ Create result:', success);
    }
    
    if (success) {
      console.log('✅ Event saved successfully, closing modal');
      
      // ✨ NEW: Save capacity override to localStorage if editing
      if (editingEvent) {
        const overrideKey = `capacity-override-${editingEvent.id}`;
        if (capacityOverride.enabled) {
          localStorage.setItem(overrideKey, JSON.stringify(capacityOverride));
          console.log('💾 Capacity override saved:', capacityOverride);
        } else {
          localStorage.removeItem(overrideKey);
          console.log('🗑️ Capacity override removed');
        }
      }
      
      setShowModal(false);
      setEditingEvent(null);
      setEventBookingStats(null);
      setCapacityOverride({ enabled: false, capacity: 230 });
    } else {
      console.error('❌ Failed to save event');
      alert('Er is een fout opgetreden bij het opslaan van het evenement. Controleer de console voor meer details.');
    }
  };

  const handleTypeChange = (type: EventType) => {
    const config = eventTypeConfig[type];
    setFormData({
      ...formData,
      type,
      doorsOpen: config.defaultTimes.doorsOpen,
      startsAt: config.defaultTimes.startsAt,
      endsAt: config.defaultTimes.endsAt
    });
  };

  const toggleArrangement = (arrangement: Arrangement) => {
    const current = formData.allowedArrangements || [];
    const newArrangements = current.includes(arrangement)
      ? current.filter(a => a !== arrangement)
      : [...current, arrangement];
    
    setFormData({
      ...formData,
      allowedArrangements: newArrangements
    });
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return;
    
    if (!confirm(`Weet je zeker dat je ${selectedEvents.length} evenement(en) wilt verwijderen?`)) {
      return;
    }

    const response = await apiService.bulkDeleteEvents(selectedEvents);
    if (response.success) {
      setSelectedEvents([]);
      loadEvents();
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map(e => e.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Evenementen Beheer</h2>
          <p className="text-dark-600 mt-1">Beheer alle evenementen en data</p>
        </div>
        <div className="flex gap-2">
          {selectedEvents.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash className="w-5 h-5" />
              Verwijder ({selectedEvents.length})
            </button>
          )}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <CalendarPlus className="w-5 h-5" />
            Bulk Toevoegen
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nieuw Evenement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-100 mb-1">
              Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => setEventTypeFilter(e.target.value as EventType | 'all')}
              className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Alle types</option>
              {eventTypesConfig?.types.filter(t => t.enabled).map(type => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              )) || Object.entries(nl.eventTypes).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-100 mb-1">
              Van datum
            </label>
            <input
              type="date"
              value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setDateRangeFilter(date, filters.dateRange.end);
              }}
              className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-100 mb-1">
              Tot datum
            </label>
            <input
              type="date"
              value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setDateRangeFilter(filters.dateRange.start, date);
              }}
              className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100 border-b border-dark-200">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-500 border-dark-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Tijden
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Capaciteit
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-neutral-800/50 divide-y divide-dark-200 text-sm">
              {isLoadingEvents ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-500">
                    Geen evenementen gevonden
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-100 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="w-4 h-4 text-primary-500 border-dark-300 rounded focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-dark-400 mr-2" />
                        <span className="text-sm font-medium text-white">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        event.type === 'REGULAR' && 'bg-blue-100 text-blue-800',
                        event.type === 'MATINEE' && 'bg-purple-100 text-purple-800',
                        event.type === 'CARE_HEROES' && 'bg-green-100 text-green-800',
                        event.type === 'REQUEST' && 'bg-yellow-100 text-yellow-800',
                        event.type === 'UNAVAILABLE' && 'bg-red-100 text-red-800'
                      )}>
                        {getEventTypeName(event.type)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-100">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm justify-between">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-dark-400" />
                            {/* Bereken het werkelijke aantal geboekte personen */}
                            {(() => {
                              // Type guard: AdminEvent heeft reservations array
                              const adminEvent = event as any;
                              const totalBookedPersons = (adminEvent.reservations || [])
                                .filter((r: any) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in')
                                .reduce((sum: number, r: any) => sum + r.numberOfPersons, 0);
                              const waitlistCount = useWaitlistStore.getState().getWaitlistCount(event.id);
                              
                              return (
                                <>
                                  <span className={cn(
                                    "font-medium",
                                    totalBookedPersons > event.capacity ? "text-red-400" : "text-white"
                                  )}>
                                    {totalBookedPersons}
                                  </span>
                                  <span className="text-dark-500">/{event.capacity}</span>
                                  {waitlistCount > 0 && (
                                    <span className="ml-1 text-xs text-orange-400" title={`${waitlistCount} personen op wachtlijst`}>
                                      (+{waitlistCount})
                                    </span>
                                  )}
                                  {/* Check for override indicator */}
                                  {(() => {
                                    const overrideKey = `capacity-override-${event.id}`;
                                    const overrideData = localStorage.getItem(overrideKey);
                                    if (overrideData) {
                                      try {
                                        const override = JSON.parse(overrideData);
                                        if (override && override.enabled) {
                                          return (
                                            <span 
                                              className="ml-1 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-500/30"
                                              title={`Override actief: ${override.capacity} personen`}
                                            >
                                              🔧
                                            </span>
                                          );
                                        }
                                      } catch (e) {}
                                    }
                                    return null;
                                  })()}
                                </>
                              );
                            })()}
                          </div>
                          <span className="text-xs text-neutral-300 ml-2">
                            {(() => {
                              const adminEvent = event as any;
                              const totalBookedPersons = (adminEvent.reservations || [])
                                .filter((r: any) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in')
                                .reduce((sum: number, r: any) => sum + r.numberOfPersons, 0);
                              return Math.round((totalBookedPersons / event.capacity) * 100);
                            })()}%
                          </span>
                        </div>
                        {/* Capacity Progress Bar */}
                        <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300 rounded-full',
                              (() => {
                                const adminEvent = event as any;
                                const totalBookedPersons = (adminEvent.reservations || [])
                                  .filter((r: any) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in')
                                  .reduce((sum: number, r: any) => sum + r.numberOfPersons, 0);
                                const filledRatio = totalBookedPersons / event.capacity;
                                return filledRatio >= 0.9 ? 'bg-red-500' :
                                       filledRatio >= 0.75 ? 'bg-orange-500' :
                                       filledRatio >= 0.5 ? 'bg-yellow-500' : 'bg-green-500';
                              })()
                            )}
                            style={{
                              width: `${(() => {
                                const adminEvent = event as any;
                                const totalBookedPersons = (adminEvent.reservations || [])
                                  .filter((r: any) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in')
                                  .reduce((sum: number, r: any) => sum + r.numberOfPersons, 0);
                                return Math.min((totalBookedPersons / event.capacity) * 100, 100);
                              })()}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {event.isActive ? (
                        <span className="flex items-center text-sm text-green-600">
                          <ToggleRight className="w-5 h-5 mr-1" />
                          Actief
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-dark-400">
                          <ToggleLeft className="w-5 h-5 mr-1" />
                          Inactief
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-primary-500 hover:text-gold-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800/50 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-800 border-b border-dark-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingEvent ? 'Evenement Bewerken' : 'Nieuw Evenement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-dark-400 hover:text-neutral-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date instanceof Date && !isNaN(formData.date.getTime()) 
                    ? formData.date.toISOString().split('T')[0] 
                    : ''
                  }
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      setFormData({ ...formData, date: new Date(dateValue + 'T12:00:00') });
                    }
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as EventType)}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {eventTypesConfig?.types.filter(t => t.enabled).map(type => (
                    <option key={type.key} value={type.key}>
                      {type.name}
                    </option>
                  )) || Object.entries(nl.eventTypes).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Show Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Show *
                </label>
                <select
                  required
                  value={formData.showId}
                  onChange={(e) => setFormData({ ...formData, showId: e.target.value })}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecteer een show...</option>
                  {shows.filter(s => s.isActive).map(show => (
                    <option key={show.id} value={show.id}>
                      {show.name}
                    </option>
                  ))}
                </select>
                {shows.length === 0 && (
                  <p className="text-sm text-yellow-500 mt-1">
                    ⚠️ Geen shows beschikbaar - maak eerst een show aan in Shows Beheren
                  </p>
                )}
              </div>

              {/* Times */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Deuren Open *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.doorsOpen}
                    onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Start *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Einde *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Capacity - Enhanced with booking info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Capaciteit * <span className="text-dark-400 text-xs font-normal">(Max aantal personen)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  
                  {/* Show booking statistics for existing events */}
                  {editingEvent && eventBookingStats && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-200 font-medium">Bevestigde bezetting:</span>
                        <span className="text-green-400 font-bold">
                          {eventBookingStats.confirmedTotal} / {formData.capacity} 
                          <span className="text-xs ml-1">({eventBookingStats.confirmedCount} reserv.)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-200 font-medium">Ingecheckt:</span>
                        <span className="text-emerald-400 font-bold">
                          {eventBookingStats.checkedInTotal}
                          <span className="text-xs ml-1">({eventBookingStats.checkedInCount} reserv.)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-200 font-medium">Aanvragen (pending):</span>
                        <span className="text-orange-400 font-bold">
                          + {eventBookingStats.pendingTotal} ({eventBookingStats.pendingCount})
                        </span>
                      </div>
                      {eventBookingStats.confirmedTotal > formData.capacity && (
                        <div className="pt-2 border-t border-orange-500/30">
                          <p className="text-xs text-orange-300 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Event is overbezet! Capaciteit is overschreden.</span>
                          </p>
                        </div>
                      )}
                      {eventBookingStats.confirmedTotal < formData.capacity && eventBookingStats.pendingTotal > 0 && (
                        <div className="pt-2 border-t border-blue-500/30">
                          <p className="text-xs text-blue-300">
                            💡 {formData.capacity - eventBookingStats.confirmedTotal} plaatsen beschikbaar voor bevestiging
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* ✨ NEW: Capacity Override Controls */}
                  {editingEvent && (
                    <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-warning-400 flex items-center gap-2">
                            🔧 Capaciteit Override
                          </h4>
                          <p className="text-xs text-warning-300 mt-1">
                            Tijdelijk de capaciteit aanpassen voor dit specifieke event
                          </p>
                        </div>
                        <label className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            checked={capacityOverride.enabled}
                            onChange={(e) => setCapacityOverride({
                              ...capacityOverride,
                              enabled: e.target.checked
                            })}
                            className="peer sr-only"
                          />
                          <div className="w-12 h-6 bg-neutral-700 border border-neutral-600 rounded-full peer-checked:bg-warning-600 peer-checked:border-warning-600 transition-all"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-neutral-400 rounded-full peer-checked:translate-x-6 peer-checked:bg-white transition-transform"></div>
                        </label>
                      </div>
                      
                      {capacityOverride.enabled && (
                        <div className="space-y-2 animate-fade-in">
                          <label className="block text-xs font-medium text-warning-300">
                            Override Capaciteit
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={capacityOverride.capacity}
                            onChange={(e) => setCapacityOverride({
                              ...capacityOverride,
                              capacity: parseInt(e.target.value) || 0
                            })}
                            className="w-full px-3 py-2 bg-neutral-800 border border-warning-500/50 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-warning-100 font-medium"
                          />
                          <p className="text-xs text-warning-300">
                            ℹ️ De override capaciteit ({capacityOverride.capacity}) wordt gebruikt in plaats van de basis capaciteit ({formData.capacity})
                          </p>
                          {eventBookingStats && (
                            <div className="pt-2 border-t border-warning-500/30">
                              <p className="text-xs text-warning-300">
                                {capacityOverride.capacity >= eventBookingStats.confirmedTotal ? (
                                  <>
                                    ✅ Override capaciteit is voldoende ({capacityOverride.capacity - eventBookingStats.confirmedTotal} plaatsen beschikbaar)
                                  </>
                                ) : (
                                  <>
                                    ⚠️ Override capaciteit is lager dan huidige bezetting (tekort van {eventBookingStats.confirmedTotal - capacityOverride.capacity} plaatsen)
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Arrangements */}
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-2">
                  Toegestane Arrangementen
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowedArrangements.includes('BWF')}
                      onChange={() => toggleArrangement('BWF')}
                      className="mr-2"
                    />
                    <span>Standaard Arrangement</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowedArrangements.includes('BWFM')}
                      onChange={() => toggleArrangement('BWFM')}
                      className="mr-2"
                    />
                    <span>Premium Arrangement</span>
                  </label>
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-neutral-200">
                    Evenement actief
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Notities
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optionele notities over dit evenement..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-dark-300 text-dark-700 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingEvent ? 'Bijwerken' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      <BulkEventModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          loadEvents();
          setShowBulkModal(false);
        }}
      />
    </div>
  );
};
