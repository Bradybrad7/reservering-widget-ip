/**
 * ReservationDetailPanel - Detail panel voor een geselecteerde reservering
 * 
 * Toont alle details en biedt inline editing mogelijkheden
 */

import React, { useState, useRef, useEffect } from 'react';
import type { Reservation, AdminEvent, MerchandiseItem } from '../../types';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Package,
  MessageSquare,
  Edit,
  Save,
  X
} from 'lucide-react';
import { cn } from '../../utils';
import { useOperationsStore } from '../../store/operationsStore';
import { CrossTabQuickActions, createReservationQuickActions } from './CrossTabQuickActions';

interface ReservationDetailPanelProps {
  reservation: Reservation;
  event?: AdminEvent;
  merchandiseItems: MerchandiseItem[];
}

export const ReservationDetailPanel: React.FC<ReservationDetailPanelProps> = ({
  reservation,
  event,
  merchandiseItems,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { setEventContext, setCustomerContext } = useOperationsStore();

  // Auto-scroll naar top wanneer reservering verandert
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [reservation.id]);

  // Generate quick actions voor cross-tab navigation
  const quickActions = event ? createReservationQuickActions(
    event.id,
    reservation.email,
    setEventContext,
    setCustomerContext
  ) : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {reservation.firstName} {reservation.lastName}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {reservation.email}
              </p>
            </div>
            
            {/* Status badge */}
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border-2",
              reservation.status === 'confirmed' && "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600",
              reservation.status === 'pending' && "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600",
              reservation.status === 'cancelled' && "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600"
            )}>
              {reservation.status === 'checked-in' ? '✓ INGECHECKT' : reservation.status.toUpperCase()}
            </div>
          </div>
        
          {/* Compact Quick stats - 4 kolommen */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">GASTEN</div>
              <div className="text-lg font-black text-blue-900 dark:text-blue-100 mt-0.5">
                {reservation.numberOfPersons}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2.5 border border-purple-200 dark:border-purple-800">
              <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold">ARRANGEMENT</div>
              <div className="text-sm font-black text-purple-900 dark:text-purple-100 mt-0.5 uppercase">
                {reservation.arrangement}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">TOTAAL</div>
              <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
                €{(reservation.totalPrice || 0).toLocaleString('nl-NL')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">BETALING</div>
              <div className="text-sm font-black mt-0.5">
                {reservation.paymentStatus === 'paid' ? (
                  <span className="text-green-600 dark:text-green-400">✓ BETAALD</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">OPEN</span>
                )}
              </div>
            </div>
          </div>

          {/* Event Info */}
          {event && (
            <div className="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold">
                  {new Date(event.date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-slate-500 dark:text-slate-400">•</span>
                <span>{event.startsAt} - {event.endsAt}</span>
                <span className="text-slate-500 dark:text-slate-400">•</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{event.type}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Cross-Tab Quick Actions */}
          {quickActions.length > 0 && (
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">
                🚀 Snelle Navigatie
              </h4>
              <CrossTabQuickActions actions={quickActions} />
            </section>
          )}
          
          {/* Contact Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Contact Informatie
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">VOORNAAM</label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{reservation.firstName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">ACHTERNAAM</label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{reservation.lastName}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">EMAIL</label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{reservation.email}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">TELEFOON</label>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {reservation.phoneCountryCode} {reservation.phone}
                </p>
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Adres Gegevens
            </h4>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {reservation.address} {reservation.houseNumber}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {reservation.postalCode} {reservation.city}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {reservation.country}
              </p>
            </div>
          </section>

          {/* Comments */}
          {reservation.comments && (
            <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Opmerkingen
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {reservation.comments}
              </p>
            </section>
          )}

          {/* Placeholder voor meer details */}
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            <p>Meer details komen hier...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
