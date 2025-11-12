import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import type { EmailLog } from '../../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { emailService } from '../../services/emailService';

interface EmailHistoryTimelineProps {
  reservationId?: string;
  waitlistEntryId?: string;
  emailLogs?: EmailLog[];
  onRetry?: (log: EmailLog) => void;
}

/**
 * Email History Timeline Component
 * Shows visual timeline of all emails sent for a reservation or waitlist entry
 */
export function EmailHistoryTimeline({
  reservationId,
  waitlistEntryId,
  emailLogs: providedLogs,
  onRetry
}: EmailHistoryTimelineProps) {
  const [logs, setLogs] = useState<EmailLog[]>(providedLogs || []);
  const [isLoading, setIsLoading] = useState(!providedLogs);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch logs if not provided
  useEffect(() => {
    if (!providedLogs && reservationId) {
      loadLogs();
    }
  }, [reservationId, providedLogs]);

  const loadLogs = async () => {
    if (!reservationId) return;
    
    setIsLoading(true);
    try {
      const fetchedLogs = await emailService.getEmailHistory(reservationId);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load email history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (log: EmailLog) => {
    setSelectedLog(log);
    setShowPreview(true);
  };

  const handleRetry = (log: EmailLog) => {
    if (onRetry) {
      onRetry(log);
    }
  };

  // Email type labels
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      confirmation: 'Bevestiging',
      status_update: 'Status Update',
      reminder: 'Herinnering',
      waitlist_confirmation: 'Wachtlijst Bevestiging',
      waitlist_availability: 'Wachtlijst Beschikbaarheid',
      admin_notification: 'Admin Notificatie',
      custom: 'Aangepast'
    };
    return labels[type] || type;
  };

  // Status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    const labels: Record<string, string> = {
      sent: 'Verzonden',
      failed: 'Mislukt',
      pending: 'In behandeling'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        <span className="ml-3 text-gray-600">Email geschiedenis laden...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Geen emails verstuurd</p>
        <p className="text-sm text-gray-500 mt-1">
          Email geschiedenis verschijnt hier zodra emails worden verstuurd
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Email entries */}
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div key={log.id} className="relative flex items-start space-x-4">
              {/* Status icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${
                  log.status === 'sent' ? 'bg-green-100' : 
                  log.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {getStatusIcon(log.status)}
                </div>
              </div>

              {/* Email details card */}
              <div className={`flex-1 border rounded-lg p-4 ${getStatusColor(log.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type and status */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {getTypeLabel(log.type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        log.status === 'sent' ? 'bg-green-200 text-green-800' :
                        log.status === 'failed' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {getStatusText(log.status)}
                      </span>
                      {log.trigger === 'manual' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-200 text-blue-800 font-medium">
                          Handmatig
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    {log.emailSubject && (
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Onderwerp:</strong> {log.emailSubject}
                      </p>
                    )}

                    {/* Recipient */}
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Naar:</strong> {log.recipientEmail}
                      {log.recipientName && ` (${log.recipientName})`}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500">
                      {format(log.sentAt, "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                      {log.sentBy && ` • Verstuurd door ${log.sentBy}`}
                    </p>

                    {/* Error message */}
                    {log.status === 'failed' && log.errorMessage && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                        <strong>Fout:</strong> {log.errorMessage}
                      </div>
                    )}

                    {/* Preview snippet */}
                    {log.emailPreview && (
                      <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">
                        {log.emailPreview}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {log.emailPreview && (
                      <button
                        onClick={() => handlePreview(log)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Bekijk preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    {log.status === 'failed' && onRetry && (
                      <button
                        onClick={() => handleRetry(log)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title="Probeer opnieuw"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Email Preview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTypeLabel(selectedLog.type)} - {getStatusText(selectedLog.status)}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Email details */}
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Van:</span>
                  <span className="text-sm text-gray-600 ml-2">Inspiration Point Theater</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Naar:</span>
                  <span className="text-sm text-gray-600 ml-2">{selectedLog.recipientEmail}</span>
                </div>
                {selectedLog.emailSubject && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Onderwerp:</span>
                    <span className="text-sm text-gray-600 ml-2">{selectedLog.emailSubject}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-700">Verzonden:</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {format(selectedLog.sentAt, "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                  </span>
                </div>
              </div>

              {/* Email preview */}
              {selectedLog.emailPreview && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedLog.emailPreview}
                  </p>
                </div>
              )}

              {/* Error message */}
              {selectedLog.status === 'failed' && selectedLog.errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-2">Foutmelding:</p>
                  <p className="text-sm text-red-800">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Email ID: {selectedLog.id}
                </p>
                {selectedLog.status === 'failed' && onRetry && (
                  <button
                    onClick={() => {
                      handleRetry(selectedLog);
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Probeer opnieuw</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
