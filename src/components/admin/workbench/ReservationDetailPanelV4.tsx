/**
 * ReservationDetailPanelV4 - Enhanced met Tab Navigatie
 * 
 * ✨ NIEUW in v4 (Nov 2025):
 * - 4 duidelijke tabs in plaats van één lang scrollen formulier
 * - Tab 1: Overzicht - Klantinfo, boekingdetails, Tags & Notities
 * - Tab 2: Financieel - Prijsopbouw, betalingen, facturen
 * - Tab 3: Communicatie - Email historie, handmatige emails
 * - Tab 4: Historie - Audit log van alle wijzigingen
 * 
 * INLINE EDITING: Direct klikken om te wijzigen (via InlineEdit component)
 */

import React, { useState } from 'react';
import {
  User,
  CreditCard,
  Mail,
  History,
  Users,
  Building2,
  Calendar,
  Package,
  Tag as TagIcon,
  MessageSquare,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Download,
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem } from '../../../types';
import { formatCurrency, formatDate, cn } from '../../../utils';
import { InlineEdit } from '../../ui/InlineEdit';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { EmailHistoryTimeline } from '../EmailHistoryTimeline';
import { AuditLogViewer } from '../AuditLogViewer';
import { useToast } from '../../Toast';
import { apiService } from '../../../services/apiService';

interface ReservationDetailPanelV4Props {
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

type TabName = 'overview' | 'financial' | 'communication' | 'history';

interface Tab {
  id: TabName;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const ReservationDetailPanelV4: React.FC<ReservationDetailPanelV4Props> = ({
  reservation,
  event,
  merchandiseItems,
  filteredStats,
  onRefresh
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [isProcessing, setIsProcessing] = useState(false);

  const { confirmReservation, rejectReservation, deleteReservation, updateReservation } = useReservationsStore();
  const { setActiveSection, setSelectedItemId } = useAdminStore();

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

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

  // ============================================================================
  // TABS CONFIGURATION
  // ============================================================================

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overzicht',
      icon: User,
    },
    {
      id: 'financial',
      label: 'Financieel',
      icon: CreditCard,
    },
    {
      id: 'communication',
      label: 'Communicatie',
      icon: Mail,
    },
    {
      id: 'history',
      label: 'Historie',
      icon: History,
    },
  ];

  // ============================================================================
  // INLINE EDIT HANDLER
  // ============================================================================

  const handleUpdateField = async (field: string, value: any): Promise<boolean> => {
    try {
      const success = await updateReservation(reservation.id, { [field]: value });
      if (success) {
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

  // ============================================================================
  // QUICK ACTIONS
  // ============================================================================

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
    if (!confirm('Weet je ZEKER dat je deze reservering wilt verwijderen? Dit kan niet ongedaan worden!')) return;
    
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

  // ============================================================================
  // STATUS BADGE
  // ============================================================================

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: 'Wacht op goedkeuring', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      confirmed: { label: 'Bevestigd', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      rejected: { label: 'Afgewezen', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      cancelled: { label: 'Geannuleerd', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
      'checked-in': { label: 'Ingecheckt', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
      request: { label: 'Over capaciteit', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
      option: { label: 'Optie', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock },
      waitlist: { label: 'Wachtlijst', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: Clock },
    };

    const config = statusConfig[reservation.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border',
        config.color
      )}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* ====================================================================
          HEADER: Basis info + Status + Quick Actions
          ==================================================================== */}
      <div className="flex-shrink-0 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b-2 border-gold-500 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">
                {reservation.companyName || reservation.contactPerson}
              </h2>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reservation.numberOfPersons} personen
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(reservation.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {reservation.arrangement}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {reservation.status === 'pending' && (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Bevestigen
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Afwijzen
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Verwijderen
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          TAB NAVIGATIE
          ==================================================================== */}
      <div className="flex-shrink-0 bg-neutral-800/50 border-b border-neutral-700 px-6">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 font-medium transition-all relative',
                  isActive
                    ? 'text-gold-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <span className="px-2 py-0.5 bg-gold-500 text-black text-xs font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          TAB CONTENT
          ==================================================================== */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            reservation={reservation}
            event={event}
            onUpdateField={handleUpdateField}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialTab
            reservation={reservation}
            merchandiseItems={merchandiseItems}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'communication' && (
          <CommunicationTab
            reservation={reservation}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            reservation={reservation}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 1: OVERZICHT
// ============================================================================

interface OverviewTabProps {
  reservation: Reservation;
  event?: Event;
  onUpdateField: (field: string, value: any) => Promise<boolean>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ reservation, event, onUpdateField }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Klant Informatie */}
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold-400" />
          Klant Informatie
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InlineEdit
            label="Bedrijfsnaam"
            value={reservation.companyName || ''}
            onSave={(value) => onUpdateField('companyName', value)}
            icon={Building2}
          />
          <InlineEdit
            label="Contactpersoon"
            value={reservation.contactPerson}
            onSave={(value) => onUpdateField('contactPerson', value)}
            icon={User}
          />
          <InlineEdit
            label="Email"
            value={reservation.email}
            type="email"
            onSave={(value) => onUpdateField('email', value)}
            icon={Mail}
          />
          <InlineEdit
            label="Telefoon"
            value={reservation.phone || ''}
            onSave={(value) => onUpdateField('phone', value)}
            icon={User}
          />
        </div>
      </section>

      {/* Boeking Details */}
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold-400" />
          Boeking Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InlineEdit
            label="Aantal personen"
            value={reservation.numberOfPersons.toString()}
            type="number"
            onSave={(value) => onUpdateField('numberOfPersons', parseInt(value))}
            icon={Users}
          />
          <InlineEdit
            label="Arrangement"
            value={reservation.arrangement}
            onSave={(value) => onUpdateField('arrangement', value)}
            icon={Package}
          />
          <div className="col-span-2">
            <InlineEdit
              label="Speciale wensen / Dieetwensen"
              value={reservation.specialRequests || ''}
              multiline
              onSave={(value) => onUpdateField('specialRequests', value)}
              icon={MessageSquare}
            />
          </div>
        </div>
      </section>

      {/* Tags & Notities */}
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-gold-400" />
          Tags & Notities
        </h3>
        <div className="space-y-4">
          {/* Tags komen hier - kan later uitgebreid worden */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {reservation.tags && reservation.tags.length > 0 ? (
                reservation.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-neutral-500 text-sm">Geen tags</span>
              )}
            </div>
          </div>

          <InlineEdit
            label="Admin Notities"
            value={reservation.adminNotes || ''}
            multiline
            onSave={(value) => onUpdateField('adminNotes', value)}
            icon={MessageSquare}
          />
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// TAB 2: FINANCIEEL
// ============================================================================

interface FinancialTabProps {
  reservation: Reservation;
  merchandiseItems: MerchandiseItem[];
  onRefresh: () => void;
}

const FinancialTab: React.FC<FinancialTabProps> = ({ reservation, merchandiseItems, onRefresh }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gold-400" />
          Prijsopbouw
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-neutral-700">
            <span className="text-neutral-400">Basis prijs</span>
            <span className="text-white font-medium">{formatCurrency(reservation.totalPrice || 0)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-semibold">
            <span className="text-white">Totaal</span>
            <span className="text-gold-400">{formatCurrency(reservation.totalPrice || 0)}</span>
          </div>
        </div>
      </section>

      {/* Betalingen sectie - kan later uitgebreid worden */}
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold-400" />
          Betalingen
        </h3>
        <p className="text-neutral-400 text-sm">Betalingstracking komt hier...</p>
      </section>
    </div>
  );
};

// ============================================================================
// TAB 3: COMMUNICATIE
// ============================================================================

interface CommunicationTabProps {
  reservation: Reservation;
  onRefresh: () => void;
}

const CommunicationTab: React.FC<CommunicationTabProps> = ({ reservation, onRefresh }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gold-400" />
          Email Historie
        </h3>
        <EmailHistoryTimeline reservationId={reservation.id} />
      </section>

      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-gold-400" />
          Handmatige Email
        </h3>
        <button className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-black rounded-lg font-medium transition-colors">
          <Send className="w-4 h-4 inline mr-2" />
          Stuur Email
        </button>
      </section>
    </div>
  );
};

// ============================================================================
// TAB 4: HISTORIE (AUDIT LOG)
// ============================================================================

interface HistoryTabProps {
  reservation: Reservation;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ reservation }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gold-400" />
          Wijzigingen Log
        </h3>
        <AuditLogViewer
          resourceType="reservation"
          resourceId={reservation.id}
        />
      </section>
    </div>
  );
};
