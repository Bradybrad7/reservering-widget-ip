import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { useEventCapacity } from '../../hooks/useEventCapacity';
import { formatDate, cn } from '../../utils';
import type { Reservation } from '../../types';

export type ConfirmationAction = 'confirm' | 'reject' | 'delete' | 'archive' | 'cancel';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  
  // Type actie
  action: ConfirmationAction;
  
  // Data
  reservation: Reservation;
  eventId: string;
  
  // UI customization
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  
  // Loading state
  isProcessing?: boolean;
}

/**
 * 🎯 ConfirmationModal Component
 * 
 * Een herbruikbare modal voor het bevestigen van admin-acties met real-time capaciteitsinformatie.
 * Toont visueel duidelijk de impact van de actie op de event capaciteit.
 * 
 * @example
 * ```tsx
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   action="confirm"
 *   reservation={selectedReservation}
 *   eventId={selectedReservation.eventId}
 * />
 * ```
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  reservation,
  eventId,
  title,
  message,
  confirmText,
  cancelText = 'Annuleren',
  isProcessing = false
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  // Haal capaciteit op (exclude deze reservering voor accurate "na actie" berekening)
  const capacity = useEventCapacity(
    eventId,
    { excludeReservationId: action === 'confirm' ? reservation.id : undefined }
  );

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  // Bereken impact van actie
  const getActionImpact = () => {
    const persons = reservation.numberOfPersons;

    switch (action) {
      case 'confirm': {
        const newTotal = capacity.totalBooked + persons;
        const remainingAfter = capacity.effectiveCapacity - newTotal;
        const willOverbook = newTotal > capacity.effectiveCapacity;
        const overbookBy = Math.max(0, newTotal - capacity.effectiveCapacity);

        return {
          type: 'confirm' as const,
          newTotal,
          remainingAfter,
          willOverbook,
          overbookBy,
          utilizationPercent: Math.round((newTotal / capacity.effectiveCapacity) * 100)
        };
      }

      case 'reject':
      case 'cancel':
      case 'delete': {
        // Deze acties geven capaciteit vrij (als de reservering confirmed/pending was)
        const freesCapacity = ['confirmed', 'pending'].includes(reservation.status);
        const newTotal = freesCapacity ? capacity.totalBooked : capacity.totalBooked;
        const remainingAfter = freesCapacity 
          ? capacity.remainingCapacity + persons 
          : capacity.remainingCapacity;

        return {
          type: 'free' as const,
          newTotal,
          remainingAfter,
          freesCapacity,
          freedPersons: freesCapacity ? persons : 0
        };
      }

      default:
        return null;
    }
  };

  const impact = getActionImpact();

  // Bepaal UI styling op basis van actie
  const getActionConfig = () => {
    switch (action) {
      case 'confirm':
        return {
          title: title || '✅ Reservering Bevestigen',
          icon: CheckCircle,
          iconColor: 'text-success-400',
          confirmButton: confirmText || 'Bevestigen',
          confirmButtonClass: impact?.willOverbook
            ? 'bg-warning-600 hover:bg-warning-700 text-white'
            : 'bg-success-600 hover:bg-success-700 text-white'
        };

      case 'reject':
        return {
          title: title || '❌ Reservering Afwijzen',
          icon: X,
          iconColor: 'text-error-400',
          confirmButton: confirmText || 'Afwijzen',
          confirmButtonClass: 'bg-error-600 hover:bg-error-700 text-white'
        };

      case 'cancel':
        return {
          title: title || '🚫 Reservering Annuleren',
          icon: AlertTriangle,
          iconColor: 'text-warning-400',
          confirmButton: confirmText || 'Annuleren',
          confirmButtonClass: 'bg-warning-600 hover:bg-warning-700 text-white'
        };

      case 'delete':
        return {
          title: title || '🗑️ Reservering Verwijderen',
          icon: AlertTriangle,
          iconColor: 'text-error-400',
          confirmButton: confirmText || 'Permanent Verwijderen',
          confirmButtonClass: 'bg-error-600 hover:bg-error-700 text-white'
        };

      default:
        return {
          title: title || 'Bevestigen',
          icon: AlertTriangle,
          iconColor: 'text-warning-400',
          confirmButton: confirmText || 'Bevestigen',
          confirmButtonClass: 'bg-primary-600 hover:bg-primary-700 text-white'
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-overlay-modal backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-2xl',
          'bg-bg-modal border border-border-default rounded-2xl shadow-lifted',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <Icon className={cn('w-6 h-6', config.iconColor)} />
            <h2 className="text-xl font-bold text-text-primary">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Custom message */}
          {message && (
            <p className="text-text-secondary">{message}</p>
          )}

          {/* Reservering details */}
          <div className="p-4 bg-bg-surface rounded-lg border border-border-default">
            <h3 className="font-semibold text-text-primary mb-3">📋 Reservering Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-muted">Bedrijf:</span>
                <p className="text-text-primary font-medium">{reservation.companyName}</p>
              </div>
              <div>
                <span className="text-text-muted">Contactpersoon:</span>
                <p className="text-text-primary font-medium">{reservation.contactPerson}</p>
              </div>
              <div>
                <span className="text-text-muted">Email:</span>
                <p className="text-text-primary font-medium">{reservation.email}</p>
              </div>
              <div>
                <span className="text-text-muted">Aantal personen:</span>
                <p className="text-text-primary font-medium flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {reservation.numberOfPersons}
                </p>
              </div>
            </div>
          </div>

          {/* Capaciteit info (alleen bij confirm/reject/cancel) */}
          {capacity.event && impact && (
            <div className="space-y-4">
              {/* Event info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Event datum:</span>
                <span className="text-text-primary font-medium">
                  {formatDate(capacity.event.date)}
                </span>
              </div>

              {/* Huidige bezetting */}
              <div className="p-4 bg-bg-surface rounded-lg border border-border-default">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  📍 Huidige Bezetting
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Bevestigd:</span>
                    <span className="text-success-400 font-medium">
                      {capacity.bookedPersons} pers. ({capacity.confirmedCount} res.)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Pending:</span>
                    <span className="text-warning-400 font-medium">
                      {capacity.pendingPersons} pers. ({capacity.pendingCount} res.)
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2 mt-2">
                    <span className="text-text-secondary font-medium">Totaal bezet:</span>
                    <span className="text-text-primary font-bold">{capacity.totalBooked} personen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-success-400">Beschikbaar:</span>
                    <span className="text-success-400 font-medium">{capacity.remainingCapacity} plaatsen</span>
                  </div>
                </div>

                {/* Capacity override indicator */}
                {capacity.overrideActive && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-xs text-warning-400 flex items-center gap-1">
                      🔧 <span>Capacity override actief: {capacity.overrideCapacity} personen</span>
                    </p>
                  </div>
                )}

                {/* Progress bar - huidige situatie */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Bezetting</span>
                    <span>{capacity.utilizationPercent}%</span>
                  </div>
                  <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        capacity.isOverbooked ? 'bg-error-500' :
                        capacity.utilizationPercent > 90 ? 'bg-warning-500' :
                        'bg-success-500'
                      )}
                      style={{ width: `${Math.min(100, capacity.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actie impact indicator */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-500 text-lg font-bold">
                    {action === 'confirm' ? '➕' : '➖'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-muted">
                    {action === 'confirm' ? 'Deze boeking toevoegen' : 'Deze boeking vrijgeven'}
                  </p>
                  <p className="font-bold text-text-primary">{reservation.numberOfPersons} personen</p>
                </div>
              </div>

              {/* Na actie */}
              {'type' in impact && impact.type === 'confirm' && (
                <div className={cn(
                  'p-4 rounded-lg border',
                  impact.willOverbook 
                    ? 'bg-error-500/10 border-error-500/30' 
                    : 'bg-success-500/10 border-success-500/30'
                )}>
                  <h4 className="font-semibold text-text-primary mb-3">📌 Na Bevestiging</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Totaal bezet:</span>
                      <span className="text-text-primary font-bold">
                        {impact.newTotal} / {capacity.effectiveCapacity} pers.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Beschikbaar:</span>
                      <span className={cn(
                        'font-bold',
                        impact.willOverbook ? 'text-error-400' : 'text-success-400'
                      )}>
                        {impact.remainingAfter} plaatsen
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Bezetting:</span>
                      <span className="text-text-primary font-medium">{impact.utilizationPercent}%</span>
                    </div>

                    {/* Progress bar - na actie */}
                    <div className="mt-3">
                      <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            impact.willOverbook ? 'bg-error-500' :
                            impact.utilizationPercent > 90 ? 'bg-warning-500' :
                            'bg-success-500'
                          )}
                          style={{ width: `${Math.min(100, impact.utilizationPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Overboeking waarschuwing */}
                  {impact.willOverbook && (
                    <div className="mt-4 pt-4 border-t border-error-500/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-error-400 font-bold text-sm">
                            ⚠️ WAARSCHUWING: OVERBOEKING!
                          </p>
                          <p className="text-error-400 text-sm mt-1">
                            Deze bevestiging overschrijdt de capaciteit met <strong>{impact.overbookBy} personen</strong>!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Capaciteit vrijgeven (reject/cancel) */}
              {'type' in impact && impact.type === 'free' && impact.freesCapacity && (
                <div className="p-4 bg-success-500/10 border border-success-500/30 rounded-lg">
                  <h4 className="font-semibold text-text-primary mb-2">✅ Capaciteit Vrijgegeven</h4>
                  <p className="text-sm text-text-secondary">
                    Na deze actie komen er <strong className="text-success-400">{impact.freedPersons} plaatsen</strong> vrij.
                  </p>
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Nieuwe bezetting:</span>
                      <span className="text-text-primary font-medium">
                        {impact.newTotal} / {capacity.effectiveCapacity} pers.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-400">Beschikbaar:</span>
                      <span className="text-success-400 font-bold">{impact.remainingAfter} plaatsen</span>
                    </div>
                  </div>
                  
                  {capacity.waitlistCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-success-500/30">
                      <p className="text-xs text-purple-400">
                        💡 Er staan {capacity.waitlistCount} entries op de wachtlijst ({capacity.waitlistPersons} pers.)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Extra waarschuwing voor destructieve acties */}
          {action === 'delete' && (
            <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-error-400 font-bold text-sm">
                    ⚠️ Dit kan niet ongedaan worden gemaakt!
                  </p>
                  <p className="text-error-400 text-sm mt-1">
                    De reservering wordt permanent verwijderd uit het systeem.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-subtle">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-colors',
              'bg-bg-surface border border-border-default',
              'text-text-secondary hover:text-text-primary hover:border-border-strong',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || capacity.isLoading}
            className={cn(
              'px-6 py-2.5 rounded-lg font-medium transition-all',
              config.confirmButtonClass,
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-subtle hover:shadow-strong',
              isProcessing && 'animate-pulse'
            )}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verwerken...
              </span>
            ) : (
              config.confirmButton
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
