/**
 * 🚶 WALK-IN MODAL
 * 
 * Quick walk-in guest registration
 * Minimal friction, essential info only
 * 
 * November 12, 2025
 */

import { useState } from 'react';
import { X, UserPlus, Users, Mail, Phone, Building2 } from 'lucide-react';
import type { Event, Reservation } from '../../../types';
import { apiService } from '../../../services/apiService';

interface WalkInModalProps {
  event: Event;
  existingReservations: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  event,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    contactPerson: '',
    companyName: '',
    email: '',
    phone: '',
    numberOfPersons: 2
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactPerson || !formData.email) {
      alert('Vul minimaal naam en email in');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create walk-in reservation
      const walkIn: Partial<Reservation> = {
        eventId: event.id,
        contactPerson: formData.contactPerson,
        companyName: formData.companyName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        numberOfPersons: formData.numberOfPersons,
        arrangement: 'Standard',
        totalPrice: 0,
        status: 'confirmed',
        eventDate: event.date,
        // 🔧 Split contactPerson into firstName and lastName
      const nameParts = formData.contactPerson.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      walkIn = {
        eventId: event.id,
        contactPerson: formData.contactPerson,
        companyName: formData.companyName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        numberOfPersons: formData.numberOfPersons,
        arrangement: 'Standard',
        totalPrice: 0,
        status: 'confirmed',
        eventDate: event.date,
        // Required fields for form data
        firstName,
        lastName,
        salutation: '',
        address: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: 'Nederland',
        phoneCountryCode: '+31',
        newsletterOptIn: false,
        acceptTerms: true,
        preDrink: { enabled: false, quantity: 0 },
        afterParty: { enabled: false, quantity: 0 },
        merchandise: [],
        payments: [],
        refunds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await apiService.submitReservation(walkIn as any, event.id);
      if (result.success) {
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to create walk-in');
      }
    } catch (error) {
      console.error('Failed to add walk-in:', error);
      alert('Fout bij toevoegen walk-in gast');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 rounded-xl max-w-lg w-full border border-neutral-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-gold-400" />
              Walk-In Gast
            </h2>
            <p className="text-sm text-neutral-400">
              {event.type} {event.showId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contact Person (Required) */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Naam *
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Voor- en achternaam"
              required
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          {/* Company (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Building2 className="w-4 h-4 text-neutral-500" />
              Bedrijf (optioneel)
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Bedrijfsnaam"
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          {/* Email (Required) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Mail className="w-4 h-4 text-neutral-500" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@voorbeeld.nl"
              required
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Phone className="w-4 h-4 text-neutral-500" />
              Telefoon (optioneel)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+31 6 12345678"
              className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>

          {/* Number of Persons */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
              <Users className="w-4 h-4 text-gold-400" />
              Aantal Personen *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, numberOfPersons: Math.max(1, formData.numberOfPersons - 1) })}
                className="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xl transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-white">
                  {formData.numberOfPersons}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, numberOfPersons: formData.numberOfPersons + 1 })}
                className="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-neutral-700 bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gold-600 hover:bg-gold-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-black rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {isSubmitting ? 'Bezig...' : 'Walk-In Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  );
};
