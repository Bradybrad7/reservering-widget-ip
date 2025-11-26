import { useState } from 'react';
import { Send, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../Toast';

interface EmailTestComponentProps {
  onClose?: () => void;
}

export const EmailTestComponent: React.FC<EmailTestComponentProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const toast = useToast();

  const testEmailFunction = async () => {
    if (!email) {
      toast.error('Vul een geldig email adres in');
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);

    try {
      // Import de email service
      const { emailService } = await import('../../services/emailService');
      
      // Maak een test reservering met alle vereiste velden
      const testReservation = {
        id: 'TEST-' + Date.now(),
        email: email,
        contactPerson: 'Test Persoon',
        companyName: 'Test Bedrijf',
        numberOfPersons: 2,
        totalPrice: 89.50,
        status: 'pending' as const,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        eventId: 'test-event',
        arrangement: 'standaard' as const,
        salutation: 'Dhr' as const,
        firstName: 'Test',
        lastName: 'Persoon',
        phone: '0612345678',
        phoneCountryCode: '+31',
        address: 'Teststraat 1',
        houseNumber: '1',
        postalCode: '1234 AB',
        city: 'Amsterdam',
        country: 'Nederland',
        paymentStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        pricingSnapshot: {
          basePrice: 39.75,
          pricePerPerson: 39.75,
          numberOfPersons: 2,
          arrangement: 'standaard' as const,
          arrangementTotal: 79.50,
          subtotal: 79.50,
          finalTotal: 79.50,
          calculatedAt: new Date()
        },
        // Optionele velden die nodig zijn voor type compliance
        preDrink: { enabled: false, quantity: 0 },
        afterParty: { enabled: false, quantity: 0 },
        celebrationOccasion: '',
        partyPerson: '',
        celebrationDetails: '',
        merchandise: [],
        newsletterOptIn: false,
        acceptTerms: true,
        communicationLog: []
      };

      const testEvent = {
        id: 'test-event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startsAt: '19:30',
        endsAt: '22:30',
        doorsOpen: '19:00',
        type: 'REGULAR' as const,
        showId: 'test-show',
        capacity: 100,
        isActive: true,
        bookingOpensAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        bookingClosesAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        allowedArrangements: ['standaard', 'premium'] as ('standaard' | 'premium')[]
      };

      // Probeer de email te verzenden
      const result = await emailService.sendReservationConfirmation(testReservation, testEvent);
      
      if (result.success) {
        setLastTestResult({ 
          success: true, 
          message: 'Test email succesvol verzonden! Check je inbox (en spam folder).' 
        });
        toast.success('Test email verzonden!', 'Check je inbox (en spam folder)');
      } else {
        setLastTestResult({ 
          success: false, 
          message: `Email verzenden mislukt: ${result.error}` 
        });
        toast.error('Email test mislukt', result.error || 'Onbekende fout');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      setLastTestResult({ 
        success: false, 
        message: `Fout bij email test: ${errorMessage}` 
      });
      toast.error('Email test fout', errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Email Test Tool</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      <p className="text-sm text-neutral-300 mb-4">
        Test of email verzending correct werkt door een test reservering bevestiging te versturen.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Test Email Adres
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jouw-email@voorbeeld.nl"
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={testEmailFunction}
          disabled={isTesting || !email}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isTesting || !email
              ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isTesting ? (
            <>
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              Email verzenden...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Verstuur Test Email
            </>
          )}
        </button>

        {lastTestResult && (
          <div className={`p-3 rounded-lg border-l-4 ${
            lastTestResult.success 
              ? 'bg-green-500/10 border-green-500 text-green-300' 
              : 'bg-red-500/10 border-red-500 text-red-300'
          }`}>
            <div className="flex items-start gap-2">
              {lastTestResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {lastTestResult.success ? 'Test Gelukt' : 'Test Mislukt'}
                </p>
                <p className="text-sm mt-1">{lastTestResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-300">
          <strong>Let op:</strong> In development mode worden emails mogelijk alleen gelogd naar de console. 
          Voor echte email verzending moet je in production mode draaien met correcte Firebase Cloud Functions configuratie.
        </p>
      </div>
    </div>
  );
};
