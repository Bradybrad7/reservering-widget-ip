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

import { useState } from 'react';
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
  ExternalLink,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem } from '../../../types';
import { formatCurrency, formatDate, cn } from '../../../utils';
import { InlineEdit } from '../../ui/InlineEdit';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { useOperationsStore } from '../../../store/operationsStore';
import { EmailHistoryTimeline } from '../EmailHistoryTimeline';
import { AuditLogViewer } from '../AuditLogViewer';
import { useToast } from '../../Toast';
import { apiService } from '../../../services/apiService';
import { AddPaymentModal } from '../financial/AddPaymentModal';
import { AddRefundModal } from '../financial/AddRefundModal';
import {
  getTotalPaid,
  getTotalRefunded,
  getNetRevenue,
  getOutstandingBalance,
  getFinancialTimeline,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  isFullyPaid,
  hasPayments,
  hasRefunds
} from '../../../utils/financialHelpers';

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
              onClick={() => setActiveTab('communication')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Email opnieuw versturen"
            >
              <Send className="w-4 h-4" />
              Email Versturen
            </button>
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
      {/* ✨ INTELLIGENTE CROSS-NAVIGATION */}
      <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Snelle Navigatie
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              const { setActiveTab, setCustomerContext } = useOperationsStore.getState();
              setCustomerContext(reservation.email, reservation.companyName || reservation.contactPerson);
              setActiveTab('customers');
            }}
            className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Users className="w-4 h-4" />
            Klantprofiel
          </button>
          
          <button
            onClick={() => {
              const { setActiveTab, setEventContext } = useOperationsStore.getState();
              if (event) {
                const eventDate = new Date(event.date).toLocaleDateString('nl-NL', { 
                  day: 'numeric', 
                  month: 'short' 
                });
                setEventContext(reservation.eventId, `${event.type} ${eventDate}`);
                setActiveTab('events');
              }
            }}
            className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" />
            Event Details
          </button>
          
          <button
            onClick={() => {
              const { setActiveTab } = useOperationsStore.getState();
              setActiveTab('payments');
            }}
            className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:text-green-300 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <DollarSign className="w-4 h-4" />
            Betalingen
          </button>
        </div>
      </section>

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Calculate financial metrics
  const totalPaid = getTotalPaid(reservation);
  const totalRefunded = getTotalRefunded(reservation);
  const netRevenue = getNetRevenue(reservation);
  const outstanding = getOutstandingBalance(reservation);
  const timeline = getFinancialTimeline(reservation);

  const statusLabel = getPaymentStatusLabel(reservation);
  const statusColor = getPaymentStatusColor(reservation);

  const statusColorClasses: Record<string, string> = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <FileText className="w-4 h-4" />
            Totaalprijs
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(reservation.totalPrice)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <ArrowDownCircle className="w-4 h-4" />
            Totaal Betaald
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(totalPaid)}
          </div>
          {hasPayments(reservation) && (
            <div className="text-xs text-green-400 mt-1">
              {reservation.payments?.length} betaling(en)
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
            <ArrowUpCircle className="w-4 h-4" />
            Gerestitueerd
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(totalRefunded)}
          </div>
          {hasRefunds(reservation) && (
            <div className="text-xs text-purple-400 mt-1">
              {reservation.refunds?.length} restitutie(s)
            </div>
          )}
        </div>

        <div className={cn(
          "rounded-xl p-4 border",
          outstanding > 0 
            ? "bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/30"
            : "bg-gradient-to-br from-gold-900/30 to-gold-800/20 border-gold-500/30"
        )}>
          <div className={cn(
            "flex items-center gap-2 text-sm mb-1",
            outstanding > 0 ? "text-orange-400" : "text-gold-400"
          )}>
            <TrendingUp className="w-4 h-4" />
            {outstanding > 0 ? 'Nog te betalen' : 'Netto Inkomsten'}
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(outstanding > 0 ? outstanding : netRevenue)}
          </div>
          {outstanding === 0 && isFullyPaid(reservation) && (
            <div className="text-xs text-gold-400 mt-1">
              ✓ Volledig betaald
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border',
          statusColorClasses[statusColor]
        )}>
          {statusLabel}
        </span>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Betaling Toevoegen
          </button>
          
          {hasPayments(reservation) && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Restitutie Toevoegen
            </button>
          )}
        </div>
      </div>

      {/* Financial Timeline */}
      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gold-400" />
          Financiële Tijdlijn
        </h3>

        {timeline.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nog geen transacties geregistreerd</p>
            <p className="text-sm mt-1">Voeg een betaling toe om te beginnen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((transaction, idx) => {
              const isPayment = transaction.type === 'payment';
              const Icon = isPayment ? ArrowDownCircle : ArrowUpCircle;
              const bgColor = isPayment ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/10 border-purple-500/30';
              const textColor = isPayment ? 'text-green-400' : 'text-purple-400';

              return (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  className={cn(
                    "p-4 rounded-lg border",
                    bgColor
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", textColor)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={cn("font-semibold", textColor)}>
                            {isPayment ? '💚 Betaling' : '💜 Restitutie'}
                          </span>
                          <span className="text-sm text-neutral-400">
                            {formatDate(transaction.date)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                          <div>
                            <span className="text-neutral-400">Methode: </span>
                            <span className="text-white font-medium">
                              {transaction.method === 'ideal' && 'iDEAL'}
                              {transaction.method === 'bank_transfer' && 'Bankoverschrijving'}
                              {transaction.method === 'pin' && 'Pin'}
                              {transaction.method === 'cash' && 'Contant'}
                              {transaction.method === 'invoice' && 'Factuur'}
                              {transaction.method === 'voucher' && 'Voucher'}
                              {transaction.method === 'other' && 'Anders'}
                            </span>
                          </div>

                          {transaction.reference && (
                            <div>
                              <span className="text-neutral-400">Referentie: </span>
                              <span className="text-white font-mono text-xs">{transaction.reference}</span>
                            </div>
                          )}

                          {!isPayment && 'reason' in transaction && (
                            <div>
                              <span className="text-neutral-400">Reden: </span>
                              <span className="text-white">
                                {(transaction as any).reason === 'cancellation' && 'Annulering'}
                                {(transaction as any).reason === 'rebooking' && 'Overboeking'}
                                {(transaction as any).reason === 'goodwill' && 'Coulance'}
                                {(transaction as any).reason === 'discount' && 'Korting'}
                                {(transaction as any).reason === 'overpayment' && 'Te veel betaald'}
                                {(transaction as any).reason === 'other' && 'Anders'}
                              </span>
                            </div>
                          )}

                          {transaction.processedBy && (
                            <div>
                              <span className="text-neutral-400">Verwerkt door: </span>
                              <span className="text-white">{transaction.processedBy}</span>
                            </div>
                          )}
                        </div>

                        {transaction.note && (
                          <div className="mt-2 p-2 bg-neutral-900/50 rounded text-sm text-neutral-300">
                            <span className="text-neutral-400">Notitie: </span>
                            {transaction.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={cn("text-xl font-bold ml-4 flex-shrink-0", textColor)}>
                      {isPayment ? '+' : '−'} {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Net Revenue Summary */}
        {timeline.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-gold-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-400 mb-1">Financiële Samenvatting</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">Totaal Betaald: {formatCurrency(totalPaid)}</span>
                  {totalRefunded > 0 && (
                    <>
                      <span className="text-neutral-600">−</span>
                      <span className="text-purple-400">Totaal Gerestitueerd: {formatCurrency(totalRefunded)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-400 mb-1">Netto Inkomsten</div>
                <div className="text-3xl font-bold text-gold-400">
                  {formatCurrency(netRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment Modal */}
      <AddPaymentModal
        reservation={reservation}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          onRefresh();
        }}
      />

      {/* Refund Modal */}
      <AddRefundModal
        reservation={reservation}
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onSuccess={() => {
          setShowRefundModal(false);
          onRefresh();
        }}
      />
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
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  const handleResendEmail = async (emailType: 'current' | 'confirmation' | 'pending' | 'rejection') => {
    if (!confirm(`Weet je zeker dat je de ${emailType === 'current' ? 'huidige status' : emailType} email opnieuw wilt versturen naar ${reservation.email}?`)) {
      return;
    }

    setIsSending(true);
    try {
      // Get event data
      const { useEventsStore } = await import('../../../store/eventsStore');
      const eventsStore = useEventsStore.getState();
      const event = eventsStore.events.find(e => e.id === reservation.eventId);

      if (!event) {
        toast.error('Fout', 'Event niet gevonden');
        return;
      }

      // Import email services
      const { emailService } = await import('../../../services/emailService');
      const { modernEmailService } = await import('../../../services/modernEmailService');

      let success = false;
      let message = '';

      // Determine which email to send
      switch (emailType) {
        case 'current':
          // Send email based on current status
          await modernEmailService.sendByStatus(
            reservation, 
            event, 
            false,
            reservation.rejectionReason
          );
          success = true;
          message = `Email verstuurd op basis van huidige status: ${reservation.status}`;
          break;

        case 'confirmation':
          // Force send confirmation email regardless of status
          const confirmedReservation = { ...reservation, status: 'confirmed' as const };
          await modernEmailService.sendByStatus(confirmedReservation, event);
          success = true;
          message = 'Bevestigingsmail opnieuw verstuurd';
          break;

        case 'pending':
          // Force send pending email
          const pendingReservation = { ...reservation, status: 'pending' as const };
          await modernEmailService.sendByStatus(pendingReservation, event);
          success = true;
          message = 'Aanvraag ontvangen mail opnieuw verstuurd';
          break;

        case 'rejection':
          // Force send rejection email
          const reason = reservation.rejectionReason || prompt('Reden voor afwijzing (optioneel):') || 'De gevraagde datum is helaas niet beschikbaar.';
          const rejectedReservation = { ...reservation, status: 'rejected' as const };
          await modernEmailService.sendByStatus(rejectedReservation, event, false, reason);
          success = true;
          message = 'Afwijzingsmail opnieuw verstuurd';
          break;
      }

      if (success) {
        toast.success('Email Verstuurd', message);
        
        // Log to communication log
        const { communicationLogService } = await import('../../../services/communicationLogService');
        await communicationLogService.logEmail(
          reservation.id,
          `Email opnieuw verstuurd: ${emailType}`,
          reservation.email,
          'Admin'
        );
        
        onRefresh();
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Fout', 'Kon email niet versturen. Controleer de console voor details.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Email Opnieuw Versturen Section */}
      <section className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Email Opnieuw Versturen
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Verstuur een email opnieuw als de klant deze niet heeft ontvangen
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleResendEmail('current')}
            disabled={isSending}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {reservation.status === 'confirmed' && 'Bevestigingsmail'}
            {reservation.status === 'pending' && 'Aanvraag Mail'}
            {reservation.status === 'rejected' && 'Afwijzingsmail'}
            {reservation.status === 'option' && 'Optie Mail'}
            {!['confirmed', 'pending', 'rejected', 'option'].includes(reservation.status) && 'Huidige Status Mail'}
          </button>

          <button
            onClick={() => handleResendEmail('confirmation')}
            disabled={isSending}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Bevestigingsmail
          </button>

          <button
            onClick={() => handleResendEmail('pending')}
            disabled={isSending}
            className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Aanvraag Mail
          </button>

          <button
            onClick={() => handleResendEmail('rejection')}
            disabled={isSending}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Afwijzingsmail
          </button>
        </div>

        {isSending && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
              Email wordt verstuurd...
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg">
          <p className="text-xs text-neutral-400">
            <strong className="text-neutral-300">Email adres:</strong> {reservation.email}
          </p>
        </div>
      </section>

      <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gold-400" />
          Email Historie
        </h3>
        <EmailHistoryTimeline reservationId={reservation.id} />
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
