// WaitlistManager Component - Admin sectie voor wachtlijstbeheer
import React, { useEffect } from 'react';
import { Users, Mail, Phone, Calendar, Clock, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useEventsStore } from '../../store/eventsStore';
import type { WaitlistEntry } from '../../types';
import Button from '../ui/Button';

export const WaitlistManager: React.FC = () => {
  const {
    isLoading,
    filters,
    loadWaitlistEntries,
    getFilteredEntries,
    setEventFilter,
    setStatusFilter,
    setSearchTerm,
    markAsContacted,
    markAsCancelled,
    deleteWaitlistEntry
  } = useWaitlistStore();

  const { events, loadEvents } = useEventsStore();

  useEffect(() => {
    console.log('🔍 WaitlistManager: Loading waitlist entries...');
    loadWaitlistEntries();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEntries = getFilteredEntries();
  
  console.log('📊 WaitlistManager: Filtered entries count:', filteredEntries.length);
  console.log('📋 WaitlistManager: All entries:', filteredEntries);

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return 'Onbekend evenement';
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(event.date);
  };

  const handleMarkContacted = async (entryId: string) => {
    const success = await markAsContacted(entryId, 'Admin');
    if (success) {
      await loadWaitlistEntries();
    }
  };

  const handleCancel = async (entryId: string) => {
    if (confirm('Weet u zeker dat u deze wachtlijst inschrijving wilt annuleren?')) {
      const success = await markAsCancelled(entryId);
      if (success) {
        await loadWaitlistEntries();
      }
    }
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('Weet u zeker dat u deze wachtlijst inschrijving permanent wilt verwijderen?')) {
      const success = await deleteWaitlistEntry(entryId);
      if (success) {
        await loadWaitlistEntries();
      }
    }
  };

  const getStatusBadge = (status: WaitlistEntry['status']) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      contacted: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      converted: 'bg-green-500/20 text-green-300 border-green-400/30',
      expired: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-400/30'
    };

    const labels = {
      pending: 'Wachtend',
      contacted: 'Gecontacteerd',
      converted: 'Geboekt',
      expired: 'Verlopen',
      cancelled: 'Geannuleerd'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-100">Wachtlijst Beheer</h2>
          <p className="text-dark-200 mt-1">
            Beheer inschrijvingen voor de wachtlijst
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gold-400">{filteredEntries.length}</div>
            <div className="text-sm text-dark-300">Inschrijvingen</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Evenement
            </label>
            <select
              value={filters.eventId}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Alle evenementen</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(event.date)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 focus:outline-none focus:border-gold-400"
            >
              <option value="all">Alle statussen</option>
              <option value="pending">Wachtend</option>
              <option value="contacted">Gecontacteerd</option>
              <option value="converted">Geboekt</option>
              <option value="expired">Verlopen</option>
              <option value="cancelled">Geannuleerd</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Zoeken
            </label>
            <input
              type="text"
              placeholder="Naam, email of telefoon..."
              value={filters.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400"
            />
          </div>
        </div>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="card-theatre rounded-2xl border border-gold-400/20 p-12 text-center">
          <div className="text-dark-300">Laden...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="card-theatre rounded-2xl border border-gold-400/20 p-12 text-center">
          <Users className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-300">Geen wachtlijst inschrijvingen gevonden</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="card-theatre rounded-2xl border border-gold-400/20 p-6 hover:border-gold-400/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Entry Info */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-400/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-100 text-lg">{entry.customerName}</h3>
                      <div className="flex items-center gap-2 text-sm text-dark-300">
                        <Calendar className="w-4 h-4" />
                        {getEventName(entry.eventId)}
                      </div>
                    </div>
                    {getStatusBadge(entry.status)}
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-dark-200">
                      <Mail className="w-4 h-4 text-dark-400" />
                      <a href={`mailto:${entry.customerEmail}`} className="hover:text-gold-400">
                        {entry.customerEmail}
                      </a>
                    </div>
                    {entry.customerPhone && (
                      <div className="flex items-center gap-2 text-sm text-dark-200">
                        <Phone className="w-4 h-4 text-dark-400" />
                        <a href={`tel:${entry.customerPhone}`} className="hover:text-gold-400">
                          {entry.customerPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-dark-200">
                      <Users className="w-4 h-4 text-dark-400" />
                      <span>{entry.numberOfPersons} {entry.numberOfPersons === 1 ? 'persoon' : 'personen'}</span>
                    </div>
                    <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-medium">
                      📋 Wachtlijst
                    </div>
                    <div className="flex items-center gap-2 text-dark-300">
                      <Clock className="w-4 h-4" />
                      {new Intl.DateTimeFormat('nl-NL', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }).format(entry.createdAt)}
                    </div>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div className="p-3 bg-neutral-800/50 rounded-xl border border-dark-700">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-dark-400 mt-0.5" />
                        <p className="text-sm text-dark-200">{entry.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Contacted Info */}
                  {entry.contactedAt && entry.contactedBy && (
                    <div className="text-xs text-dark-300">
                      Gecontacteerd op {new Intl.DateTimeFormat('nl-NL', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }).format(entry.contactedAt)} door {entry.contactedBy}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {entry.status === 'pending' && (
                    <Button
                      onClick={() => handleMarkContacted(entry.id)}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Markeer Gecontacteerd
                    </Button>
                  )}
                  {(entry.status === 'pending' || entry.status === 'contacted') && (
                    <Button
                      onClick={() => handleCancel(entry.id)}
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuleren
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(entry.id)}
                    variant="danger"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaitlistManager;
