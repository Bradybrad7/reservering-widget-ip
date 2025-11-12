/**
 * 📋 VOORBEELD: useEventCapacity Hook Gebruik
 * 
 * Dit bestand toont hoe de useEventCapacity hook gebruikt kan worden
 * in verschillende scenario's binnen ReservationsManager en EventManager.
 */


import { useEventCapacity } from '../hooks/useEventCapacity';
import { formatDate } from '../utils';

// ============================================================
// VOORBEELD 1: Basis gebruik in een component
// ============================================================
export function EventCapacityDisplay({ eventId }: { eventId: string }) {
  const capacity = useEventCapacity(eventId);

  if (capacity.isLoading) {
    return <div className="text-text-muted">Capaciteit laden...</div>;
  }

  if (capacity.error) {
    return <div className="text-error-500">❌ {capacity.error}</div>;
  }

  return (
    <div className="space-y-2 p-4 bg-bg-surface rounded-lg border border-border-default">
      <h4 className="font-semibold text-text-primary">
        📊 Capaciteit - {capacity.event && formatDate(capacity.event.date)}
      </h4>
      
      {/* Basis info */}
      <div className="text-sm text-text-secondary">
        <p>Basis capaciteit: {capacity.baseCapacity} personen</p>
        {capacity.overrideActive && (
          <p className="text-warning-500">
            🔧 Override: {capacity.overrideCapacity} personen (ACTIEF)
          </p>
        )}
        <p>Effectieve capaciteit: <strong>{capacity.effectiveCapacity}</strong> personen</p>
      </div>

      {/* Bezetting */}
      <div className="pt-2 border-t border-border-subtle">
        <p className="text-sm font-medium text-text-primary mb-1">Huidige bezetting:</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-success-400">✅ Bevestigd:</span>
            <span className="text-text-primary font-medium">
              {capacity.bookedPersons} pers. ({capacity.confirmedCount} res.)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-warning-400">⏳ Pending:</span>
            <span className="text-text-primary font-medium">
              {capacity.pendingPersons} pers. ({capacity.pendingCount} res.)
            </span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-1">
            <span className="text-text-secondary">Totaal bezet:</span>
            <span className="text-text-primary font-bold">{capacity.totalBooked} personen</span>
          </div>
        </div>
      </div>

      {/* Beschikbaar */}
      <div className="pt-2 border-t border-border-subtle">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Beschikbaar:</span>
          <span className={cn(
            "font-bold text-lg",
            capacity.remainingCapacity > 10 ? "text-success-400" :
            capacity.remainingCapacity > 0 ? "text-warning-400" : "text-error-400"
          )}>
            {capacity.remainingCapacity} plaatsen
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-bg-input rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              capacity.isOverbooked ? "bg-error-500" :
              capacity.utilizationPercent > 90 ? "bg-warning-500" :
              "bg-success-500"
            )}
            style={{ width: `${Math.min(100, capacity.utilizationPercent)}%` }}
          />
        </div>
        <p className="text-xs text-text-muted text-center mt-1">
          {capacity.utilizationPercent}% bezet
        </p>
      </div>

      {/* Overboeking waarschuwing */}
      {capacity.isOverbooked && (
        <div className="p-3 bg-error-500/10 border border-error-500/30 rounded-lg">
          <p className="text-sm text-error-400 font-semibold">
            ⚠️ OVERBOOKED met {capacity.overbookedBy} personen!
          </p>
        </div>
      )}

      {/* Wachtlijst */}
      {capacity.waitlistPersons > 0 && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="flex justify-between text-sm">
            <span className="text-purple-400">📋 Wachtlijst:</span>
            <span className="text-text-primary font-medium">
              {capacity.waitlistPersons} pers. ({capacity.waitlistCount} entries)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VOORBEELD 2: Gebruik in ReservationsManager (confirm modal)
// ============================================================
export function ConfirmReservationWithCapacity({ 
  eventId, 
  reservationId,
  numberOfPersons 
}: { 
  eventId: string; 
  reservationId: string;
  numberOfPersons: number;
}) {
  // Gebruik excludeReservationId om huidige bezetting zonder deze reservering te zien
  const currentCapacity = useEventCapacity(eventId, { 
    excludeReservationId: reservationId 
  });
  
  // Simuleer wat er gebeurt NA bevestiging
  const newTotal = currentCapacity.totalBooked + numberOfPersons;
  const remainingAfter = currentCapacity.effectiveCapacity - newTotal;
  const willOverbook = newTotal > currentCapacity.effectiveCapacity;
  const overbookBy = Math.max(0, newTotal - currentCapacity.effectiveCapacity);

  return (
    <div className="space-y-4">
      {/* Huidige situatie */}
      <div className="p-4 bg-bg-surface rounded-lg border border-border-default">
        <h4 className="font-semibold text-text-primary mb-2">📍 Huidige Bezetting</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Bevestigd:</span>
            <span className="text-text-primary">{currentCapacity.bookedPersons} pers.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Pending:</span>
            <span className="text-text-primary">{currentCapacity.pendingPersons} pers.</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-1">
            <span className="text-text-secondary font-medium">Totaal:</span>
            <span className="text-text-primary font-bold">{currentCapacity.totalBooked} pers.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-success-400">Beschikbaar:</span>
            <span className="text-success-400 font-medium">{currentCapacity.remainingCapacity} plaatsen</span>
          </div>
        </div>
      </div>

      {/* Deze boeking */}
      <div className="flex items-center gap-3 text-primary-500">
        <span className="text-2xl">➕</span>
        <div>
          <p className="text-sm text-text-secondary">Deze boeking</p>
          <p className="font-bold">{numberOfPersons} personen</p>
        </div>
      </div>

      {/* Na bevestiging */}
      <div className={cn(
        "p-4 rounded-lg border",
        willOverbook 
          ? "bg-error-500/10 border-error-500/30" 
          : "bg-success-500/10 border-success-500/30"
      )}>
        <h4 className="font-semibold text-text-primary mb-2">📌 Na Bevestiging</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Totaal bezet:</span>
            <span className="text-text-primary font-bold">
              {newTotal} / {currentCapacity.effectiveCapacity} pers.
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Beschikbaar:</span>
            <span className={willOverbook ? "text-error-400 font-bold" : "text-success-400"}>
              {remainingAfter} plaatsen
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Bezetting:</span>
            <span className="text-text-primary font-medium">
              {Math.round((newTotal / currentCapacity.effectiveCapacity) * 100)}%
            </span>
          </div>
        </div>

        {willOverbook && (
          <div className="mt-3 pt-3 border-t border-error-500/30">
            <p className="text-error-400 font-bold text-sm">
              ⚠️ WAARSCHUWING: OVERBOEKING!
            </p>
            <p className="text-error-400 text-sm">
              Deze bevestiging overschrijdt de capaciteit met {overbookBy} personen!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VOORBEELD 3: Compact gebruik in EventManager tabel
// ============================================================
export function EventCapacityBadge({ eventId }: { eventId: string }) {
  const capacity = useEventCapacity(eventId);

  if (capacity.isLoading) {
    return <span className="text-xs text-text-muted">...</span>;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Bezetting badge */}
      <span className={cn(
        "px-2 py-1 rounded-full font-medium",
        capacity.isOverbooked 
          ? "bg-error-500/20 text-error-400 border border-error-500/30" :
        capacity.utilizationPercent > 90 
          ? "bg-warning-500/20 text-warning-400 border border-warning-500/30" :
        capacity.utilizationPercent > 70 
          ? "bg-info-500/20 text-info-400 border border-info-500/30" :
          "bg-success-500/20 text-success-400 border border-success-500/30"
      )}>
        {capacity.totalBooked} / {capacity.effectiveCapacity}
      </span>

      {/* Override indicator */}
      {capacity.overrideActive && (
        <span className="px-2 py-1 rounded-full bg-warning-500/20 text-warning-400 border border-warning-500/30">
          🔧 Override
        </span>
      )}

      {/* Wachtlijst indicator */}
      {capacity.waitlistPersons > 0 && (
        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
          📋 {capacity.waitlistCount}
        </span>
      )}
    </div>
  );
}

// ============================================================
// VOORBEELD 4: Gebruik met auto-refresh
// ============================================================
export function LiveEventCapacity({ eventId }: { eventId: string }) {
  // Refresh elke 30 seconden
  const capacity = useEventCapacity(eventId, {
    refreshInterval: 30000
  });

  return (
    <div className="relative">
      <EventCapacityDisplay eventId={eventId} />
      
      {/* Live indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-success-400">
        <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
        <span>Live</span>
      </div>
    </div>
  );
}

// ============================================================
// HELPER: cn functie (als nog niet beschikbaar)
// ============================================================
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
