/**
 * 📋 Reservation Details Modal - Lightweight View-Only Modal
 * 
 * Quick view modal for reservation details without editing capabilities
 * Perfect for analytics, check-in, and reporting views
 */

import { X, User, Mail, Phone, Calendar, Users, Package, Euro, Hash, MapPin, CakeSlice, FileText } from 'lucide-react';
import type { Reservation, Event } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ReservationDetailsModalProps {
  reservation: Reservation;
  event?: Event;
  onClose: () => void;
  onStatusChange?: (reservationId: string, newStatus: Reservation['status']) => Promise<void>;
}

export const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  reservation,
  event,
  onClose,
  onStatusChange
}) => {
  const getStatusBadge = (status: Reservation['status']) => {
    const badges = {
      confirmed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500', label: '✓ Bevestigd' },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500', label: '⏰ Pending' },
      option: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500', label: '📋 Optie' },
      'checked-in': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500', label: '✓ Ingecheckt' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500', label: '✕ Geannuleerd' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500', label: '✕ Afgewezen' },
      waitlist: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500', label: '📝 Wachtlijst' },
      request: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500', label: '📨 Aanvraag' }
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span className={cn('px-3 py-1 rounded-lg text-sm font-bold border-2', badge.bg, badge.text, badge.border)}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Reservering Details</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {reservation.companyName || reservation.contactPerson}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & ID */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Reserveringsnummer</div>
              <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">{reservation.id}</div>
            </div>
            {getStatusBadge(reservation.status)}
          </div>

          {/* Event Info */}
          {event && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-blue-900 dark:text-blue-100">Event</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Type:</span>
                  <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">{event.type}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Datum:</span>
                  <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">{formatDate(event.date)}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Tijd:</span>
                  <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">{event.startsAt} - {event.endsAt}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Deuren Open:</span>
                  <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">{event.doorsOpen}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-black text-slate-900 dark:text-white">Contactgegevens</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-900 dark:text-white font-semibold">{reservation.contactPerson}</span>
              </div>
              {reservation.companyName && (
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700 dark:text-slate-300">{reservation.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <a href={`mailto:${reservation.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {reservation.email}
                </a>
              </div>
              {reservation.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <a href={`tel:${reservation.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {reservation.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="font-black text-slate-900 dark:text-white">Aantal Gasten</h3>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{reservation.numberOfPersons}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-black text-green-900 dark:text-green-100">Totaal Prijs</h3>
              </div>
              <p className="text-3xl font-black text-green-900 dark:text-green-100">{formatCurrency(reservation.totalPrice)}</p>
            </div>
          </div>

          {/* Arrangement & Add-ons */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-black text-slate-900 dark:text-white">Arrangement & Add-ons</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Arrangement:</span>
                <span className="font-bold text-slate-900 dark:text-white">{reservation.arrangement}</span>
              </div>
              {reservation.preDrink?.enabled && (
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                  <span>🍸 Pre-Drink:</span>
                  <span className="font-bold">Ja</span>
                </div>
              )}
              {reservation.afterParty?.enabled && (
                <div className="flex justify-between text-purple-700 dark:text-purple-300">
                  <span>🎉 After Party:</span>
                  <span className="font-bold">Ja</span>
                </div>
              )}
              {reservation.merchandise && reservation.merchandise.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">🎁 Merchandise:</div>
                  {reservation.merchandise.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300 ml-4">
                      <span>{item.itemId}</span>
                      <span>{item.quantity}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Celebration */}
          {(reservation.celebrationOccasion || reservation.partyPerson || reservation.celebrationDetails) && (
            <div className="bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CakeSlice className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <h3 className="font-black text-pink-900 dark:text-pink-100">Iets te Vieren</h3>
              </div>
              <div className="space-y-1 text-sm">
                {reservation.celebrationOccasion && (
                  <div className="flex gap-2">
                    <span className="text-pink-700 dark:text-pink-300">Gelegenheid:</span>
                    <span className="font-bold text-pink-900 dark:text-pink-100">{reservation.celebrationOccasion}</span>
                  </div>
                )}
                {reservation.partyPerson && (
                  <div className="flex gap-2">
                    <span className="text-pink-700 dark:text-pink-300">Voor:</span>
                    <span className="font-bold text-pink-900 dark:text-pink-100">{reservation.partyPerson}</span>
                  </div>
                )}
                {reservation.celebrationDetails && (
                  <p className="text-pink-800 dark:text-pink-200 mt-2">{reservation.celebrationDetails}</p>
                )}
              </div>
            </div>
          )}

          {/* Dietary Requirements */}
          {reservation.dietaryRequirements && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-black text-orange-900 dark:text-orange-100">Dieetwensen</h3>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">{typeof reservation.dietaryRequirements === 'string' ? reservation.dietaryRequirements : JSON.stringify(reservation.dietaryRequirements)}</p>
            </div>
          )}

          {/* Comments */}
          {reservation.comments && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="font-black text-slate-900 dark:text-white">Opmerkingen</h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{reservation.comments}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-bold">Aangemaakt:</span>
                <span className="ml-2">{format(reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</span>
              </div>
              <div>
                <span className="font-bold">Laatst Gewijzigd:</span>
                <span className="ml-2">{format(reservation.updatedAt instanceof Date ? reservation.updatedAt : parseISO(reservation.updatedAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</span>
              </div>
              {reservation.checkedInAt && (
                <div className="col-span-2 text-green-600 dark:text-green-400">
                  <span className="font-bold">✓ Ingecheckt:</span>
                  <span className="ml-2">{format(reservation.checkedInAt instanceof Date ? reservation.checkedInAt : parseISO(reservation.checkedInAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Change Actions */}
          {onStatusChange && reservation.status !== 'checked-in' && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Status Wijzigen</h3>
              <div className="flex flex-wrap gap-2">
                {reservation.status !== 'confirmed' && (
                  <button
                    onClick={() => onStatusChange(reservation.id, 'confirmed')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    ✓ Bevestigen
                  </button>
                )}
                {reservation.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(reservation.id, 'rejected')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    ✕ Afwijzen
                  </button>
                )}
                {reservation.status === 'confirmed' && (
                  <button
                    onClick={() => onStatusChange(reservation.id, 'checked-in')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    ✓ Check In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
