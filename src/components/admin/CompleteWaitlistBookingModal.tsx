/**
 * 🎫 COMPLETE WAITLIST BOOKING MODAL
 * 
 * Modal voor het converteren van wachtlijst naar volledige boeking
 * - Arrangement selectie
 * - Prijs berekening
 * - Notities toevoegen
 * - Status instellen
 */

import { useState, useEffect } from 'react';
import {
  X,
  Users,
  DollarSign,
  Package,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { WaitlistEntry, AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';

interface CompleteWaitlistBookingModalProps {
  waitlistEntry: WaitlistEntry;
  event: AdminEvent;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (bookingData: any) => Promise<void>;
}

export const CompleteWaitlistBookingModal: React.FC<CompleteWaitlistBookingModalProps> = ({
  waitlistEntry,
  event,
  isOpen,
  onClose,
  onComplete
}) => {
  const { eventTypesConfig } = useConfigStore();
  
  const [formData, setFormData] = useState({
    arrangement: '',
    pricePerPerson: 0,
    totalPrice: 0,
    notes: waitlistEntry.notes || '',
    status: 'confirmed' as 'confirmed' | 'pending'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available arrangements from event type config
  const eventTypeConfig = eventTypesConfig?.types?.find(t => t.key === event.type);
  const arrangements = eventTypeConfig?.pricing ? [
    { name: 'Standard', price: eventTypeConfig.pricing.Standard },
    { name: 'Premium', price: eventTypeConfig.pricing.Premium },
    { name: 'standaard', price: eventTypeConfig.pricing.standaard },
    { name: 'premium', price: eventTypeConfig.pricing.premium }
  ] : [];

  // Initialize with first arrangement
  useEffect(() => {
    if (arrangements.length > 0 && !formData.arrangement) {
      const firstArrangement = arrangements[0];
      setFormData(prev => ({
        ...prev,
        arrangement: firstArrangement.name,
        pricePerPerson: firstArrangement.price,
        totalPrice: firstArrangement.price * waitlistEntry.numberOfPersons
      }));
    }
  }, [arrangements, waitlistEntry.numberOfPersons]);

  // Update total price when arrangement changes
  const handleArrangementChange = (arrangementName: string) => {
    const selectedArrangement = arrangements.find(a => a.name === arrangementName);
    if (selectedArrangement) {
      const total = selectedArrangement.price * waitlistEntry.numberOfPersons;
      setFormData(prev => ({
        ...prev,
        arrangement: arrangementName,
        pricePerPerson: selectedArrangement.price,
        totalPrice: total
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.arrangement) {
      setError('Selecteer een arrangement');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        // From waitlist entry
        eventId: waitlistEntry.eventId,
        eventDate: waitlistEntry.eventDate,
        firstName: waitlistEntry.customerName.split(' ')[0] || waitlistEntry.customerName,
        lastName: waitlistEntry.customerName.split(' ').slice(1).join(' ') || '',
        email: waitlistEntry.customerEmail,
        phone: waitlistEntry.customerPhone || '',
        phoneCountryCode: waitlistEntry.phoneCountryCode || '+31',
        numberOfPersons: waitlistEntry.numberOfPersons,
        
        // New booking details
        arrangement: formData.arrangement,
        pricePerPerson: formData.pricePerPerson,
        totalPrice: formData.totalPrice,
        status: formData.status,
        notes: `Van wachtlijst (${format(new Date(waitlistEntry.createdAt), 'dd-MM-yyyy', { locale: nl })}). ${formData.notes}`.trim(),
        source: 'waitlist-conversion',
        
        // Link to waitlist entry
        waitlistEntryId: waitlistEntry.id
      };

      await onComplete(bookingData);
      onClose();
    } catch (err) {
      console.error('Error completing waitlist booking:', err);
      setError('Kon boeking niet aanmaken. Probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-green-500 to-emerald-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3 text-white mb-2">
            <CheckCircle className="w-8 h-8" />
            <h2 className="text-2xl font-black">Boeking Voltooien</h2>
          </div>
          <p className="text-white/80 text-sm">
            Converteer wachtlijst naar bevestigde reservering
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Waitlist Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-3">
              <Users className="w-4 h-4" />
              <span className="font-bold text-sm uppercase">Wachtlijst Informatie</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-600 dark:text-slate-400 mb-1">Klant</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {waitlistEntry.customerName}
                </div>
              </div>
              
              <div>
                <div className="text-slate-600 dark:text-slate-400 mb-1">Personen</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {waitlistEntry.numberOfPersons}
                </div>
              </div>
              
              <div>
                <div className="text-slate-600 dark:text-slate-400 mb-1">Email</div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  {waitlistEntry.customerEmail}
                </div>
              </div>
              
              <div>
                <div className="text-slate-600 dark:text-slate-400 mb-1">Telefoon</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {waitlistEntry.customerPhone || '-'}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="text-slate-600 dark:text-slate-400 mb-1">Event</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {(event as any).showName || event.type} - {format(new Date(event.date), 'dd MMMM yyyy HH:mm', { locale: nl })}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          {/* Arrangement Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Arrangement *
            </label>
            <select
              value={formData.arrangement}
              onChange={(e) => handleArrangementChange(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecteer arrangement...</option>
              {arrangements.map((arr) => (
                <option key={arr.name} value={arr.name}>
                  {arr.name} - €{arr.price.toFixed(2)} p.p.
                </option>
              ))}
            </select>
          </div>

          {/* Price Display */}
          {formData.arrangement && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Prijs Berekening
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {waitlistEntry.numberOfPersons} personen × €{formData.pricePerPerson.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Totaal
                  </div>
                  <div className="text-3xl font-black text-green-600 dark:text-green-400">
                    €{formData.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'confirmed' }))}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 transition-all font-bold",
                  formData.status === 'confirmed'
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-300"
                )}
              >
                <CheckCircle className="w-5 h-5 mx-auto mb-2" />
                Bevestigd
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, status: 'pending' }))}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 transition-all font-bold",
                  formData.status === 'pending'
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-yellow-300"
                )}
              >
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                In Behandeling
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notities
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Extra notities voor deze boeking..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all border-2 border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.arrangement}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Bezig...' : 'Boeking Aanmaken'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
