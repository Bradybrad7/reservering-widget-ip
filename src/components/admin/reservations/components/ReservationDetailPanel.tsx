/**
 * ReservationDetailPanel - Comprehensive Slide-over Panel
 */

import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Users, Package, Euro, Clock, Edit, CheckCircle2, XCircle, Send, Download } from 'lucide-react';
import { cn } from '../../../../utils';
import type { Reservation, Event } from '../../../../types';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ReservationDetailPanelProps {
  reservation: Reservation;
  event?: Event;
  onClose: () => void;
  onEdit: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onResendEmail?: () => void;
  onCheckIn?: () => void;
}

export const ReservationDetailPanel: React.FC<ReservationDetailPanelProps> = ({
  reservation,
  event,
  onClose,
  onEdit,
  onConfirm,
  onReject,
  onResendEmail,
  onCheckIn
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {reservation.companyName}
            </h2>
            <p className="text-sm text-slate-400">
              Reservering #{reservation.id?.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {onConfirm && reservation.status === 'pending' && (
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Bevestigen
            </button>
          )}
          
          {onCheckIn && reservation.status === 'confirmed' && (
            <button
              onClick={onCheckIn}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Check-in
            </button>
          )}

          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
          >
            <Edit className="w-4 h-4" />
            Bewerken
          </button>

          {onResendEmail && (
            <button
              onClick={onResendEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              Resend Email
            </button>
          )}

          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Afwijzen
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
            Contact Informatie
          </h3>
          
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <a href={`mailto:${reservation.email}`} className="text-blue-400 hover:text-blue-300">
              {reservation.email}
            </a>
          </div>

          {reservation.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <a href={`tel:${reservation.phone}`} className="text-blue-400 hover:text-blue-300">
                {reservation.phone}
              </a>
            </div>
          )}

          {reservation.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300">{reservation.address}</span>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
            Boeking Details
          </h3>

          {event && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-white">
                {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'EEEE d MMMM yyyy - HH:mm', { locale: nl })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-white">
              {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-white">
              Arrangement: {reservation.arrangement}
            </span>
          </div>

          {reservation.preDrink?.enabled && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">🍷</span>
              <span className="text-white">Borrel vooraf</span>
            </div>
          )}

          {reservation.afterParty?.enabled && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">🎉</span>
              <span className="text-white">Nafeest</span>
            </div>
          )}
        </div>

        {/* Merchandise */}
        {reservation.merchandise && reservation.merchandise.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
              🛍️ Merchandise
            </h3>
            <div className="space-y-2">
              {reservation.merchandise.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-white font-medium">{item.quantity}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {((reservation as any).dietaryNeeds || (reservation as any).celebrations) && (
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
              Speciale Verzoeken
            </h3>

            {(reservation as any).dietaryNeeds && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Dieetwensen</p>
                <p className="text-sm text-white">{(reservation as any).dietaryNeeds}</p>
              </div>
            )}

            {(reservation as any).celebrations && (reservation as any).celebrations.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Vieringen</p>
                <div className="flex flex-wrap gap-2">
                  {(reservation as any).celebrations.map((celebration: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                    >
                      {celebration}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {reservation.notes && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-2">
              📝 Notities
            </h3>
            <p className="text-sm text-slate-300">{reservation.notes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">
            ⏱️ Tijdlijn
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white">Reservering aangemaakt</p>
                <p className="text-xs text-slate-400">
                  {format(reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}
                </p>
              </div>
            </div>

            {reservation.status === 'confirmed' && reservation.updatedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-white">Bevestigd</p>
                  <p className="text-xs text-slate-400">
                    {format(reservation.updatedAt instanceof Date ? reservation.updatedAt : parseISO(reservation.updatedAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


