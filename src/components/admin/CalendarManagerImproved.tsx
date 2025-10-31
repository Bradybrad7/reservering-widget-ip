import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Save,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search
} from 'lucide-react';
import type { Event, EventType, AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import { getEventTypeName, getEventTypeColor } from '../../utils/eventColors';
import { cn, formatDate } from '../../utils';
// 🔒 getDefaultPricingForEvent NIET meer nodig - customPricing is disabled!

interface CalendarDay {
  date: Date;
  events: AdminEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  totalCapacity: number;
  totalBooked: number;
}

interface CalendarManagerImprovedProps {
  viewType?: 'calendar' | 'grid';
}

export const CalendarManagerImproved: React.FC<CalendarManagerImprovedProps> = () => {
  const {
    events,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    shows,
    loadShows
  } = useEventsStore();

  const { eventTypesConfig, loadConfig } = useConfigStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    date: new Date(),
    doorsOpen: '19:00',
    startsAt: '20:00',
    endsAt: '22:30',
    type: 'REGULAR',
    showId: '',
    capacity: 230,
    remainingCapacity: 230,
    bookingOpensAt: null,
    bookingClosesAt: null,
    allowedArrangements: ['BWF', 'BWFM'],
    isActive: true
  });

  useEffect(() => {
    loadEvents();
    loadShows();
    loadConfig();
  }, [loadEvents, loadShows, loadConfig]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, events]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    
    // Get day of week for first day (0 = Sunday, need Monday = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    // Calculate start date (may be in previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter((event: AdminEvent) => {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return eventDate.getTime() === date.getTime();
      });
      
      const totalCapacity = dayEvents.reduce((sum: number, e: AdminEvent) => sum + (e.capacity || 0), 0);
      const totalBooked = dayEvents.reduce((sum: number, e: AdminEvent) => sum + ((e.capacity || 0) - (e.remainingCapacity || 0)), 0);
      
      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        totalCapacity,
        totalBooked
      });
    }
    
    setCalendarDays(days);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      // Navigate to that month
      setCurrentDate(new Date(day.date));
    }
    setSelectedDate(day.date);
  };

  const handleAddEvent = (date?: Date) => {
    setEditingEvent(null);
    const defaultShow = shows.find(s => s.isActive) || shows[0];
    setFormData({
      date: date || selectedDate || new Date(),
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
      // 🔒 customPricing NIET meer - prijzen komen van PricingConfigManager!
      isActive: true
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event: AdminEvent) => {
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
      // 🔒 customPricing NIET meer opnemen - prijzen komen van PricingConfigManager!
      notes: event.notes,
      isActive: event.isActive
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (event: AdminEvent) => {
    if (!confirm(`Weet je zeker dat je dit evenement wilt verwijderen?\n\n${formatDate(event.date)} om ${event.startsAt}`)) {
      return;
    }
    await deleteEvent(event.id);
  };

  const handleToggleActive = async (event: AdminEvent) => {
    await updateEvent(event.id, { isActive: !event.isActive });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    if (editingEvent) {
      success = await updateEvent(editingEvent.id, formData);
    } else {
      // 🔒 customPricing NIET meer - prijzen komen van PricingConfigManager!
      success = await createEvent(formData);
    }
    
    if (success) {
      setShowEventModal(false);
      setEditingEvent(null);
    }
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  };

  const selectedDay = selectedDate 
    ? calendarDays.find(d => d.date.getTime() === selectedDate.getTime())
    : null;

  // Filter events based on search and filters
  const filteredDayEvents = selectedDay?.events.filter(event => {
    if (showActiveOnly && !event.isActive) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const show = shows.find(s => s.id === event.showId);
      return (
        show?.name.toLowerCase().includes(searchLower) ||
        getEventTypeName(event.type).toLowerCase().includes(searchLower) ||
        event.startsAt.includes(searchTerm)
      );
    }
    return true;
  }) || [];

  // Helper om Tailwind class te genereren op basis van hex color
  const hexToTailwindBg = (hex: string) => {
    // Voor dynamic kleuren gebruiken we inline style
    return '';
  };

  const getEventBgStyle = (type: EventType) => {
    const color = getEventTypeColor(type, eventTypesConfig || undefined);
    return { backgroundColor: color };
  };

  const getEventTextStyle = (type: EventType) => {
    const color = getEventTypeColor(type, eventTypesConfig || undefined);
    // Lighter shade voor text
    return { color };
  };

  const getOccupancyColor = (booked: number, capacity: number) => {
    const percentage = (booked / capacity) * 100;
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 80) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white min-w-[200px] text-center capitalize">
              {getMonthName()}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium transition-colors"
            >
              Vandaag
            </button>
          </div>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Add Event Button */}
        <button
          onClick={() => handleAddEvent()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-medium shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuw Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center font-semibold text-neutral-400 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate && day.date.getTime() === selectedDate.getTime();
                const hasEvents = day.events.length > 0;
                const occupancyPercentage = day.totalCapacity > 0 
                  ? (day.totalBooked / day.totalCapacity) * 100 
                  : 0;

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    disabled={!day.isCurrentMonth && !hasEvents}
                    className={cn(
                      'relative min-h-[80px] p-2 rounded-lg border-2 transition-all text-left',
                      'hover:border-gold-400 hover:scale-105',
                      isSelected && 'border-gold-500 bg-gold-500/10 shadow-lg',
                      !isSelected && hasEvents && 'border-neutral-700 bg-neutral-800/50',
                      !isSelected && !hasEvents && 'border-neutral-800 bg-neutral-900/30',
                      !day.isCurrentMonth && 'opacity-40',
                      day.isToday && !isSelected && 'border-blue-500 bg-blue-500/10',
                      day.isPast && !hasEvents && 'opacity-30'
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        'text-sm font-bold',
                        day.isToday && 'text-blue-400',
                        isSelected && 'text-gold-400',
                        !isSelected && !day.isToday && day.isCurrentMonth && 'text-white',
                        !day.isCurrentMonth && 'text-neutral-600'
                      )}>
                        {day.date.getDate()}
                      </span>
                      {hasEvents && (
                        <span className="text-xs text-neutral-400">
                          {day.events.length}
                        </span>
                      )}
                    </div>

                    {/* Event Indicators */}
                    {hasEvents && (
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map((event, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'w-full h-1.5 rounded-full',
                              !event.isActive && 'opacity-30'
                            )}
                            style={getEventBgStyle(event.type)}
                          />
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-[10px] text-neutral-400 text-center">
                            +{day.events.length - 2}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Occupancy Indicator */}
                    {hasEvents && day.totalCapacity > 0 && (
                      <div className="absolute bottom-1 right-1">
                        <div className={cn(
                          'text-[10px] font-bold',
                          occupancyPercentage >= 100 && 'text-red-400',
                          occupancyPercentage >= 80 && occupancyPercentage < 100 && 'text-orange-400',
                          occupancyPercentage < 80 && 'text-green-400'
                        )}>
                          {Math.round(occupancyPercentage)}%
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold-500" />
                <span className="text-neutral-400">Regulier</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-neutral-400">Matinee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-neutral-400">Zorghelden</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-neutral-400">School</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800 sticky top-6">
            {selectedDay ? (
              <>
                {/* Date Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedDay.date.toLocaleDateString('nl-NL', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                  {selectedDay.isToday && (
                    <span className="text-sm text-blue-400 font-medium">Vandaag</span>
                  )}
                </div>

                {/* Quick Stats */}
                {selectedDay.events.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">
                        {selectedDay.events.length}
                      </div>
                      <div className="text-xs text-neutral-400">Event(s)</div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-3">
                      <div className={cn(
                        'text-2xl font-bold',
                        getOccupancyColor(selectedDay.totalBooked, selectedDay.totalCapacity)
                      )}>
                        {selectedDay.totalCapacity > 0 
                          ? Math.round((selectedDay.totalBooked / selectedDay.totalCapacity) * 100)
                          : 0}%
                      </div>
                      <div className="text-xs text-neutral-400">Bezetting</div>
                    </div>
                  </div>
                )}

                {/* Search & Filters */}
                {selectedDay.events.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Zoek event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showActiveOnly}
                          onChange={(e) => setShowActiveOnly(e.target.checked)}
                          className="rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                        />
                        Alleen actieve
                      </label>
                    </div>
                  </div>
                )}

                {/* Events List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredDayEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 text-sm mb-4">
                        Geen events op deze datum
                      </p>
                      <button
                        onClick={() => handleAddEvent(selectedDay.date)}
                        className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Event Toevoegen
                      </button>
                    </div>
                  ) : (
                    filteredDayEvents.map((event) => {
                      const show = shows.find(s => s.id === event.showId);
                      const booked = (event.capacity || 0) - (event.remainingCapacity || 0);
                      const occupancy = event.capacity > 0 ? (booked / event.capacity) * 100 : 0;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            event.isActive 
                              ? 'bg-neutral-800/50 border-neutral-700 hover:border-gold-500' 
                              : 'bg-neutral-900/30 border-neutral-800 opacity-60'
                          )}
                        >
                          {/* Event Type & Status */}
                          <div className="flex items-center justify-between mb-2">
                            <span 
                              className="text-xs font-bold uppercase tracking-wide"
                              style={getEventTextStyle(event.type)}
                            >
                              {getEventTypeName(event.type, eventTypesConfig || undefined)}
                            </span>
                            <button
                              onClick={() => handleToggleActive(event)}
                              className={cn(
                                'p-1 rounded transition-colors',
                                event.isActive 
                                  ? 'text-green-400 hover:text-green-300' 
                                  : 'text-neutral-500 hover:text-neutral-400'
                              )}
                            >
                              {event.isActive ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          {/* Show Title */}
                          <h4 className="font-semibold text-white mb-2 text-sm">
                            {show?.name || 'Onbekende Show'}
                          </h4>

                          {/* Time */}
                          <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{event.startsAt} - {event.endsAt}</span>
                          </div>

                          {/* Capacity */}
                          <div className="flex items-center gap-2 text-xs mb-3">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            <span className={getOccupancyColor(booked, event.capacity)}>
                              {booked} / {event.capacity}
                            </span>
                            <span className="text-neutral-500">
                              ({Math.round(occupancy)}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-neutral-700 rounded-full h-2 mb-3">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                occupancy >= 100 && 'bg-red-500',
                                occupancy >= 80 && occupancy < 100 && 'bg-orange-500',
                                occupancy < 80 && 'bg-green-500'
                              )}
                              style={{ width: `${Math.min(occupancy, 100)}%` }}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Verwijderen
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400">
                  Selecteer een datum om events te bekijken
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800">
            {/* Modal Header */}
            <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingEvent ? 'Event Bewerken' : 'Nieuw Event Toevoegen'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date instanceof Date 
                      ? formData.date.toISOString().split('T')[0]
                      : formData.date
                    }
                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="REGULAR">Reguliere Voorstelling</option>
                    <option value="MATINEE">Matinee</option>
                    <option value="CARE_HEROES">Zorghelden Special</option>
                    <option value="SCHOOL">School Voorstelling</option>
                    <option value="PRIVATE">Privé Event</option>
                  </select>
                </div>
              </div>

              {/* Show Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Show *
                </label>
                <select
                  required
                  value={formData.showId}
                  onChange={(e) => setFormData({ ...formData, showId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                >
                  {shows.map(show => (
                    <option key={show.id} value={show.id}>
                      {show.name} {!show.isActive && '(Inactief)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Doors Open */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Deuren Open
                  </label>
                  <input
                    type="time"
                    value={formData.doorsOpen}
                    onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Start *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Einde *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Capaciteit *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => {
                    const capacity = parseInt(e.target.value);
                    setFormData({ 
                      ...formData, 
                      capacity,
                      remainingCapacity: capacity
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Notities
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-gold-500 resize-none"
                  placeholder="Optionele notities over dit event..."
                />
              </div>

              {/* Info: Pricing wordt centraal beheerd */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-300 mb-1">Prijzen worden centraal beheerd</h4>
                    <p className="text-xs text-blue-200">
                      De prijzen voor dit event worden automatisch bepaald op basis van het event type en de prijzen die je instelt in <strong>Producten en Prijzen → Prijzen</strong> tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-4 bg-neutral-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer">
                  Event is actief en beschikbaar voor boekingen
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-lg font-medium shadow-lg transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingEvent ? 'Wijzigingen Opslaan' : 'Event Aanmaken'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
