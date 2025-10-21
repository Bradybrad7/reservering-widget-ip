import React from 'react';
import { useAdminStore } from '../../store/adminStore';
import { addDays, format, isSameDay } from 'date-fns';

export const QuickActions: React.FC = () => {
  const { reservations, events } = useAdminStore();
  
  // Simple navigation handler (adjust based on your routing setup)
  const handleNavigate = (path: string) => {
    console.log('Navigate to:', path);
    // TODO: Implement navigation based on your router
    // For now, just log the path
  };

  // Calculate pending reservations
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;

  // Calculate upcoming events (tomorrow)
  const tomorrow = addDays(new Date(), 1);
  const upcomingEvents = events.filter(e => isSameDay(e.date, tomorrow));

  // Calculate reservations needing attention (request status)
  const requestReservations = reservations.filter(r => r.status === 'request').length;

  // Calculate events this week
  const endOfWeek = addDays(new Date(), 7);
  const eventsThisWeek = events.filter(e => 
    e.date >= new Date() && e.date <= endOfWeek
  ).length;

  return (
    <div className="bg-neutral-800/50 rounded-lg border border-gold-200 p-6">
      <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
        <span className="text-xl">⚡</span>
        Snelle Acties
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Confirm Reservations */}
        <button
          onClick={() => handleNavigate('/admin/reservations?filter=pending')}
          className="p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg text-left transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">✅</div>
            {pendingReservations > 0 && (
              <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingReservations}
              </span>
            )}
          </div>
          <div className="font-semibold text-dark-900 mb-1 group-hover:text-green-700 transition-colors">
            Bevestig Reserveringen
          </div>
          <div className="text-sm text-neutral-300">
            {pendingReservations === 0 
              ? 'Alles bevestigd!' 
              : `${pendingReservations} ${pendingReservations === 1 ? 'wacht' : 'wachten'} op goedkeuring`
            }
          </div>
        </button>

        {/* Send Reminders */}
        <button
          onClick={() => {
            if (upcomingEvents.length > 0) {
              // Navigate to events page with tomorrow's date
              handleNavigate(`/admin/events?date=${format(tomorrow, 'yyyy-MM-dd')}`);
            }
          }}
          disabled={upcomingEvents.length === 0}
          className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg text-left transition-all hover:shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📧</div>
            {upcomingEvents.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {upcomingEvents.length}
              </span>
            )}
          </div>
          <div className="font-semibold text-dark-900 mb-1 group-hover:text-blue-700 transition-colors">
            Verstuur Herinneringen
          </div>
          <div className="text-sm text-neutral-300">
            {upcomingEvents.length === 0 
              ? 'Geen events morgen' 
              : `${upcomingEvents.length} ${upcomingEvents.length === 1 ? 'event' : 'events'} morgen`
            }
          </div>
        </button>

        {/* Handle Requests */}
        <button
          onClick={() => handleNavigate('/admin/reservations?filter=request')}
          className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg text-left transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📋</div>
            {requestReservations > 0 && (
              <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {requestReservations}
              </span>
            )}
          </div>
          <div className="font-semibold text-dark-900 mb-1 group-hover:text-orange-700 transition-colors">
            Behandel Aanvragen
          </div>
          <div className="text-sm text-neutral-300">
            {requestReservations === 0 
              ? 'Geen openstaande aanvragen' 
              : `${requestReservations} ${requestReservations === 1 ? 'aanvraag' : 'aanvragen'} te behandelen`
            }
          </div>
        </button>

        {/* View This Week */}
        <button
          onClick={() => handleNavigate('/admin/events?view=week')}
          className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg text-left transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📅</div>
            {eventsThisWeek > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {eventsThisWeek}
              </span>
            )}
          </div>
          <div className="font-semibold text-dark-900 mb-1 group-hover:text-purple-700 transition-colors">
            Deze Week
          </div>
          <div className="text-sm text-neutral-300">
            {eventsThisWeek === 0 
              ? 'Geen events deze week' 
              : `${eventsThisWeek} ${eventsThisWeek === 1 ? 'event' : 'events'} gepland`
            }
          </div>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="mt-4 pt-4 border-t border-gold-500/10 flex flex-wrap gap-2">
        <button
          onClick={() => handleNavigate('/admin/events/new')}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Nieuw Event
        </button>
        
        <button
          onClick={() => handleNavigate('/admin/analytics')}
          className="px-4 py-2 bg-gray-100 hover:bg-dark-700 text-neutral-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Rapporten
        </button>
        
        <button
          onClick={() => handleNavigate('/admin/data')}
          className="px-4 py-2 bg-gray-100 hover:bg-dark-700 text-neutral-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>💾</span>
          Exporteren
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
