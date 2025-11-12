import { useState } from 'react';
import { Clock, DollarSign, AlertTriangle, CheckCircle, Play, RefreshCw, Calendar, Mail } from 'lucide-react';
import { optionExpiryService } from '../../services/optionExpiryService';
import { paymentReminderService } from '../../services/paymentReminderService';
import { formatCurrency, formatDate, cn } from '../../utils';

/**
 * 🤖 AUTOMATION MANAGER
 * 
 * Admin interface voor het beheren van geautomatiseerde taken:
 * - Optie vervaldatum controle
 * - Betalingsdeadline monitoring
 * - Handmatige triggers voor batch processen
 * - Status rapportages
 */

export const AutomationManager: React.FC = () => {
  const [isProcessingOptions, setIsProcessingOptions] = useState(false);
  const [isProcessingPayments, setIsProcessingPayments] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  
  const [optionResults, setOptionResults] = useState<any>(null);
  const [paymentResults, setPaymentResults] = useState<any>(null);
  const [reminderResults, setReminderResults] = useState<any>(null);
  
  const [optionReport, setOptionReport] = useState<any>(null);
  const [paymentReport, setPaymentReport] = useState<any>(null);

  // Load initial reports
  React.useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [optRep, payRep] = await Promise.all([
        optionExpiryService.generateOptionReport(),
        paymentReminderService.generatePaymentReport()
      ]);
      setOptionReport(optRep);
      setPaymentReport(payRep);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleProcessExpiredOptions = async () => {
    setIsProcessingOptions(true);
    try {
      const results = await optionExpiryService.processExpiredOptions();
      setOptionResults(results);
      await loadReports(); // Refresh reports
    } catch (error) {
      console.error('Error processing options:', error);
      alert('Fout bij verwerken van opties');
    } finally {
      setIsProcessingOptions(false);
    }
  };

  const handleProcessOverduePayments = async () => {
    setIsProcessingPayments(true);
    try {
      const results = await paymentReminderService.processOverduePayments();
      setPaymentResults(results);
      await loadReports(); // Refresh reports
    } catch (error) {
      console.error('Error processing payments:', error);
      alert('Fout bij verwerken van betalingen');
    } finally {
      setIsProcessingPayments(false);
    }
  };

  const handleSendPaymentReminders = async () => {
    setIsSendingReminders(true);
    try {
      const results = await paymentReminderService.sendPaymentReminders(7);
      setReminderResults(results);
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Fout bij versturen herinneringen');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleSetAllPaymentDueDates = async () => {
    const confirmed = window.confirm(
      'Wil je automatisch betalingsdeadlines instellen voor alle bevestigde boekingen zonder deadline? (7 dagen voor event)'
    );
    
    if (confirmed) {
      try {
        const results = await paymentReminderService.setPaymentDueDatesForAll(7);
        alert(`✅ ${results.updated} betalingsdeadlines ingesteld`);
        await loadReports();
      } catch (error) {
        console.error('Error setting due dates:', error);
        alert('Fout bij instellen deadlines');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Automatisering</h2>
        <p className="text-neutral-400 mt-1">
          Beheer geautomatiseerde taken en batch processen
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option Status */}
        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Optie Status
            </h3>
            <button
              onClick={loadReports}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {optionReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-300">Actieve Opties</span>
                <span className="text-xl font-bold text-blue-400">{optionReport.totalActive}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <span className="text-yellow-300">Verlopen Binnenkort</span>
                <span className="text-xl font-bold text-yellow-400">{optionReport.expiringSoon}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-300">Capaciteit Gereserveerd</span>
                <span className="text-lg font-bold text-white">{optionReport.capacityReserved} personen</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-300">Niet Opgevolgd</span>
                <span className="text-lg font-bold text-red-400">{optionReport.notFollowedUp}</span>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">Laden...</p>
          )}

          <button
            onClick={handleProcessExpiredOptions}
            disabled={isProcessingOptions}
            className={cn(
              'mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
              'bg-blue-500 text-white hover:bg-blue-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isProcessingOptions ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Verwerken...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Proces Verlopen Opties
              </>
            )}
          </button>

          {optionResults && (
            <div className={cn(
              'mt-4 p-4 rounded-lg',
              optionResults.cancelled > 0 
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-neutral-700/50 border border-neutral-600'
            )}>
              <div className="flex items-start gap-2">
                {optionResults.cancelled > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={cn(
                    'font-medium',
                    optionResults.cancelled > 0 ? 'text-green-300' : 'text-neutral-300'
                  )}>
                    {optionResults.cancelled} opties geannuleerd
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    {optionResults.processed} totaal gecontroleerd
                  </p>
                  {optionResults.details && optionResults.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {optionResults.details.map((detail: any) => (
                        <div key={detail.id} className="text-xs text-neutral-400">
                          • {detail.customerName} - {detail.numberOfPersons} pers. ({formatDate(detail.eventDate)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Betaling Status
            </h3>
            <button
              onClick={loadReports}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {paymentReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-green-300">Betaald</span>
                <span className="text-xl font-bold text-green-400">
                  {paymentReport.totalPaid} ({formatCurrency(paymentReport.totalRevenue)})
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <span className="text-yellow-300">In Afwachting</span>
                <span className="text-xl font-bold text-yellow-400">
                  {paymentReport.totalPending} ({formatCurrency(paymentReport.outstandingRevenue)})
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <span className="text-red-300">Achterstallig</span>
                <span className="text-xl font-bold text-red-400">
                  {paymentReport.totalOverdue} ({formatCurrency(paymentReport.overdueRevenue)})
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-300">Vervalt Binnenkort (7d)</span>
                <span className="text-lg font-bold text-orange-400">{paymentReport.paymentsDueSoon}</span>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">Laden...</p>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={handleProcessOverduePayments}
              disabled={isProcessingPayments}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                'bg-red-500 text-white hover:bg-red-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isProcessingPayments ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verwerken...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Markeer Achterstallig
                </>
              )}
            </button>

            <button
              onClick={handleSendPaymentReminders}
              disabled={isSendingReminders}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                'bg-orange-500 text-white hover:bg-orange-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSendingReminders ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Versturen...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Stuur Herinneringen (7d)
                </>
              )}
            </button>

            <button
              onClick={handleSetAllPaymentDueDates}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all bg-neutral-700 text-white hover:bg-neutral-600"
            >
              <Calendar className="w-5 h-5" />
              Stel Alle Deadlines In
            </button>
          </div>

          {paymentResults && (
            <div className={cn(
              'mt-4 p-4 rounded-lg',
              paymentResults.markedOverdue > 0 
                ? 'bg-red-500/20 border border-red-500/50'
                : 'bg-neutral-700/50 border border-neutral-600'
            )}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={cn(
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  paymentResults.markedOverdue > 0 ? 'text-red-400' : 'text-neutral-400'
                )} />
                <div className="flex-1">
                  <p className={cn(
                    'font-medium',
                    paymentResults.markedOverdue > 0 ? 'text-red-300' : 'text-neutral-300'
                  )}>
                    {paymentResults.markedOverdue} betalingen achterstallig gemarkeerd
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    {paymentResults.processed} totaal gecontroleerd
                  </p>
                  {paymentResults.details && paymentResults.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {paymentResults.details.slice(0, 5).map((detail: any) => (
                        <div key={detail.id} className="text-xs text-neutral-400">
                          • {detail.customerName} - {formatCurrency(detail.totalPrice)} ({detail.daysOverdue}d te laat)
                        </div>
                      ))}
                      {paymentResults.details.length > 5 && (
                        <div className="text-xs text-neutral-500 italic">
                          ... en {paymentResults.details.length - 5} meer
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {reminderResults && (
            <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-300">
                    {reminderResults.sent} herinneringen verzonden
                  </p>
                  {reminderResults.details && reminderResults.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {reminderResults.details.slice(0, 3).map((detail: any) => (
                        <div key={detail.id} className="text-xs text-neutral-400">
                          • {detail.customerName} ({detail.email}) - {detail.daysUntilDue}d tot deadline
                        </div>
                      ))}
                      {reminderResults.details.length > 3 && (
                        <div className="text-xs text-neutral-500 italic">
                          ... en {reminderResults.details.length - 3} meer
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">ℹ️ Over Automatisering</h3>
        <div className="space-y-2 text-sm text-blue-200">
          <p>
            <strong>Optie Vervaldatum:</strong> Controleert alle opties (status: 'option') en annuleert automatisch 
            opties waarvan de vervaldatum (optionExpiresAt) is verstreken. Dit maakt capaciteit vrij voor nieuwe boekingen.
          </p>
          <p>
            <strong>Betalingsdeadlines:</strong> Markeert betalingen automatisch als 'overdue' wanneer de betaling 
            vervaldatum (paymentDueDate) is verstreken voor bevestigde reserveringen.
          </p>
          <p>
            <strong>Betalingsherinneringen:</strong> Verstuurt herinneringen naar klanten met openstaande betalingen 
            die binnen 7 dagen vervallen (in productie zou dit echte emails versturen).
          </p>
          <p className="mt-3 pt-3 border-t border-blue-500/30 text-xs text-blue-300">
            💡 <strong>Tip:</strong> Deze processen kunnen dagelijks automatisch worden uitgevoerd via een cron job 
            of scheduled task. Voor nu kun je ze handmatig triggeren met de knoppen hierboven.
          </p>
        </div>
      </div>
    </div>
  );
};
