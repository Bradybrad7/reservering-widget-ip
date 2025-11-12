/**
 * CustomerTimeline Component
 * 
 * Vervang de oude boekingsgeschiedenis door een rijk timeline van:
 * - Reserveringen (created, confirmed, cancelled, check-in)
 * - Betalingen
 * - Admin notities
 * - Tag wijzigingen
 * - Email communicatie
 * 
 * Visuele chronologische lijn met icons en kleuren per event type
 */


import {
  Calendar,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Tag,
  Mail,
  StickyNote,
  UserCheck,
  FileText
} from 'lucide-react';
import { useCustomerTimeline, type TimelineEvent } from '../../hooks/useCustomerTimeline';
import { formatDate, formatCurrency, cn } from '../../utils';
import type { Reservation } from '../../types';

interface CustomerTimelineProps {
  reservations: Reservation[];
  notes?: Array<{ content: string; createdAt: number }>;
  tags?: string[];
  emails?: Array<{ subject: string; sentAt: number }>;
}

// Icon mapping per timeline event type
const getTimelineIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'reservation_created':
      return Calendar;
    case 'reservation_confirmed':
      return Check;
    case 'reservation_cancelled':
    case 'reservation_rejected':
      return X;
    case 'check_in':
      return UserCheck;
    case 'payment_received':
      return CreditCard;
    case 'payment_pending':
      return AlertCircle;
    case 'note_added':
      return StickyNote;
    case 'tag_added':
    case 'tag_removed':
      return Tag;
    case 'email_sent':
      return Mail;
    default:
      return FileText;
  }
};

// Color mapping per timeline event type
const getTimelineColor = (type: TimelineEvent['type']): string => {
  switch (type) {
    case 'reservation_created':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'reservation_confirmed':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'check_in':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'reservation_cancelled':
    case 'reservation_rejected':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'payment_received':
      return 'text-green-400 bg-green-500/10 border-green-500/30';
    case 'payment_pending':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'note_added':
      return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    case 'tag_added':
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    case 'tag_removed':
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    case 'email_sent':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
};

export const CustomerTimeline: React.FC<CustomerTimelineProps> = ({
  reservations,
  notes = [],
  tags = [],
  emails = []
}) => {
  const timeline = useCustomerTimeline({ reservations, notes, tags, emails });

  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Geen timeline events gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Customer Timeline ({timeline.length})
        </h2>
      </div>

      {/* Timeline list */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

        {/* Timeline events */}
        <div className="space-y-6">
          {timeline.map((event, index) => {
            const Icon = getTimelineIcon(event.type);
            const colorClasses = getTimelineColor(event.type);

            return (
              <div key={event.id} className="relative pl-14">
                {/* Icon circle */}
                <div
                  className={cn(
                    'absolute left-0 w-12 h-12 rounded-full border-2 flex items-center justify-center',
                    colorClasses
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Event content */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-300 text-sm mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      <div>{formatDate(new Date(event.timestamp))}</div>
                      <div className="mt-0.5">
                        {new Date(event.timestamp).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Metadata display */}
                  {event.metadata && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {event.metadata.numberOfPersons && (
                          <span>👥 {event.metadata.numberOfPersons} personen</span>
                        )}
                        {event.metadata.arrangement && (
                          <span>📦 {event.metadata.arrangement}</span>
                        )}
                        {event.metadata.totalPrice !== undefined && (
                          <span>💰 {formatCurrency(event.metadata.totalPrice)}</span>
                        )}
                        {event.metadata.status && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded font-medium',
                              event.metadata.status === 'confirmed' && 'bg-emerald-500/20 text-emerald-300',
                              event.metadata.status === 'pending' && 'bg-amber-500/20 text-amber-300',
                              event.metadata.status === 'cancelled' && 'bg-red-500/20 text-red-300'
                            )}
                          >
                            {event.metadata.status}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
