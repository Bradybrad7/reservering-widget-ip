/**
 * ReservationDetailPanel - Rechter kolom detail panel voor Werkplaats
 * 
 * DOEL: Volledig overzicht van één reservering met inline editing
 * 
 * STATES:
 * - Geen Selectie: Toont gefilterde stats
 * - Wél Selectie: Toont volledige details met inline editing
 * 
 * INLINE EDITING:
 * - Klik direct op velden om te bewerken
 * - Geen aparte "Bewerk" knop nodig
 * - Slaat automatisch op
 */

import { useState } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Package,
  Tag as TagIcon,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Send,
  Download,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem } from '../../../types';
import { formatCurrency, formatDate, cn } from '../../../utils';
import { InlineEdit } from '../../ui/InlineEdit';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { apiService } from '../../../services/apiService';
import { useToast } from '../../Toast';
import { TagConfigService } from '../../../services/tagConfigService';
import { 
  isOptionExpired, 
  isOptionExpiringSoon, 
  getOptionStatusLabel 
} from '../../../utils/optionHelpers';

interface ReservationDetailPanelProps {
  reservation: Reservation | null;
  event?: Event;
  merchandiseItems: MerchandiseItem[];
  filteredStats?: {
    count: number;
    totalAmount: number;
    totalPersons: number;
  };
  onRefresh: () => void;
}

export const ReservationDetailPanel: React.FC<ReservationDetailPanelProps> = ({
  reservation,
  event,
  merchandiseItems,
  filteredStats,
  onRefresh
}) => {
  const toast = useToast();
  const { confirmReservation, rejectReservation, deleteReservation, markAsPaid } = useReservationsStore();
  const { setActiveSection, setSelectedItemId } = useAdminStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // === EMPTY STATE: Geen reservering geselecteerd ===
  if (!reservation) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          {filteredStats && filteredStats.count > 0 ? (
            <>
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Gefilterde Overzicht
              </h3>
              <div className="space-y-3 mt-6">
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="text-sm text-neutral-400">Totaal resultaten</div>
                  <div className="text-3xl font-bold text-white mt-1">{filteredStats.count}</div>
                </div>
                {filteredStats.totalPersons > 0 && (
                  <>
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <div className="text-sm text-neutral-400">Totaal personen</div>
                      <div className="text-3xl font-bold text-white mt-1">{filteredStats.totalPersons}</div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <div className="text-sm text-neutral-400">Totaal omzet</div>
                      <div className="text-3xl font-bold text-white mt-1">
                        {formatCurrency(filteredStats.totalAmount)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">👈</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecteer een reservering
              </h3>
              <p className="text-neutral-400">
                Klik op een reservering in de lijst om details te bekijken en te bewerken
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // === FILLED STATE: Reservering details ===

  // Inline edit handlers
  const handleUpdateField = async (field: string, value: any): Promise<boolean> => {
    try {
      const response = await apiService.updateReservation(reservation.id, { [field]: value });
      if (response.success) {
        toast.success('Bijgewerkt', `${field} is bijgewerkt`);
        onRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Fout', 'Kon veld niet bijwerken');
      return false;
    }
  };

  // Quick actions
  const handleConfirm = async () => {
    if (!confirm('Weet je zeker dat je deze reservering wilt bevestigen?')) return;
    setIsProcessing(true);
    try {
      await confirmReservation(reservation.id);
      toast.success('Bevestigd', 'Reservering is bevestigd');
      onRefresh();
    } catch (error) {
      toast.error('Fout', 'Kon reservering niet bevestigen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Reden voor afwijzing (optioneel):');
    if (reason === null) return; // User cancelled
    setIsProcessing(true);
    try {
      await rejectReservation(reservation.id, reason || undefined);
      toast.success('Afgewezen', 'Reservering is afgewezen');
      onRefresh();
    } catch (error) {
      toast.error('Fout', 'Kon reservering niet afwijzen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Weet je ABSOLUUT ZEKER dat je deze reservering wilt VERWIJDEREN?')) return;
    setIsProcessing(true);
    try {
      await deleteReservation(reservation.id);
      toast.success('Verwijderd', 'Reservering is verwijderd');
      onRefresh();
    } catch (error) {
      toast.error('Fout', 'Kon reservering niet verwijderen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm('Markeer deze reservering als betaald?')) return;
    setIsProcessing(true);
    try {
      await markAsPaid(reservation.id, 'manual', undefined);
      toast.success('Betaald', 'Reservering is gemarkeerd als betaald');
      onRefresh();
    } catch (error) {
      toast.error('Fout', 'Kon betaalstatus niet updaten');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendEmail = async () => {
    if (!confirm(`Email opnieuw versturen naar ${reservation.email}?`)) return;
    
    setIsProcessing(true);
    try {
      // Get event data
      const { useEventsStore } = await import('../../../store/eventsStore');
      const eventsStore = useEventsStore.getState();
      const event = eventsStore.events.find(e => e.id === reservation.eventId);

      if (!event) {
        toast.error('Fout', 'Event niet gevonden');
        return;
      }

      // Send email based on current status
      const { emailService } = await import('../../../services/emailService');
      await emailService.sendByStatus(
        reservation, 
        event, 
        false,
        reservation.rejectionReason
      );

      toast.success('Email Verstuurd', `Email verstuurd naar ${reservation.email}`);
      
      // Log to communication log
      const { communicationLogService } = await import('../../../services/communicationLogService');
      await communicationLogService.logEmail(
        reservation.id,
        `Email opnieuw verstuurd (${reservation.status})`,
        reservation.email,
        'Admin'
      );
      
      onRefresh();
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Fout', 'Kon email niet versturen');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pricing
  const pricing = reservation.pricingSnapshot;
  const arrangementTotaal = pricing?.arrangementTotal || (reservation.numberOfPersons * 35);
  const preDrinkTotaal = pricing?.preDrinkTotal || 0;
  const afterPartyTotaal = pricing?.afterPartyTotal || 0;
  const merchandiseTotaal = pricing?.merchandiseTotal || 0;
  const korting = (pricing?.discountAmount || 0) + (pricing?.voucherAmount || 0);

  // Tag helper
  const getTagColor = (tag: string) => {
    const tagConfig = TagConfigService.getTagConfig(tag);
    if (tagConfig) {
      const color = tagConfig.color;
      return {
        backgroundColor: color + '30',
        color: color,
        borderColor: color + '50'
      };
    }
    return {
      backgroundColor: '#6B7280' + '30',
      color: '#6B7280',
      borderColor: '#6B7280' + '50'
    };
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        
        {/* Header met status en quick actions */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {reservation.contactPerson}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={reservation.status} />
              <StatusBadge status={reservation.paymentStatus} />
              
              {reservation.status === 'option' && reservation.optionExpiresAt && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border',
                  isOptionExpired(reservation)
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : isOptionExpiringSoon(reservation)
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                )}>
                  {getOptionStatusLabel(reservation)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {reservation.status === 'pending' && (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                  title="Bevestigen"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                  title="Annuleren"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            
            {reservation.paymentStatus === 'pending' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                title="Markeer als betaald"
              >
                <DollarSign className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleResendEmail}
              disabled={isProcessing}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              title="Email opnieuw versturen"
            >
              <Send className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="p-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded transition-colors disabled:opacity-50"
              title="Verwijderen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Klant Informatie */}
        <InfoBlok title="Klant Informatie" icon={Users}>
          <InfoRow label="Naam">
            <InlineEdit
              value={reservation.contactPerson}
              onSave={(val) => handleUpdateField('contactPerson', val)}
              type="text"
            />
          </InfoRow>
          
          <InfoRow label="Email">
            <button
              onClick={() => {
                setActiveSection('customers');
                setSelectedItemId(reservation.email);
              }}
              className="text-gold-400 hover:text-gold-300 flex items-center gap-2 group"
            >
              <span>{reservation.email}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </InfoRow>

          <InfoRow label="Telefoon">
            <InlineEdit
              value={reservation.phone || ''}
              onSave={(val) => handleUpdateField('phone', val)}
              type="text"
              placeholder="Geen telefoon"
            />
          </InfoRow>

          {reservation.companyName && (
            <InfoRow label="Bedrijf">
              <InlineEdit
                value={reservation.companyName}
                onSave={(val) => handleUpdateField('companyName', val)}
                type="text"
              />
            </InfoRow>
          )}

          {reservation.address && (
            <InfoRow label="Adres">
              <div className="text-white text-sm">{reservation.address}</div>
            </InfoRow>
          )}
        </InfoBlok>

        {/* Event & Boeking Details */}
        <InfoBlok title="Event & Boeking" icon={Calendar}>
          <InfoRow label="Event">
            {event ? (
              <button
                onClick={() => {
                  setActiveSection('events');
                  setSelectedItemId(event.id);
                }}
                className="text-gold-400 hover:text-gold-300 flex items-center gap-2 group"
              >
                <span>{formatDate(event.date)} - {event.type}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <div className="text-white">Event onbekend</div>
            )}
          </InfoRow>

          <InfoRow label="Aantal personen">
            <InlineEdit
              value={reservation.numberOfPersons}
              onSave={(val) => handleUpdateField('numberOfPersons', Number(val))}
              type="number"
            />
          </InfoRow>

          <InfoRow label="Arrangement">
            <div className="text-white capitalize">{reservation.arrangement}</div>
          </InfoRow>

          {reservation.preDrink && (
            <InfoRow label="Pre-Drink">
              <div className="text-green-400">✓ Ja</div>
            </InfoRow>
          )}

          {reservation.afterParty && (
            <InfoRow label="After Party">
              <div className="text-green-400">✓ Ja</div>
            </InfoRow>
          )}
        </InfoBlok>

        {/* Financieel Overzicht */}
        <InfoBlok title="Financieel" icon={DollarSign}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Arrangement ({reservation.numberOfPersons}p)</span>
              <span className="text-white font-medium">{formatCurrency(arrangementTotaal)}</span>
            </div>
            {preDrinkTotaal > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Pre-Drink</span>
                <span className="text-white font-medium">{formatCurrency(preDrinkTotaal)}</span>
              </div>
            )}
            {afterPartyTotaal > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400">After Party</span>
                <span className="text-white font-medium">{formatCurrency(afterPartyTotaal)}</span>
              </div>
            )}
            {merchandiseTotaal > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Merchandise</span>
                <span className="text-white font-medium">{formatCurrency(merchandiseTotaal)}</span>
              </div>
            )}
            {korting > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Korting</span>
                <span className="font-medium">-{formatCurrency(korting)}</span>
              </div>
            )}
            <div className="border-t border-neutral-700 pt-2 flex justify-between">
              <span className="text-white font-bold">Totaal</span>
              <span className="text-white font-bold text-lg">{formatCurrency(reservation.totalPrice || 0)}</span>
            </div>
          </div>
        </InfoBlok>

        {/* Tags */}
        {reservation.tags && reservation.tags.length > 0 && (
          <InfoBlok title="Tags" icon={TagIcon}>
            <div className="flex flex-wrap gap-2">
              {reservation.tags.map((tag, idx) => {
                // Handle both string tags and tag objects
                const tagLabel = typeof tag === 'string' ? tag : (tag as any).label || (tag as any).id || 'TAG';
                const tagId = typeof tag === 'string' ? tag : (tag as any).id || tagLabel;
                const style = getTagColor(tagId);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded text-sm font-medium border"
                    style={{
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                      borderColor: style.borderColor
                    }}
                  >
                    {tagLabel}
                  </span>
                );
              })}
            </div>
          </InfoBlok>
        )}

        {/* Admin Notes */}
        {reservation.notes && (
          <InfoBlok title="Opmerkingen" icon={MessageSquare}>
            <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {reservation.notes}
            </div>
          </InfoBlok>
        )}

        {/* Metadata */}
        <div className="text-xs text-neutral-500 space-y-1 pt-4 border-t border-neutral-700">
          <div>ID: {reservation.id}</div>
          <div>Aangemaakt: {formatDate(reservation.createdAt)}</div>
          {reservation.updatedAt && (
            <div>Laatst gewijzigd: {formatDate(reservation.updatedAt)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoBlok: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="bg-neutral-800/50 rounded-lg border border-neutral-700/50">
    <h4 className="text-sm font-bold text-gold-400 px-4 py-3 border-b border-neutral-700/50 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {title}
    </h4>
    <div className="p-4 space-y-3">
      {children}
    </div>
  </div>
);

const InfoRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className="text-xs text-neutral-400 uppercase tracking-wide font-semibold block mb-1">
      {label}
    </label>
    <div className="text-white">
      {children}
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'checked-in': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'option': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs font-medium border', getColor())}>
      {status}
    </span>
  );
};
