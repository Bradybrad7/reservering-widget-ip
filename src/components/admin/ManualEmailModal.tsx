import React, { useState } from 'react';
import { Mail, Send, X, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Reservation, Event } from '../../types';
import { emailService } from '../../services/emailService';

interface ManualEmailModalProps {
  reservation: Reservation;
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type EmailType = 'confirmation' | 'reminder' | 'status_update';

/**
 * Manual Email Modal Component
 * Allows admin to manually resend emails to customers
 */
export function ManualEmailModal({
  reservation,
  event,
  isOpen,
  onClose,
  onSuccess
}: ManualEmailModalProps) {
  const [selectedType, setSelectedType] = useState<EmailType>('confirmation');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const emailTypes: Array<{ value: EmailType; label: string; description: string }> = [
    {
      value: 'confirmation',
      label: 'Bevestigingsmail',
      description: 'Volledige reservering bevestiging met QR code en details'
    },
    {
      value: 'reminder',
      label: 'Herinnering',
      description: 'Herinnering voor aankomend evenement'
    },
    {
      value: 'status_update',
      label: 'Status Update',
      description: `Huidige status (${reservation.status}) bevestigen`
    }
  ];

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    
    try {
      // TODO: Get admin username from auth context
      const adminUsername = 'Admin'; // Placeholder
      
      const result = await emailService.sendManualEmail(
        reservation,
        event,
        selectedType,
        adminUsername
      );
      
      if (result.success) {
        setSuccess(true);
        setShowConfirmation(false);
        
        // Close after 2 seconds
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess();
          }
          // Reset state
          setSuccess(false);
          setSelectedType('confirmation');
        }, 2000);
      } else {
        setError(result.error || 'Er is een fout opgetreden bij het versturen van de email.');
        setShowConfirmation(false);
      }
    } catch (err) {
      console.error('Error sending manual email:', err);
      setError('Er is een fout opgetreden bij het versturen van de email.');
      setShowConfirmation(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  const selectedTypeInfo = emailTypes.find(t => t.value === selectedType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Email Versturen
                </h3>
                <p className="text-sm text-gray-600">
                  Handmatig email versturen naar klant
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Email succesvol verzonden!</p>
                <p className="text-sm text-green-700 mt-1">
                  De email is verzonden naar {reservation.email}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Fout bij versturen</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <>
              {/* Recipient info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Ontvanger</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <strong>Naam:</strong> {reservation.contactPerson}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {reservation.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Reservering:</strong> {reservation.id}
                  </p>
                </div>
              </div>

              {/* Email type selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Selecteer Email Type
                </label>
                <div className="space-y-2">
                  {emailTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      disabled={isSending}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${isSending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                        {selectedType === type.value && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Let op:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Deze email wordt direct naar de klant verzonden</li>
                      <li>De email wordt gelogd in de email geschiedenis</li>
                      <li>Controleer of de klant deze email verwacht</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isSending}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuleren
              </button>
              
              {!showConfirmation ? (
                <button
                  onClick={handleConfirm}
                  disabled={isSending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview & Bevestig</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Versturen...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Verstuur Email</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Confirmation overlay */}
        {showConfirmation && !success && !isSending && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-xl">
            <div className="max-w-md p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Email verzenden?
              </h4>
              <p className="text-gray-600 mb-6">
                Weet je zeker dat je <strong>{selectedTypeInfo?.label}</strong> wilt versturen naar:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-700">
                  <strong>Naar:</strong> {reservation.email}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Naam:</strong> {reservation.contactPerson}
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Terug
                </button>
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Ja, verstuur</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
