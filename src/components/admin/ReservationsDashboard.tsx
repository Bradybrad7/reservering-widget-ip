/**
 * 🎯 RESERVERINGEN DASHBOARD - COMPLETE MANAGEMENT SYSTEEM (November 15, 2025)
 * 
 * Compleet reserveringen beheer systeem met alle functionaliteit voor dagelijks gebruik
 * 
 * FUNCTIONALITEIT:
 * - Dashboard met real-time statistieken en capaciteit monitoring
 * - Alle reserveringen met filtering (dag/week/maand)
 * - Pending reserveringen (wachten op bevestiging)
 * - Bevestigde reserveringen met volledige bewerking
 * - Capaciteit management (max 230, automatisch naar wachtlijst)
 * - Volledig bewerkbaar: merchandise, pre/after party, dieetwensen, vieringen, etc.
 * - Manuele boeking toevoegen (regulier + gratis/genodigde)
 * - Real-time capaciteit monitoring per event
 */

import { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard,
  CalendarClock,
  CalendarRange,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  Package,
  Euro,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  CheckCheck,
  XCircle,
  X,
  Send,
  Download,
  RefreshCw,
  Loader2,
  Archive,
  Trash2,
  FileEdit,
  Ban,
  Plus
} from 'lucide-react';
import { cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import type { AddOns, Arrangement, Event, PaymentSummary } from '../../types';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getWeek, getMonth, getYear } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '../Toast';
import { CompactManualBookingForm } from './CompactManualBookingForm';
import { TagConfigService } from '../../services/tagConfigService';
import type { ReservationTag } from '../../types';

// Import nieuwe utilities en hooks
import {
  CAPACITY_THRESHOLDS,
  CONFIRMATION_MESSAGES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TAB_FILTERS,
  VIEW_MODES,
  PAYMENT_STATUS_FILTERS,
  PAYMENT_DEFAULTS,
  REFUND_DEFAULTS
} from './reservations/constants';

import {
  convertFirestoreDate,
  validatePaymentAmount,
  generatePaymentId,
  generateRefundId,
  filterActiveReservations,
  filterActiveEvents
} from './reservations/utils';

import { useReservationHandlers } from './reservations/useReservationHandlers';
import { useReservationFilters } from './reservations/useReservationFilters';
import { useReservationStats } from './reservations/useReservationStats';
import { useBulkActions } from './reservations/useBulkActions';

// Import financial helpers
import { 
  getTotalAmount, 
  getTotalPaid, 
  getTotalRefunded, 
  getNetRevenue, 
  getOutstandingBalance,
  getPaymentStatus,
  getPaymentStatusLabel 
} from '../../utils/financialHelpers';

// ============================================================================
// TYPES
// ============================================================================

type MainTab = 'reserveringen' | 'betalingen' | 'opties' | 'archief';

type ReserveringenSubTab = 'dashboard' | 'pending' | 'confirmed' | 'all' | 'today' | 'week' | 'month';

type BetalingenSubTab = 'overview' | 'overdue' | 'unpaid' | 'partial' | 'history';

type OptiesSubTab = 'overview' | 'expiring' | 'expired' | 'all';

type DateFilter = 
  | { type: 'all' }
  | { type: 'day'; date: Date }
  | { type: 'week'; weekStart: Date; weekEnd: Date }
  | { type: 'month'; month: number; year: number };

interface CapacityInfo {
  current: number;
  max: number;
  percentage: number;
  isNearLimit: boolean;  // > 200 gasten
  isAtLimit: boolean;    // >= 230 gasten
  shouldUseWaitlist: boolean;
}

// ============================================================================
// TAG BADGE HELPER
// ============================================================================

const TagBadge: React.FC<{ tag: ReservationTag }> = ({ tag }) => {
  const tagConfig = TagConfigService.getDefaultTagConfigs().find(t => t.id === tag);
  
  if (!tagConfig) return null;
  
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase rounded-lg shadow-sm"
      style={{
        backgroundColor: `${tagConfig.color}20`,
        color: tagConfig.color,
        borderLeft: `3px solid ${tagConfig.color}`
      }}
    >
      {tagConfig.label}
    </span>
  );
};

interface QuickStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

const getWeekId = (date: Date) => `W${getWeek(date, { weekStartsOn: 1 })}-${getYear(date)}`;
const getMonthId = (date: Date) => `M${getMonth(date) + 1}-${getYear(date)}`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReservationsDashboard: React.FC = () => {
  const { 
    reservations, 
    loadReservations, 
    confirmReservation, 
    rejectReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    isLoadingReservations 
  } = useReservationsStore();
  const { events, loadEvents } = useEventsStore();
  const { merchandiseItems, loadMerchandise, addOns, eventTypesConfig, pricing, loadConfig } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEmailMenu, setShowEmailMenu] = useState(false);
  
  // Multi-select state
  const [selectedReservationIds, setSelectedReservationIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [mainTab, setMainTab] = useState<MainTab>('reserveringen');
  const [reserveringenTab, setReserveringenTab] = useState<ReserveringenSubTab>('dashboard');
  const [betalingenTab, setBetalingenTab] = useState<BetalingenSubTab>('overview');
  const [optiesTab, setOptiesTab] = useState<OptiesSubTab>('overview');
  
  // ✨ NEW: Advanced Filters
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Edit state
  const [editData, setEditData] = useState<any>(null);

  // Payment Modal State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCategory, setPaymentCategory] = useState<'arrangement' | 'merchandise' | 'full' | 'other'>('full');
  const [paymentMethod, setPaymentMethod] = useState('Bankoverschrijving');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Refund Modal State
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Annulering');
  const [refundMethod, setRefundMethod] = useState('Bankoverschrijving');
  const [refundNote, setRefundNote] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // ✨ NEW: Option Approval Modal State
  const [showOptionApprovalModal, setShowOptionApprovalModal] = useState(false);
  const [approvalArrangement, setApprovalArrangement] = useState<Arrangement>('BWF');
  const [approvalPreDrink, setApprovalPreDrink] = useState(false);
  const [approvalAfterParty, setApprovalAfterParty] = useState(false);
  const [approvalMerchandise, setApprovalMerchandise] = useState<{ enabled: boolean; quantity: number }>({
    enabled: false,
    quantity: 0
  });
  const [approvalDietaryNeeds, setApprovalDietaryNeeds] = useState('');
  const [approvalCelebrations, setApprovalCelebrations] = useState<string[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // ✨ NEW: Merge Reservations Modal State (November 2025)
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);

  // Get selected reservation data
  const selectedReservation = selectedReservationId 
    ? reservations.find(r => r.id === selectedReservationId) 
    : null;

  // Debug logging
  useEffect(() => {
    if (selectedReservationId) {
      console.log('🔍 Selected Reservation ID:', selectedReservationId);
      console.log('📋 Found Reservation:', selectedReservation);
    }
  }, [selectedReservationId, selectedReservation]);

  // Initialize payment amount when modal opens
  useEffect(() => {
    if (showPaymentModal && selectedReservation) {
      const paymentSummary = calculatePaymentSummary(selectedReservation);
      setPaymentAmount(paymentSummary.balance.toString());
    }
  }, [showPaymentModal, selectedReservation]);

  // Reset modal state when closing
  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentAmount('');
      setPaymentCategory('full');
      setPaymentMethod('Bankoverschrijving');
      setPaymentReference('');
      setPaymentNote('');
    }
  }, [showPaymentModal]);

  useEffect(() => {
    if (!showRefundModal) {
      setRefundAmount('');
      setRefundReason('Annulering');
      setRefundMethod('Bankoverschrijving');
      setRefundNote('');
    }
  }, [showRefundModal]);

  // Close email menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmailMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.email-menu-container')) {
          setShowEmailMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmailMenu]);

  // Payment Handler
  const handleRegisterPayment = async () => {
    console.log('💰 handleRegisterPayment called', { 
      selectedReservation: selectedReservation?.id,
      paymentAmount,
      paymentCategory,
      paymentMethod 
    });

    if (!selectedReservation) {
      console.error('❌ No selected reservation');
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount:', paymentAmount);
      showError('Voer een geldig bedrag in');
      return;
    }

    console.log('✅ Validation passed, processing payment...');
    setIsProcessingPayment(true);
    try {
      // Create payment object without undefined values (Firestore doesn't allow undefined)
      const newPayment: any = {
        id: `PAY-${Date.now()}`,
        amount,
        category: paymentCategory,
        method: paymentMethod,
        date: new Date(),
        processedBy: 'Admin'
      };
      
      // Only add optional fields if they have values
      if (paymentReference?.trim()) {
        newPayment.reference = paymentReference.trim();
      }
      if (paymentNote?.trim()) {
        newPayment.note = paymentNote.trim();
      }

      const updatedPayments = [...(selectedReservation.payments || []), newPayment];
      
      console.log('📝 Updating reservation with payment:', { 
        reservationId: selectedReservation.id,
        newPayment,
        totalPayments: updatedPayments.length 
      });

      // Convert all payment dates to proper Date objects for Firestore
      const paymentsForFirestore = updatedPayments.map(p => {
        const paymentDate = p.date instanceof Date 
          ? p.date 
          : p.date?.toDate 
            ? p.date.toDate() 
            : new Date(p.date);
        
        return {
          ...p,
          date: paymentDate
        };
      });

      console.log('🔥 Sending to Firestore:', { paymentsForFirestore });

      // Calculate new payment status
      const totalAmount = getTotalAmount(selectedReservation);
      const totalPaid = paymentsForFirestore.reduce((sum, p) => sum + p.amount, 0);
      const newPaymentStatus = totalPaid >= totalAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

      await updateReservation(selectedReservation.id, {
        payments: paymentsForFirestore,
        paymentStatus: newPaymentStatus
      });

      console.log('✅ Payment saved (status:', newPaymentStatus, '), reloading reservations...');
      await loadReservations();
      
      // Get fresh reservation data with the new payment
      const updatedReservation = reservations.find(r => r.id === selectedReservation.id) || selectedReservation;
      
      // Create updated reservation object with new payment for email
      const reservationForEmail = {
        ...updatedReservation,
        payments: paymentsForFirestore
      };
      
      // Send payment confirmation email
      const event = events.find(e => e.id === selectedReservation.eventId);
      if (event) {
        try {
          console.log('📧 Sending payment confirmation email...');
          const { emailService } = await import('../../services/emailService');
          await emailService.sendPaymentConfirmation(reservationForEmail, event);
          console.log('✅ Payment confirmation email sent to:', reservationForEmail.email);
        } catch (emailError) {
          console.error('⚠️ Could not send payment confirmation email:', emailError);
          console.error('Email error details:', emailError);
          // Don't fail the payment if email fails
        }
      } else {
        console.warn('⚠️ Event not found for email:', selectedReservation.eventId);
      }
      
      setShowPaymentModal(false);
      showSuccess(`Betaling van €${amount.toFixed(2)} geregistreerd!`);
  } catch (error) {
    console.error('❌ Error registering payment:', error);
    console.error('Error details:', { 
      message: error instanceof Error ? error.message : 'Unknown error',
      reservationId: selectedReservation?.id,
      paymentAmount: amount 
    });
    showError('Kon betaling niet registreren');
  } finally {
    setIsProcessingPayment(false);
  }
  };

  // ✨ NEW: Option Approval Handler - Opens modal to select arrangement
  const handleOpenApprovalModal = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setShowOptionApprovalModal(true);
  };

  // ✨ NEW: Complete Option Approval
  const handleApproveOption = async () => {
    if (!selectedReservation || selectedReservation.status !== 'option') {
      showError('Geen geldige optie geselecteerd');
      return;
    }

    if (!approvalArrangement) {
      showError('Selecteer een arrangement');
      return;
    }

    setIsProcessingApproval(true);
    try {
      // Calculate price based on selected arrangement and add-ons
      const event = events.find(e => e.id === selectedReservation.eventId);
      if (!event || !event.date) {
        showError('Event niet gevonden');
        return;
      }

      const eventData = typeof event.date === 'object' && 'pricing' in event.date ? event.date : null;
      if (!eventData || !eventData.pricing) {
        showError('Event pricing niet gevonden');
        return;
      }

      // Get pricing from event
      const eventPricing = eventData.pricing as Record<Arrangement, number>;
      const arrangementPrice = eventPricing[approvalArrangement] || 0;
      const merchandisePrice = approvalMerchandise.enabled ? (approvalMerchandise.quantity || 0) * 29.95 : 0;
      const afterPartyPrice = approvalAfterParty ? 7.50 : 0;

      const totalPrice = (arrangementPrice + afterPartyPrice) * selectedReservation.numberOfPersons + merchandisePrice;

      // Update reservation to confirmed status with full details
      await updateReservation(selectedReservation.id, {
        status: 'confirmed',
        arrangement: approvalArrangement,
        totalPrice,
        updatedAt: new Date(),
        // Add to communication log
        communicationLog: [
          ...(selectedReservation.communicationLog || []),
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note',
            message: `✅ OPTIE GOEDGEKEURD door admin\nArrangement: ${approvalArrangement}${approvalNotes ? `\nNotities: ${approvalNotes}` : ''}`,
            author: 'Admin'
          }
        ]
      });

      await loadReservations();
      setShowOptionApprovalModal(false);
      setSelectedReservationId(null);
      showSuccess(`Optie goedgekeurd en omgezet naar volledige boeking (€${totalPrice.toFixed(2)})`);

      // Reset approval modal state
      setApprovalArrangement('BWF');
      setApprovalPreDrink(false);
      setApprovalAfterParty(false);
      setApprovalMerchandise({ enabled: false, quantity: 0 });
      setApprovalDietaryNeeds('');
      setApprovalCelebrations([]);
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving option:', error);
      showError('Kon optie niet goedkeuren');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // ✨ NEW: Option Rejection Handler
  const handleRejectOption = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'option') {
      showError('Geen geldige optie geselecteerd');
      return;
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je de optie voor ${reservation.companyName || reservation.firstName + ' ' + reservation.lastName} wilt afwijzen?\n\nDe optie wordt verplaatst naar het archief.`
    );

    if (!confirmed) return;

    try {
      await updateReservation(reservationId, {
        status: 'rejected',
        updatedAt: new Date(),
        communicationLog: [
          ...(reservation.communicationLog || []),
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note',
            message: '❌ OPTIE AFGEWEZEN door admin',
            author: 'Admin'
          }
        ]
      });

      await loadReservations();
      showSuccess('Optie afgewezen en verplaatst naar archief');
    } catch (error) {
      console.error('Error rejecting option:', error);
      showError('Kon optie niet afwijzen');
    }
  };

  // Refund Handler
  const handleCreateRefund = async () => {
    if (!selectedReservation) return;    const amount = parseFloat(refundAmount);
    const paymentSummary = calculatePaymentSummary(selectedReservation);
    
    if (isNaN(amount) || amount <= 0) {
      showError('Voer een geldig bedrag in');
      return;
    }

    if (amount > paymentSummary.totalPaid) {
      showError('Restitutie bedrag kan niet hoger zijn dan betaald bedrag');
      return;
    }

    if (!refundNote.trim()) {
      showError('Notitie is verplicht voor audit trail');
      return;
    }

    setIsProcessingRefund(true);
    try {
      const newRefund: any = {
        id: `REF-${Date.now()}`,
        amount,
        reason: refundReason,
        method: refundMethod,
        note: refundNote.trim(),
        date: new Date(),
        processedBy: 'Admin'
      };

      const updatedRefunds = [...(selectedReservation.refunds || []), newRefund];
      
      // Convert all refund dates to proper Date objects for Firestore
      const refundsForFirestore = updatedRefunds.map(r => {
        const refundDate = r.date instanceof Date 
          ? r.date 
          : r.date?.toDate 
            ? r.date.toDate() 
            : new Date(r.date);
        
        return {
          ...r,
          date: refundDate
        };
      });

      // Calculate new payment status after refund
      const totalAmount = getTotalAmount(selectedReservation);
      const totalPaid = (selectedReservation.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = refundsForFirestore.reduce((sum, r) => sum + r.amount, 0);
      const netRevenue = totalPaid - totalRefunded;
      
      let newPaymentStatus = 'pending';
      if (totalRefunded > 0) {
        newPaymentStatus = 'refunded';
      } else if (netRevenue >= totalAmount) {
        newPaymentStatus = 'paid';
      } else if (netRevenue > 0) {
        newPaymentStatus = 'partial';
      }

      await updateReservation(selectedReservation.id, {
        refunds: refundsForFirestore,
        paymentStatus: newPaymentStatus
      });

      await loadReservations();
      setShowRefundModal(false);
      showSuccess(`Restitutie van €${amount.toFixed(2)} geregistreerd!`);
    } catch (error) {
      console.error('Error creating refund:', error);
      showError('Kon restitutie niet registreren');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Multi-select handlers
  const toggleSelectReservation = (id: string) => {
    setSelectedReservationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (reservations: any[]) => {
    if (selectedReservationIds.size === reservations.length) {
      setSelectedReservationIds(new Set());
    } else {
      setSelectedReservationIds(new Set(reservations.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReservationIds.size === 0) return;
    
    const confirmed = window.confirm(`Weet je zeker dat je ${selectedReservationIds.size} reservering(en) wilt verwijderen?`);
    if (!confirmed) return;

    try {
      for (const id of selectedReservationIds) {
        await deleteReservation(id);
      }
      showSuccess(`${selectedReservationIds.size} reservering(en) verwijderd`);
      setSelectedReservationIds(new Set());
    } catch (error) {
      showError('Fout bij verwijderen van reserveringen');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedReservationIds.size === 0) return;
    
    const confirmed = window.confirm(`Weet je zeker dat je ${selectedReservationIds.size} reservering(en) wilt markeren als volledig betaald?`);
    if (!confirmed) return;

    try {
      for (const id of selectedReservationIds) {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) continue;
        
        const summary = calculatePaymentSummary(reservation);
        if (summary.balance > 0) {
          const newPayment = {
            id: `PAY-${Date.now()}-${id}`,
            amount: summary.balance,
            category: 'full' as const,
            method: 'Bankoverschrijving',
            date: new Date(),
            processedBy: 'Admin (Bulk)',
            note: 'Bulk markering als betaald'
          };

          const updatedPayments = [...(reservation.payments || []), newPayment];
          const paymentsForFirestore = updatedPayments.map(p => {
            let paymentDate: Date;
            if (p.date instanceof Date) {
              paymentDate = p.date;
            } else if (p.date && typeof p.date === 'object' && 'toDate' in p.date) {
              paymentDate = (p.date as any).toDate();
            } else {
              paymentDate = new Date(p.date);
            }
            return { ...p, date: paymentDate };
          });

          await updateReservation(id, { payments: paymentsForFirestore as any });
        }
      }
      
      await loadReservations();
      showSuccess(`${selectedReservationIds.size} reservering(en) gemarkeerd als betaald`);
      setSelectedReservationIds(new Set());
    } catch (error) {
      showError('Fout bij markeren als betaald');
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedReservationIds.size === 0) return;
    
    const confirmed = window.confirm(`Weet je zeker dat je ${selectedReservationIds.size} reservering(en) wilt bevestigen?`);
    if (!confirmed) return;

    try {
      for (const id of selectedReservationIds) {
        await confirmReservation(id);
      }
      showSuccess(`${selectedReservationIds.size} reservering(en) bevestigd`);
      setSelectedReservationIds(new Set());
    } catch (error) {
      showError('Fout bij bevestigen van reserveringen');
    }
  };

  const handleBulkReject = async () => {
    if (selectedReservationIds.size === 0) return;
    
    const confirmed = window.confirm(`Weet je zeker dat je ${selectedReservationIds.size} reservering(en) wilt afwijzen?`);
    if (!confirmed) return;

    try {
      for (const id of selectedReservationIds) {
        await updateReservation(id, { status: 'rejected' });
      }
      showSuccess(`${selectedReservationIds.size} reservering(en) afgewezen`);
      setSelectedReservationIds(new Set());
    } catch (error) {
      showError('Fout bij afwijzen van reserveringen');
    }
  };

  // ✨ NEW: Open merge modal (November 2025)
  const handleOpenMergeModal = () => {
    if (selectedReservationIds.size < 2) {
      showError('Selecteer minimaal 2 reserveringen om samen te voegen');
      return;
    }

    // Validate: All must be for the same event
    const selectedReservations = reservations.filter(r => selectedReservationIds.has(r.id));
    const firstEventId = selectedReservations[0]?.eventId;
    const allSameEvent = selectedReservations.every(r => r.eventId === firstEventId);

    if (!allSameEvent) {
      showError('Alle reserveringen moeten voor hetzelfde event zijn');
      return;
    }

    // Default to first selected as primary
    setMergePrimaryId(Array.from(selectedReservationIds)[0]);
    setShowMergeModal(true);
  };

  // ✨ NEW: Execute merge (November 2025)
  const handleMergeReservations = async () => {
    if (!mergePrimaryId || selectedReservationIds.size < 2) return;

    const secondaryIds = Array.from(selectedReservationIds).filter(id => id !== mergePrimaryId);

    if (secondaryIds.length === 0) {
      showError('Selecteer ten minste één secundaire reservering');
      return;
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je ${secondaryIds.length} reservering(en) wilt samenvoegen in ${mergePrimaryId}?\n\n` +
      `De secundaire reserveringen worden geannuleerd en alle gegevens (gasten, notities, merchandise) worden samengevoegd.`
    );
    
    if (!confirmed) return;

    setIsProcessingMerge(true);
    try {
      const { mergeReservations } = useReservationsStore.getState();
      const success = await mergeReservations(mergePrimaryId, secondaryIds);

      if (success) {
        showSuccess(
          `✅ ${secondaryIds.length + 1} reserveringen samengevoegd!`,
          `Alle gegevens zijn gecombineerd in ${mergePrimaryId}`
        );
        setShowMergeModal(false);
        setSelectedReservationIds(new Set());
        await loadReservations();
        await loadEvents();
      } else {
        showError('Samenvoegen mislukt', 'Probeer het opnieuw');
      }
    } catch (error) {
      console.error('Merge error:', error);
      showError('Fout bij samenvoegen', error instanceof Error ? error.message : 'Onbekende fout');
    } finally {
      setIsProcessingMerge(false);
    }
  };

  // ✨ NEW: CSV Export Function
  const handleExportCSV = (reservationsToExport: any[]) => {
    try {
      // CSV Headers
      const headers = [
        'ID',
        'Status',
        'Naam',
        'Email',
        'Telefoon',
        'Bedrijf',
        'Event',
        'Event Datum',
        'Aantal Gasten',
        'Arrangement',
        'Pre-Drink',
        'After-Party',
        'Merchandise',
        'Totaal Prijs',
        'Betaal Status',
        'Betaald Bedrag',
        'Openstaand',
        'Gemaakt Op',
        'Notities'
      ].join(',');

      // CSV Rows
      const rows = reservationsToExport.map(r => {
        const event = activeEvents.find(e => e.id === r.eventId);
        const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;
        const paymentSummary = calculatePaymentSummary(r);
        
        return [
          r.id,
          r.status,
          `"${r.firstName} ${r.lastName}"`,
          r.email || '',
          r.phone || '',
          `"${r.companyName || ''}"`,
          event ? `"${event.type}"` : '',
          eventDate ? format(eventDate, 'dd-MM-yyyy', { locale: nl }) : '',
          r.numberOfPersons,
          r.arrangement || '',
          r.preDrink ? 'Ja' : 'Nee',
          r.afterParty ? 'Ja' : 'Nee',
          r.merchandise?.enabled ? `${r.merchandise.quantity}x` : 'Nee',
          r.totalPrice?.toFixed(2) || '0.00',
          paymentSummary.status,
          paymentSummary.totalPaid.toFixed(2),
          paymentSummary.balance.toFixed(2),
          r.createdAt ? format(r.createdAt instanceof Date ? r.createdAt : parseISO(r.createdAt as any), 'dd-MM-yyyy HH:mm', { locale: nl }) : '',
          `"${(r.notes || '').replace(/"/g, '""')}"` // Escape quotes
        ].join(',');
      }).join('\n');

      const csv = headers + '\n' + rows;
      
      // Create download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reserveringen_${format(new Date(), 'yyyy-MM-dd_HHmm', { locale: nl })}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess(`${reservationsToExport.length} reserveringen geëxporteerd naar CSV`);
    } catch (error) {
      console.error('CSV export error:', error);
      showError('Fout bij exporteren naar CSV');
    }
  };

  // Helper function to get arrangement price for a specific event
  const getArrangementPriceForEvent = (eventId: string, arrangement: Arrangement): number => {
    const eventData = events.find(e => e.id === eventId);
    
    if (!eventData) {
      console.warn('❌ Event not found:', eventId);
      return 0;
    }
    
    // Map Standard/Premium to BWF/BWFM (backward compatibility)
    // BWF = Standard, BWFM = Premium
    const arrangementMapping: Record<string, Arrangement[]> = {
      'Standard': ['Standard', 'BWF'],
      'Premium': ['Premium', 'BWFM'],
      'BWF': ['BWF', 'Standard'],
      'BWFM': ['BWFM', 'Premium']
    };
    
    const arrangementsToTry = arrangementMapping[arrangement] || [arrangement];
    
    // Priority 1: Check custom pricing on the event itself
    for (const arr of arrangementsToTry) {
      if (eventData.customPricing && eventData.customPricing[arr]) {
        console.log(`✅ Custom pricing: ${arr} = €${eventData.customPricing[arr]}`);
        return eventData.customPricing[arr]!;
      }
    }
    
    // Priority 2: Check eventTypesConfig.pricing based on event.type
    const eventTypeConfig = eventTypesConfig?.types.find(t => {
      if (t.key === eventData.type) return true;
      if (t.key.toLowerCase() === eventData.type.toLowerCase()) return true;
      return false;
    });
    
    if (!eventTypeConfig) {
      console.warn(`❌ No eventTypeConfig found for type: ${eventData.type}`);
      console.log('Available types:', eventTypesConfig?.types?.map(t => t.key));
      return 0;
    }
    
    if (!eventTypeConfig.pricing) {
      console.warn(`❌ No pricing in eventTypeConfig: ${eventTypeConfig.key}`);
      return 0;
    }
    
    // Try to get price with fallback to mapped arrangement
    for (const arr of arrangementsToTry) {
      const price = eventTypeConfig.pricing[arr];
      if (price !== undefined && price !== null && price > 0) {
        console.log(`✅ Price: ${eventTypeConfig.key}[${arr}] = €${price} (requested: ${arrangement})`);
        return price;
      }
    }
    
    console.warn(`❌ No price found for ${eventTypeConfig.key} with arrangements:`, arrangementsToTry);
    console.log('Available pricing:', eventTypeConfig.pricing);
    return 0;
  };

  // 💰 PAYMENT CALCULATOR - Calculate complete payment summary
  const calculatePaymentSummary = (reservation: any): PaymentSummary => {
    const payments = reservation.payments || [];
    const refunds = reservation.refunds || [];
    // ✅ Use getTotalAmount to get correct total including borrels/merchandise
    const totalPrice = getTotalAmount(reservation);
    
    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalRefunded = refunds.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    const balance = totalPrice - totalPaid + totalRefunded;
    const netRevenue = totalPaid - totalRefunded;
    
    // Calculate due date: 1 week before event
    const eventDate = reservation.eventDate instanceof Date 
      ? reservation.eventDate 
      : new Date(reservation.eventDate);
    const dueDate = reservation.paymentDueDate 
      ? (reservation.paymentDueDate instanceof Date ? reservation.paymentDueDate : new Date(reservation.paymentDueDate))
      : new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
    
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const isOverdue = daysUntilDue < 0 && balance > 0;
    
    // Determine status
    let status: 'unpaid' | 'partial' | 'paid' | 'overpaid' | 'overdue' = 'unpaid';
    if (isOverdue) {
      status = 'overdue';
    } else if (balance <= 0) {
      status = totalPaid > totalPrice ? 'overpaid' : 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    }
    
    return {
      totalPrice,
      totalPaid,
      totalRefunded,
      balance,
      netRevenue,
      status,
      dueDate,
      daysUntilDue,
      isOverdue,
      payments,
      refunds
    };
  };

  // Get payment status badge configuration
  const getPaymentStatusBadge = (summary: PaymentSummary) => {
    const configs = {
      unpaid: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700', icon: '🔴', label: 'Onbetaald' },
      partial: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700', icon: '🟡', label: 'Deelbetaling' },
      paid: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700', icon: '🟢', label: 'Betaald' },
      overpaid: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700', icon: '🔵', label: 'Teveel Betaald' },
      overdue: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700', icon: '🔴', label: 'Te Laat!' }
    };
    return configs[summary.status];
  };

  // Export payment data to CSV (Phase 5)
  const exportPaymentsToCSV = () => {
    const allPayments = activeReservations
      .filter(r => r.payments && r.payments.length > 0)
      .flatMap(r => 
        (r.payments || []).map(p => {
          const payment = p as any;
          const paymentDate = payment.date instanceof Date 
            ? payment.date 
            : payment.date?.toDate 
              ? payment.date.toDate() 
              : new Date(payment.date);
          return {
            Datum: format(paymentDate, 'dd-MM-yyyy HH:mm', { locale: nl }),
            Bedrijf: r.companyName,
            Contactpersoon: r.contactPerson,
            Email: r.email,
            Bedrag: payment.amount.toFixed(2),
            Categorie: payment.category || 'Niet gespecificeerd',
            Methode: payment.method,
            Referentie: payment.reference || '-',
            Notitie: payment.note || '-',
            Verwerkt_door: payment.processedBy || 'Systeem'
          };
        })
      );

    if (allPayments.length === 0) {
      showError('Geen betalingen om te exporteren');
      return;
    }

    const headers = Object.keys(allPayments[0]);
    const csvContent = [
      headers.join(','),
      ...allPayments.map(payment => 
        headers.map(header => `"${payment[header as keyof typeof payment]}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `betalingen-export-${format(new Date(), 'yyyy-MM-dd', { locale: nl })}.csv`;
    link.click();
    
    showSuccess(`${allPayments.length} betalingen geëxporteerd!`);
  };

  // Export refunds to CSV
  const exportRefundsToCSV = () => {
    const allRefunds = activeReservations
      .filter(r => r.refunds && r.refunds.length > 0)
      .flatMap(r => 
        (r.refunds || []).map(ref => {
          const refund = ref as any;
          const refundDate = refund.date instanceof Date 
            ? refund.date 
            : refund.date?.toDate 
              ? refund.date.toDate() 
              : new Date(refund.date);
          return {
            Datum: format(refundDate, 'dd-MM-yyyy HH:mm', { locale: nl }),
            Bedrijf: r.companyName,
            Contactpersoon: r.contactPerson,
            Email: r.email,
            Bedrag: refund.amount.toFixed(2),
            Reden: refund.reason,
            Methode: refund.method,
            Notitie: refund.note || '-',
            Verwerkt_door: refund.processedBy || 'Systeem'
          };
        })
      );

    if (allRefunds.length === 0) {
      showError('Geen restituties om te exporteren');
      return;
    }

    const headers = Object.keys(allRefunds[0]);
    const csvContent = [
      headers.join(','),
      ...allRefunds.map(refund => 
        headers.map(header => `"${refund[header as keyof typeof refund]}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `restituties-export-${format(new Date(), 'yyyy-MM-dd', { locale: nl })}.csv`;
    link.click();
    
    showSuccess(`${allRefunds.length} restituties geëxporteerd!`);
  };

  // Export outstanding payments report
  const exportOutstandingPaymentsReport = () => {
    const outstanding = activeReservations
      .map(r => ({ reservation: r, summary: calculatePaymentSummary(r) }))
      .filter(({ summary }) => summary.balance > 0)
      .map(({ reservation, summary }) => {
        const eventDate = reservation.eventDate instanceof Date ? reservation.eventDate : new Date(reservation.eventDate);
        return {
          Status: summary.isOverdue ? 'TE LAAT' : 'Openstaand',
          Bedrijf: reservation.companyName,
          Contactpersoon: reservation.contactPerson,
          Email: reservation.email,
          Telefoon: reservation.phone || '-',
          Event_Datum: format(eventDate, 'dd-MM-yyyy', { locale: nl }),
          Totaal: getTotalAmount(reservation).toFixed(2),
          Betaald: summary.totalPaid.toFixed(2),
          Openstaand: summary.balance.toFixed(2),
          Betaal_Voor: format(summary.dueDate!, 'dd-MM-yyyy', { locale: nl }),
          Dagen_Tot_Deadline: summary.daysUntilDue
        };
      })
      .sort((a, b) => (a.Dagen_Tot_Deadline || 0) - (b.Dagen_Tot_Deadline || 0));

    if (outstanding.length === 0) {
      showError('Geen openstaande betalingen om te exporteren');
      return;
    }

    const headers = Object.keys(outstanding[0]);
    const csvContent = [
      headers.join(','),
      ...outstanding.map(item => 
        headers.map(header => `"${item[header as keyof typeof item]}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `openstaande-betalingen-${format(new Date(), 'yyyy-MM-dd', { locale: nl })}.csv`;
    link.click();
    
    showSuccess(`${outstanding.length} openstaande betalingen geëxporteerd!`);
  };

  // Check if reservation is expiring soon (within 7 days)
  const isExpiringSoon = (reservation: any): boolean => {
    if (reservation.status !== 'option') return false;
    if (!reservation.optionExpiresAt) return false;
    
    const expiryDate = reservation.optionExpiresAt instanceof Date 
      ? reservation.optionExpiresAt 
      : new Date(reservation.optionExpiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  // Check if reservation is expired
  const isExpired = (reservation: any): boolean => {
    if (reservation.status !== 'option') return false;
    if (!reservation.optionExpiresAt) return false;
    
    const expiryDate = reservation.optionExpiresAt instanceof Date 
      ? reservation.optionExpiresAt 
      : new Date(reservation.optionExpiresAt);
    const now = new Date();
    
    return now > expiryDate;
  };

  // Helper function to get merchandise item details
  const getMerchandiseItemDetails = (itemId: string, itemName?: string) => {
    console.log('🔍 [Merchandise] Looking for:', { itemId, itemName });
    console.log('📦 [Merchandise] Available items:', merchandiseItems.map(m => ({ id: m.id, name: m.name })));
    
    // First try by ID
    let product = merchandiseItems.find(m => m.id === itemId);
    console.log('🎯 [Merchandise] Found by ID:', product?.name || 'NOT FOUND');
    
    // If not found by ID, try by name (case-insensitive)
    if (!product && itemName) {
      product = merchandiseItems.find(m => 
        m.name.toLowerCase() === itemName.toLowerCase()
      );
      console.log('🎯 [Merchandise] Found by name:', product?.name || 'NOT FOUND');
    }
    
    // If still not found, try partial name match
    if (!product && itemName) {
      product = merchandiseItems.find(m => 
        m.name.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(m.name.toLowerCase())
      );
      console.log('🎯 [Merchandise] Found by partial match:', product?.name || 'NOT FOUND');
    }
    
    return product;
  };

  // Initialize edit data when entering edit mode
  useEffect(() => {
    if (isEditMode && selectedReservation && !editData) {
      setEditData({
        eventId: selectedReservation.eventId,
        numberOfPersons: selectedReservation.numberOfPersons,
        arrangement: selectedReservation.arrangement,
        preDrink: selectedReservation.preDrink || { enabled: false, quantity: 0 },
        afterParty: selectedReservation.afterParty || { enabled: false, quantity: 0 },
        merchandise: selectedReservation.merchandise || [],
        dietaryRequirements: selectedReservation.dietaryRequirements || {
          vegetarian: false,
          vegetarianCount: 0,
          vegan: false,
          veganCount: 0,
          glutenFree: false,
          glutenFreeCount: 0,
          lactoseFree: false,
          lactoseFreeCount: 0,
          other: ''
        },
        partyPerson: selectedReservation.partyPerson || '',
        celebrationOccasion: selectedReservation.celebrationOccasion || '',
        celebrationDetails: selectedReservation.celebrationDetails || '',
        comments: selectedReservation.comments || ''
      });
    } else if (!isEditMode) {
      setEditData(null);
    }
  }, [isEditMode, selectedReservation, editData]);

  // Auto-recalculate price when editData changes (live price updates)
  useEffect(() => {
    if (isEditMode && editData) {
      // Price is recalculated automatically via recalculatePrice() in the UI
      // This effect could be used for additional side effects if needed
      console.log('💰 Price recalc triggered by:', {
        eventId: editData.eventId,
        arrangement: editData.arrangement,
        persons: editData.numberOfPersons
      });
    }
  }, [editData?.eventId, editData?.numberOfPersons, editData?.arrangement, editData?.preDrink, editData?.afterParty, editData?.merchandise]);

  // Check if edit changes exceed capacity
  const checkEditCapacity = () => {
    if (!selectedReservation || !editData) return { ok: true, message: '' };
    
    const event = events.find(e => e.id === selectedReservation.eventId);
    if (!event) return { ok: true, message: '' };

    // Calculate new capacity if numberOfPersons changed
    const originalPersons = selectedReservation.numberOfPersons;
    const newPersons = editData.numberOfPersons;
    const personsDelta = newPersons - originalPersons;
    
    if (personsDelta === 0) {
      return { ok: true, message: '' };
    }

    // Get current capacity for this event
    const capacityInfo = getEventCapacity(event.id);
    const newTotal = capacityInfo.current + personsDelta;
    
    if (newTotal > 230) {
      return { 
        ok: false, 
        message: `Let op: Deze wijziging brengt het totaal op ${newTotal} gasten (limiet: 230). Event zou vol zijn!` 
      };
    } else if (newTotal > 200) {
      return { 
        ok: true, 
        message: `Waarschuwing: Deze wijziging brengt het totaal op ${newTotal} gasten (${Math.round((newTotal/230)*100)}% van capaciteit).` 
      };
    }
    
    return { ok: true, message: '' };
  };

  // Recalculate price based on edit data
  const recalculatePrice = () => {
    if (!selectedReservation || !editData) return selectedReservation?.totalPrice || 0;
    
    const pricingSnapshot = selectedReservation.pricingSnapshot;
    if (!pricingSnapshot) return selectedReservation.totalPrice;

    let total = 0;
    
    // 1. ARRANGEMENT PRICE - Get from CURRENT event in editData (may have changed!)
    const currentEventId = editData.eventId || selectedReservation.eventId;
    const eventData = events.find(e => e.id === currentEventId) as Event | undefined;
    let arrangementPricePerPerson = 0;
    
    // Use helper function to get correct price
    arrangementPricePerPerson = getArrangementPriceForEvent(currentEventId, editData.arrangement as Arrangement);
    
    console.log('🎯 Price calculation:', {
      eventId: currentEventId,
      arrangement: editData.arrangement,
      price: arrangementPricePerPerson,
      eventType: eventData?.type
    });
    
    // Fallback to original pricing if event not found or no pricing available
    if (!arrangementPricePerPerson) {
      arrangementPricePerPerson = (pricingSnapshot as any).breakdown?.arrangement?.pricePerPerson || 
                                  pricingSnapshot.pricePerPerson || 
                                  (pricingSnapshot.basePrice / selectedReservation.numberOfPersons);
    }
    
    total += arrangementPricePerPerson * editData.numberOfPersons;
    
    // 2. PRE-DRINK - Use addOns pricing from configStore
    if (editData.preDrink?.enabled && addOns?.preDrink) {
      const preDrinkPrice = addOns.preDrink.pricePerPerson;
      total += preDrinkPrice * editData.preDrink.quantity;
    }
    
    // 3. AFTER-PARTY - Use addOns pricing from configStore
    if (editData.afterParty?.enabled && addOns?.afterParty) {
      const afterPartyPrice = addOns.afterParty.pricePerPerson;
      total += afterPartyPrice * editData.afterParty.quantity;
    }
    
    // 4. MERCHANDISE - Use getMerchandiseItemDetails for accurate pricing
    if (editData.merchandise && editData.merchandise.length > 0) {
      const merchTotal = editData.merchandise.reduce((sum: number, item: any) => {
        const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
        const price = productDetails?.price || item.price || 0;
        return sum + (price * item.quantity);
      }, 0);
      total += merchTotal;
    }
    
    // 5. DISCOUNT
    if (pricingSnapshot.discountAmount) {
      total -= pricingSnapshot.discountAmount;
    }
    
    return total;
  };

  // Get summary of changes
  const getChangesSummary = () => {
    if (!selectedReservation || !editData) return [];
    
    const changes: string[] = [];
    
    // Event/Date change
    if (editData.eventId !== selectedReservation.eventId) {
      const oldEvent = events.find(e => e.id === selectedReservation.eventId);
      const newEvent = events.find(e => e.id === editData.eventId);
      if (oldEvent && newEvent) {
        const oldDate = oldEvent.date instanceof Date ? oldEvent.date : parseISO(oldEvent.date as any);
        const newDate = newEvent.date instanceof Date ? newEvent.date : parseISO(newEvent.date as any);
        changes.push(`Event datum: ${format(oldDate, 'dd MMM yyyy', { locale: nl })} → ${format(newDate, 'dd MMM yyyy', { locale: nl })}`);
      }
    }
    
    if (editData.numberOfPersons !== selectedReservation.numberOfPersons) {
      changes.push(`Aantal personen: ${selectedReservation.numberOfPersons} → ${editData.numberOfPersons}`);
    }
    
    if (editData.arrangement !== selectedReservation.arrangement) {
      const oldPrice = (selectedReservation.pricingSnapshot as any)?.breakdown?.arrangement?.pricePerPerson || 0;
      const newPrice = getArrangementPriceForEvent(editData.eventId, editData.arrangement as Arrangement);
      changes.push(`Arrangement: ${selectedReservation.arrangement} (€${oldPrice}) → ${editData.arrangement} (€${newPrice})`);
    }
    
    if (editData.preDrink?.enabled !== selectedReservation.preDrink?.enabled) {
      changes.push(`Pre-drink: ${selectedReservation.preDrink?.enabled ? 'Aan' : 'Uit'} → ${editData.preDrink?.enabled ? 'Aan' : 'Uit'}`);
    } else if (editData.preDrink?.enabled && editData.preDrink?.quantity !== selectedReservation.preDrink?.quantity) {
      changes.push(`Pre-drink aantal: ${selectedReservation.preDrink?.quantity} → ${editData.preDrink?.quantity}`);
    }
    
    if (editData.afterParty?.enabled !== selectedReservation.afterParty?.enabled) {
      changes.push(`After-party: ${selectedReservation.afterParty?.enabled ? 'Aan' : 'Uit'} → ${editData.afterParty?.enabled ? 'Aan' : 'Uit'}`);
    } else if (editData.afterParty?.enabled && editData.afterParty?.quantity !== selectedReservation.afterParty?.quantity) {
      changes.push(`After-party aantal: ${selectedReservation.afterParty?.quantity} → ${editData.afterParty?.quantity}`);
    }
    
    const originalPrice = getTotalAmount(selectedReservation) || 0;
    const newPrice = recalculatePrice();
    if (Math.abs(newPrice - originalPrice) > 0.01) {
      changes.push(`Totaalprijs: €${originalPrice.toFixed(2)} → €${newPrice.toFixed(2)}`);
    }
    
    return changes;
  };

  // Save edit changes
  const handleSaveEdit = async () => {
    if (!selectedReservation || !editData) return;

    // Check capacity before saving
    const capacityCheck = checkEditCapacity();
    if (!capacityCheck.ok) {
      const confirmSave = confirm(`${capacityCheck.message}\n\nToch opslaan?`);
      if (!confirmSave) return;
    }

    // Show summary of changes
    const changes = getChangesSummary();
    if (changes.length > 0 && capacityCheck.ok) {
      const changesList = changes.map(c => `• ${c}`).join('\n');
      const confirmSave = confirm(`Volgende wijzigingen worden opgeslagen:\n\n${changesList}\n\nDoorgaan?`);
      if (!confirmSave) return;
    }

    setProcessingIds(prev => new Set(prev).add(selectedReservation.id));
    try {
      // Calculate new pricing
      const newTotalPrice = recalculatePrice();
      
      // Build updated pricing snapshot
      const eventData = events.find(e => e.id === selectedReservation.eventId);
      let arrangementPricePerPerson = 0;
      
      if (eventData) {
        const arrangement = editData.arrangement as Arrangement;
        if (eventData.customPricing && eventData.customPricing[arrangement]) {
          arrangementPricePerPerson = eventData.customPricing[arrangement]!;
        } else {
          const eventTypeConfig = eventTypesConfig?.types.find(t => t.key === eventData.type);
          if (eventTypeConfig?.pricing) {
            arrangementPricePerPerson = eventTypeConfig.pricing[arrangement] || 0;
          }
        }
      }
      
      if (!arrangementPricePerPerson && selectedReservation.pricingSnapshot) {
        arrangementPricePerPerson = (selectedReservation.pricingSnapshot as any).breakdown?.arrangement?.pricePerPerson || 
                                    selectedReservation.pricingSnapshot.pricePerPerson || 0;
      }
      
      // Calculate merchandise total
      const merchandiseTotal = editData.merchandise.reduce((sum: number, item: any) => {
        const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
        const price = productDetails?.price || item.price || 0;
        return sum + (price * item.quantity);
      }, 0);
      
      const updatedPricingSnapshot: any = {
        ...selectedReservation.pricingSnapshot,
        pricePerPerson: arrangementPricePerPerson,
        breakdown: {
          arrangement: {
            persons: editData.numberOfPersons,
            pricePerPerson: arrangementPricePerPerson,
            total: arrangementPricePerPerson * editData.numberOfPersons,
            type: editData.arrangement
          },
          merchandise: {
            items: editData.merchandise.map((item: any) => {
              const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
              return {
                itemId: item.itemId || item.id,
                name: productDetails?.name || item.name,
                quantity: item.quantity,
                pricePerItem: productDetails?.price || item.price || 0,
                total: (productDetails?.price || item.price || 0) * item.quantity
              };
            }),
            total: merchandiseTotal
          }
        },
        preDrinkPrice: addOns?.preDrink?.pricePerPerson || 0,
        preDrinkTotal: editData.preDrink.enabled ? (addOns?.preDrink?.pricePerPerson || 0) * editData.preDrink.quantity : 0,
        afterPartyPrice: addOns?.afterParty?.pricePerPerson || 0,
        afterPartyTotal: editData.afterParty.enabled ? (addOns?.afterParty?.pricePerPerson || 0) * editData.afterParty.quantity : 0,
        merchandiseTotal: merchandiseTotal,
        basePrice: arrangementPricePerPerson * editData.numberOfPersons,
        totalPrice: newTotalPrice
      };
      
      // Get new event date if event changed
      const newEvent = events.find(e => e.id === editData.eventId);
      const newEventDate = newEvent?.date;
      
      // Recalculate payment status based on new total price
      const totalPaid = (selectedReservation.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = (selectedReservation.refunds || []).reduce((sum, r) => sum + r.amount, 0);
      const netRevenue = totalPaid - totalRefunded;
      
      let newPaymentStatus = 'pending';
      if (totalRefunded > 0) {
        newPaymentStatus = 'refunded';
      } else if (netRevenue >= newTotalPrice) {
        newPaymentStatus = 'paid';
      } else if (netRevenue > 0) {
        newPaymentStatus = 'partial';
      }
      
      const updates = {
        eventId: editData.eventId,
        eventDate: newEventDate,
        numberOfPersons: editData.numberOfPersons,
        arrangement: editData.arrangement,
        preDrink: editData.preDrink,
        afterParty: editData.afterParty,
        merchandise: editData.merchandise,
        dietaryRequirements: editData.dietaryRequirements,
        partyPerson: editData.partyPerson,
        celebrationOccasion: editData.celebrationOccasion,
        celebrationDetails: editData.celebrationDetails,
        comments: editData.comments,
        totalPrice: newTotalPrice,
        pricingSnapshot: updatedPricingSnapshot,
        paymentStatus: newPaymentStatus
      };
      
      // Update via reservations store
      const success = await updateReservation(selectedReservation.id, updates, selectedReservation);
      
      if (!success) {
        throw new Error('Update failed');
      }
      
      showSuccess(`Reservering bijgewerkt! ${changes.length} wijziging${changes.length !== 1 ? 'en' : ''} opgeslagen.`);
      setIsEditMode(false);
      setEditData(null);
      await loadReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      showError('Kon reservering niet bijwerken');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(selectedReservation.id);
        return next;
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🔄 [RD] Loading data...');
    loadReservations();
    loadEvents();
    loadMerchandise();
    loadConfig().then(() => {
      console.log('✅ [RD] Config loaded successfully');
    }); // Load config including eventTypesConfig for pricing
  }, []); // Empty dependency array - only run once on mount
  
  // Log eventTypesConfig whenever it changes
  useEffect(() => {
    console.log('📋 [RD] EventTypesConfig updated:');
    console.log('  - Config exists?', !!eventTypesConfig);
    console.log('  - Has types array?', !!eventTypesConfig?.types);
    if (eventTypesConfig?.types) {
      console.log('  - Number of types:', eventTypesConfig.types.length);
      console.log('  - Available event types:', eventTypesConfig.types.map(t => t.key));
      console.log('  - Full event types with pricing:');
      eventTypesConfig.types.forEach(type => {
        console.log(`    ${type.key}:`, type.pricing);
      });
    } else {
      console.error('  ❌ eventTypesConfig.types is NULL/UNDEFINED!');
    }
  }, [eventTypesConfig]);

  // Handler voor bevestigen
  const handleConfirm = async (reservationId: string) => {
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      // Get reservation and event data before confirming
      const reservation = activeReservations.find(r => r.id === reservationId);
      const event = reservation ? events.find(e => e.id === reservation.eventId) : null;
      
      const success = await confirmReservation(reservationId);
      if (success) {
        showSuccess('Reservering bevestigd!');
        
        // Send booking confirmed email (different from initial confirmation)
        if (reservation && event) {
          try {
            const { emailService } = await import('../../services/emailService');
            await emailService.sendBookingConfirmed(reservation, event);
            console.log('✅ Booking confirmed email sent');
          } catch (emailError) {
            console.error('⚠️ Could not send booking confirmed email:', emailError);
            // Don't fail the confirmation if email fails
          }
        }
      } else {
        showError('Kon reservering niet bevestigen');
      }
    } catch (error) {
      console.error('Error confirming reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor afwijzen
  const handleReject = async (reservationId: string) => {
    const reason = prompt('Reden voor afwijzing (optioneel):');
    if (reason === null) return; // User cancelled
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await rejectReservation(reservationId, reason || undefined);
      if (success) {
        showSuccess('Reservering afgewezen');
        await loadReservations(); // Refresh data
      } else {
        showError('Kon reservering niet afwijzen');
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor annuleren
  const handleCancel = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt annuleren?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await updateReservationStatus(reservationId, 'cancelled');
      if (success) {
        showSuccess('Reservering geannuleerd');
        setSelectedReservationId(null);
        await loadReservations();
      } else {
        showError('Kon reservering niet annuleren');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor specifieke email types versturen
  const handleSendEmail = async (emailType: 'status' | 'payment' | 'booking-confirmed') => {
    if (!selectedReservation) {
      showError('Geen reservering geselecteerd');
      return;
    }

    const reservation = selectedReservation;
    
    if (!confirm(`Email versturen naar ${reservation.email}?`)) return;
    
    setShowEmailMenu(false);
    setProcessingIds(prev => new Set(prev).add(reservation.id));
    
    try {
      console.log('📧 Sending email type:', emailType, 'for reservation:', reservation.id);
      
      // Get event data
      const event = events.find(e => e.id === reservation.eventId);
      if (!event) {
        console.error('❌ Event not found for reservation:', reservation.eventId);
        showError('Event niet gevonden');
        return;
      }

      console.log('✅ Event found:', event.title, event.id);

      const { emailService } = await import('../../services/emailService');
      console.log('✅ Email service loaded');
      
      // Send appropriate email type
      switch (emailType) {
        case 'status':
          console.log('📤 Sending status email...');
          // Send email based on current status (aanvraag, bevestiging, etc.)
          await emailService.sendByStatus(reservation, event, false, reservation.rejectionReason);
          showSuccess(`Status email verstuurd naar ${reservation.email}`);
          break;
          
        case 'payment':
          console.log('📤 Sending payment confirmation...');
          // Send payment confirmation email
          await emailService.sendPaymentConfirmation(reservation, event);
          showSuccess(`Betalingsbevestiging verstuurd naar ${reservation.email}`);
          break;
          
        case 'booking-confirmed':
          console.log('📤 Sending booking confirmed email...');
          // Send booking confirmed email (pending → confirmed)
          await emailService.sendBookingConfirmed(reservation, event);
          showSuccess(`Boeking goedkeuring email verstuurd naar ${reservation.email}`);
          break;
      }
      
      console.log('✅ Email sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending email:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        type: emailType,
        reservationId: reservation?.id
      });
      showError(`Kon email niet versturen: ${error?.message || 'Onbekende fout'}`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservation.id);
        return next;
      });
    }
  };

  // Handler voor email opnieuw versturen (oude functie - behouden voor backwards compatibility)
  const handleResendEmail = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      showError('Reservering niet gevonden');
      return;
    }

    if (!confirm(`Email opnieuw versturen naar ${reservation.email}?`)) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      // Get event data
      const event = events.find(e => e.id === reservation.eventId);
      if (!event) {
        showError('Event niet gevonden');
        return;
      }

      // Send email based on current status
      const { emailService } = await import('../../services/emailService');
      await emailService.sendByStatus(
        reservation, 
        event, 
        false,
        reservation.rejectionReason
      );

      showSuccess(`Email verstuurd naar ${reservation.email}`);
      
      // Log to communication log
      const { communicationLogService } = await import('../../services/communicationLogService');
      await communicationLogService.logEmail(
        reservationId,
        `Email opnieuw verstuurd (${reservation.status})`,
        reservation.email,
        'Admin'
      );
      
      await loadReservations();
    } catch (error) {
      console.error('Error resending email:', error);
      showError('Kon email niet versturen');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor archiveren
  const handleArchive = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt archiveren?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      // Archive = set to cancelled status
      const success = await updateReservationStatus(reservationId, 'cancelled');
      if (success) {
        showSuccess('Reservering gearchiveerd');
        setSelectedReservationId(null);
      } else {
        showError('Kon reservering niet archiveren');
      }
    } catch (error) {
      console.error('Error archiving reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor verwijderen
  // Handler voor verwijderen
  const handleDelete = async (reservationId: string) => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await deleteReservation(reservationId);
      if (success) {
        showSuccess('Reservering permanent verwijderd');
        setSelectedReservationId(null);
        setShowDeleteConfirm(false);
      } else {
        showError('Kon reservering niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };
  // ========================================================================
  // DATA PROCESSING & FILTERING
  // ========================================================================

  // Filter out expired/past reservations - only show active (future + today)
  const activeReservations = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    return reservations.filter(reservation => {
      // Skip cancelled reservations
      if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
        return false;
      }

      // Check if event date has passed
      const event = events.find(e => e.id === reservation.eventId);
      if (event) {
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        const eventDateOnly = new Date(eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);
        // Keep if event is today or in the future
        return eventDateOnly >= now;
      }

      // If no event found, check reservation eventDate
      if (reservation.eventDate) {
        const resDate = reservation.eventDate instanceof Date 
          ? reservation.eventDate 
          : parseISO(reservation.eventDate as any);
        const resDateOnly = new Date(resDate);
        resDateOnly.setHours(0, 0, 0, 0);
        return resDateOnly >= now;
      }

      // Keep reservation if no date info (shouldn't happen but safe fallback)
      return true;
    });
  }, [reservations, events]);

  // Filter active events (not expired)
  const activeEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      // Keep if event is in the future or today
      return eventDate >= now || isToday(eventDate);
    });
  }, [events]);

  // Debug: Log filtering results
  useEffect(() => {
    console.log('📊 [OCC] Data filtering:', {
      totalReservations: reservations.length,
      activeReservations: activeReservations.length,
      expiredReservations: reservations.length - activeReservations.length,
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      expiredEvents: events.length - activeEvents.length
    });
  }, [reservations, activeReservations, events, activeEvents]);

  const stats = useMemo(() => {
    // Aanvragen (pending status)
    const pendingCount = activeReservations.filter(r => 
      r.status === 'pending'
    ).length;

    // Opties
    const optionsCount = activeReservations.filter(r => 
      r.status === 'option'
    ).length;

    // Bevestigde boekingen
    const confirmedCount = activeReservations.filter(r => 
      r.status === 'confirmed'
    ).length;

    // Checked-in
    const checkedInCount = activeReservations.filter(r => 
      r.status === 'checked-in'
    ).length;

    // Geannuleerd/Afgewezen
    const cancelledCount = reservations.filter(r => 
      r.status === 'cancelled' || r.status === 'rejected'
    ).length;

    // Openstaande betalingen (bevestigd maar paymentStatus is niet 'paid')
    const paymentsCount = activeReservations.filter(r => 
      r.status === 'confirmed' && r.paymentStatus !== 'paid'
    ).length;

    // Totale omzet vandaag
    const todayRevenue = activeReservations
      .filter(r => {
        const isPaid = r.paymentStatus === 'paid';
        const isDateToday = r.createdAt 
          ? isToday(r.createdAt instanceof Date ? r.createdAt : parseISO(r.createdAt as any))
          : false;
        return isPaid && isDateToday;
      })
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    // ✨ NIEUWE STATISTICS
    // Conversie rate (opties → bevestigd)
    const totalConverted = reservations.filter(r => r.status === 'confirmed').length;
    const totalOptions = reservations.filter(r => r.status === 'option').length + totalConverted;
    const conversionRate = totalOptions > 0 ? (totalConverted / totalOptions) * 100 : 0;

    // Gemiddelde groepsgrootte
    const totalPersons = activeReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const avgGroupSize = activeReservations.length > 0 ? totalPersons / activeReservations.length : 0;

    // Cancellation rate
    const totalBookings = reservations.length;
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

    return {
      pending: pendingCount,
      options: optionsCount,
      confirmed: confirmedCount,
      checkedIn: checkedInCount,
      cancelled: cancelledCount,
      payments: paymentsCount,
      revenue: todayRevenue,
      total: activeReservations.length,
      conversionRate: conversionRate.toFixed(1),
      avgGroupSize: avgGroupSize.toFixed(1),
      cancellationRate: cancellationRate.toFixed(1)
    };
  }, [activeReservations, reservations]);
  // Boekingen voor vandaag en morgen
  const upcomingBookings = useMemo(() => {
    return activeReservations
      .filter(r => r.status === 'confirmed')
      .filter(r => {
        const event = activeEvents.find(e => e.id === r.eventId);
        if (!event) return false;
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        return isToday(eventDate) || isTomorrow(eventDate);
      })
      .sort((a, b) => {
        const eventA = activeEvents.find(e => e.id === a.eventId);
        const eventB = activeEvents.find(e => e.id === b.eventId);
        if (!eventA || !eventB) return 0;
        const dateA = eventA.date instanceof Date ? eventA.date : parseISO(eventA.date as any);
        const dateB = eventB.date instanceof Date ? eventB.date : parseISO(eventB.date as any);
        return dateA.getTime() - dateB.getTime();
      });
  }, [activeReservations, activeEvents]);

  // ========================================================================
  // CAPACITEIT MANAGEMENT
  // ========================================================================
  
  // Calculate capacity for a specific event
  const getEventCapacity = (eventId: string): CapacityInfo => {
    const MAX_CAPACITY = 230;
    const WARNING_THRESHOLD = 200;
    
    const confirmedReservations = activeReservations.filter(
      r => r.eventId === eventId && (r.status === 'confirmed' || r.status === 'pending')
    );
    
    const currentGuests = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const percentage = (currentGuests / MAX_CAPACITY) * 100;
    
    return {
      current: currentGuests,
      max: MAX_CAPACITY,
      percentage: Math.min(percentage, 100),
      isNearLimit: currentGuests >= WARNING_THRESHOLD,
      isAtLimit: currentGuests >= MAX_CAPACITY,
      shouldUseWaitlist: currentGuests >= MAX_CAPACITY
    };
  };

  // Get all events with capacity warnings
  const eventsNearCapacity = useMemo(() => {
    return activeEvents
      .map(event => ({
        event,
        capacity: getEventCapacity(event.id)
      }))
      .filter(({ capacity }) => capacity.isNearLimit || capacity.isAtLimit)
      .sort((a, b) => b.capacity.current - a.capacity.current);
  }, [activeEvents, activeReservations]);

  // ========================================================================
  // VIEWS
  // ========================================================================

  const quickStats: QuickStat[] = [
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'orange',
      trend: stats.pending > 0 ? 'Wacht op bevestiging' : 'Alles bevestigd',
      onClick: () => { setMainTab('reserveringen'); setReserveringenTab('pending'); }
    },
    {
      label: 'Opties',
      value: stats.options,
      icon: AlertCircle,
      color: 'blue',
      trend: `${stats.conversionRate}% conversie rate`,
      onClick: () => { setMainTab('opties'); setOptiesTab('overview'); }
    },
    {
      label: 'Bevestigd',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'green',
      trend: `${upcomingBookings.length} vandaag/morgen`,
      onClick: () => { setMainTab('reserveringen'); setReserveringenTab('confirmed'); }
    },
    {
      label: 'Checked-in',
      value: stats.checkedIn,
      icon: CheckCheck,
      color: 'purple',
      trend: `Ø ${stats.avgGroupSize} gasten/groep`,
      onClick: () => { setMainTab('reserveringen'); setReserveringenTab('all'); }
    },
    {
      label: 'Betalingen',
      value: stats.payments,
      icon: DollarSign,
      color: 'emerald',
      trend: stats.payments > 0 ? 'Openstaande betalingen' : 'Alles betaald',
      onClick: () => { setMainTab('betalingen'); setBetalingenTab('overview'); }
    },
    {
      label: 'Omzet Vandaag',
      value: stats.revenue,
      icon: TrendingUp,
      color: 'indigo',
      trend: 'Live omzet',
      onClick: () => { setMainTab('reserveringen'); setReserveringenTab('dashboard'); }
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ====================================================================== */}
      {/* RESERVATION DETAIL MODAL */}
      {/* ====================================================================== */}
      {selectedReservation ? (
        <>
          {console.log('✅ Rendering detail modal for:', selectedReservation.id)}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Reservering Details
                  </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {selectedReservation.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReservationId(null)}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Edit Mode Banner */}
              {isEditMode && (
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl p-4 text-white shadow-lg border-2 border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FileEdit className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black mb-1">Bewerkingsmodus Actief</h3>
                      <p className="text-sm text-white/80">Wijzig de velden hieronder en klik op "Opslaan" om te bevestigen.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tag Badges - Prominent at Top */}
              {selectedReservation.tags && selectedReservation.tags.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    🏷️ Tags & Categorieën
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedReservation.tags.map((tag) => (
                      <div key={tag} className="transform hover:scale-105 transition-transform">
                        <TagBadge tag={tag} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-xl border-2",
                selectedReservation.status === 'confirmed' 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : selectedReservation.status === 'pending'
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : selectedReservation.status === 'request'
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                      Status
                    </p>
                    <p className="text-lg font-black">
                      {selectedReservation.status === 'confirmed' ? '✓ Bevestigd' :
                       selectedReservation.status === 'pending' ? '⏰ Pending' :
                       selectedReservation.status === 'request' ? '📋 Request' :
                       selectedReservation.status}
                    </p>
                  </div>
                  {selectedReservation.paymentStatus && (
                    <span className={cn(
                      "px-4 py-2 rounded-lg text-sm font-black uppercase",
                      selectedReservation.paymentStatus === 'paid'
                        ? "bg-green-500 text-white"
                        : selectedReservation.paymentStatus === 'pending'
                        ? "bg-orange-500 text-white"
                        : "bg-slate-300 text-slate-700"
                    )}>
                      {selectedReservation.paymentStatus === 'paid' ? '💰 Betaald' :
                       selectedReservation.paymentStatus === 'pending' ? '⏰ Te betalen' :
                       selectedReservation.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Date Selection - EDITABLE */}
              {isEditMode && editData && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5" />
                    Event / Datum Wijzigen
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                        Selecteer Nieuw Event
                      </label>
                      <select
                        value={editData.eventId}
                        onChange={(e) => {
                          const newEventId = e.target.value;
                          const newEvent = events.find(ev => ev.id === newEventId);
                          setEditData({ 
                            ...editData, 
                            eventId: newEventId
                          });
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500"
                      >
                        {events
                          .filter(e => e.isActive)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(e => {
                            const eventDate = e.date instanceof Date ? e.date : parseISO(e.date as any);
                            const eventTypeConfig = eventTypesConfig?.types.find(t => t.key === e.type);
                            const standardPrice = getArrangementPriceForEvent(e.id, 'Standard');
                            const premiumPrice = getArrangementPriceForEvent(e.id, 'Premium');
                            
                            return (
                              <option key={e.id} value={e.id}>
                                {format(eventDate, 'EEEE dd MMM yyyy', { locale: nl })} - {e.startsAt} | 
                                Standard: €{standardPrice} | Premium: €{premiumPrice} | 
                                Type: {eventTypeConfig?.name || e.type}
                              </option>
                            );
                          })}
                      </select>
                      {editData.eventId !== selectedReservation.eventId && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Datum wijziging detected! Prijs wordt automatisch herberekend op basis van nieuwe datum en arrangement.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Show pricing info for selected event */}
                    {(() => {
                      const currentEvent = events.find(e => e.id === editData.eventId);
                      if (!currentEvent) return null;
                      
                      // Check if config is loaded
                      if (!eventTypesConfig || !eventTypesConfig.types || eventTypesConfig.types.length === 0) {
                        return (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Prijzen worden geladen... Als dit langer duurt, ga naar Admin → Producten en Prijzen om prijzen in te stellen.
                            </p>
                          </div>
                        );
                      }
                      
                      const eventTypeConfig = eventTypesConfig.types.find(t => t.key === currentEvent.type);
                      const standardPrice = getArrangementPriceForEvent(editData.eventId, 'Standard');
                      const premiumPrice = getArrangementPriceForEvent(editData.eventId, 'Premium');
                      const currentArrangementPrice = getArrangementPriceForEvent(editData.eventId, editData.arrangement as Arrangement);
                      
                      return (
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Prijzen voor geselecteerde datum:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className={cn(
                              "p-3 rounded-lg border-2",
                              editData.arrangement === 'Standard' 
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Standard</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">€{standardPrice}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">per persoon</p>
                            </div>
                            <div className={cn(
                              "p-3 rounded-lg border-2",
                              editData.arrangement === 'Premium' 
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Premium</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">€{premiumPrice}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">per persoon</p>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-sm font-bold text-purple-900 dark:text-purple-200">
                              Huidige selectie: {editData.arrangement} = €{currentArrangementPrice} × {editData.numberOfPersons} personen = €{(currentArrangementPrice * editData.numberOfPersons).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Booking Details - EDITABLE */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5" />
                  Boeking Details {isEditMode && <span className="text-sm text-blue-600 dark:text-blue-400">(Bewerken)</span>}
                </h3>

                {/* Aantal Personen */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    Aantal Personen
                  </label>
                  {isEditMode && editData ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        min="1"
                        value={editData.numberOfPersons}
                        onChange={(e) => {
                          const newPersons = parseInt(e.target.value) || 1;
                          setEditData({ 
                            ...editData, 
                            numberOfPersons: newPersons,
                            // Auto-sync preDrink and afterParty quantities if enabled
                            preDrink: editData.preDrink.enabled ? { ...editData.preDrink, quantity: newPersons } : editData.preDrink,
                            afterParty: editData.afterParty.enabled ? { ...editData.afterParty, quantity: newPersons } : editData.afterParty
                          });
                        }}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500"
                      />
                      {(() => {
                        const capacityCheck = checkEditCapacity();
                        if (capacityCheck.message) {
                          return (
                            <div className={cn(
                              "flex items-start gap-2 p-3 rounded-lg text-sm",
                              capacityCheck.ok 
                                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                            )}>
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <p className="font-medium">{capacityCheck.message}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedReservation.numberOfPersons}
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrangement */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    Arrangement
                  </label>
                  {isEditMode && editData ? (
                    <select
                      value={editData.arrangement}
                      onChange={(e) => setEditData({ ...editData, arrangement: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                    </select>
                  ) : (
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedReservation.arrangement}
                    </p>
                  )}
                </div>

                {/* Pre-drink & After Party */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                      Voorborrel
                    </label>
                    {isEditMode && editData ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editData.preDrink.enabled}
                            onChange={(e) => setEditData({
                              ...editData,
                              preDrink: { 
                                enabled: e.target.checked,
                                quantity: e.target.checked ? editData.numberOfPersons : 0
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Ingeschakeld {editData.preDrink.enabled && `(${editData.preDrink.quantity} pers.)`}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <p className="text-base text-slate-900 dark:text-white">
                        {selectedReservation.preDrink?.enabled 
                          ? `✓ ${selectedReservation.preDrink.quantity} personen`
                          : '✗ Niet geboekt'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                      After Party
                    </label>
                    {isEditMode && editData ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editData.afterParty.enabled}
                            onChange={(e) => setEditData({
                              ...editData,
                              afterParty: { 
                                enabled: e.target.checked,
                                quantity: e.target.checked ? editData.numberOfPersons : 0
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Ingeschakeld {editData.afterParty.enabled && `(${editData.afterParty.quantity} pers.)`}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <p className="text-base text-slate-900 dark:text-white">
                        {selectedReservation.afterParty?.enabled 
                          ? `✓ ${selectedReservation.afterParty.quantity} personen`
                          : '✗ Niet geboekt'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Company & Contact */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bedrijf & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Bedrijfsnaam</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contactpersoon</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedReservation.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Telefoon</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedReservation.phone || '-'}</p>
                  </div>
                </div>

                {/* Address */}
                {(selectedReservation.address || selectedReservation.postalCode || selectedReservation.city) && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Adres</p>
                    <div className="text-base text-slate-900 dark:text-white">
                      {selectedReservation.address && <p>{selectedReservation.address}</p>}
                      {(selectedReservation.postalCode || selectedReservation.city) && (
                        <p>{selectedReservation.postalCode} {selectedReservation.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Event Datum</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {format(selectedReservation.eventDate instanceof Date ? selectedReservation.eventDate : parseISO(selectedReservation.eventDate as any), 'EEEE dd MMMM yyyy', { locale: nl })}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {format(selectedReservation.eventDate instanceof Date ? selectedReservation.eventDate : parseISO(selectedReservation.eventDate as any), 'HH:mm', { locale: nl })} uur
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Aantal Personen</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedReservation.numberOfPersons}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Arrangement</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.arrangement}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tafel Nummer</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.tableNumber || 'Nog niet toegewezen'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {(() => {
                const paymentSummary = calculatePaymentSummary(selectedReservation);
                const badge = getPaymentStatusBadge(paymentSummary);
                
                return (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Betaalstatus
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </div>
                        {paymentSummary.balance > 0 && (
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Betaling Registreren
                          </button>
                        )}
                        {paymentSummary.totalPaid > 0 && (
                          <button
                            onClick={() => setShowRefundModal(true)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                            </svg>
                            Restitutie
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Totaal</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          €{paymentSummary.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Betaald</p>
                        <p className="text-xl font-black text-green-600 dark:text-green-400">
                          €{paymentSummary.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Openstaand</p>
                        <p className={`text-xl font-black ${paymentSummary.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          €{paymentSummary.balance.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Betaal Voor</p>
                        <p className={`text-sm font-bold ${paymentSummary.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                          {format(paymentSummary.dueDate!, 'dd MMM yyyy', { locale: nl })}
                        </p>
                        {paymentSummary.daysUntilDue !== undefined && (
                          <p className={`text-xs ${paymentSummary.daysUntilDue < 0 ? 'text-red-600 dark:text-red-400' : paymentSummary.daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {paymentSummary.daysUntilDue < 0 
                              ? `${Math.abs(paymentSummary.daysUntilDue)} dagen te laat` 
                              : paymentSummary.daysUntilDue === 0 
                                ? 'Vandaag!' 
                                : `Over ${paymentSummary.daysUntilDue} dagen`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment History */}
                    {paymentSummary.payments.length > 0 && (
                      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Betalingshistorie</p>
                        <div className="space-y-2">
                          {paymentSummary.payments.map((payment: any, idx: number) => (
                            <div key={`payment-${idx}`} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  €{payment.amount.toFixed(2)}
                                  {payment.category && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      {payment.category === 'arrangement' ? '🍽️ Arrangement' : 
                                       payment.category === 'merchandise' ? '🛍️ Merchandise' : 
                                       payment.category === 'full' ? '💯 Volledig' : '📋 Overig'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {payment.date ? format(
                                    payment.date instanceof Date 
                                      ? payment.date 
                                      : payment.date.toDate 
                                        ? payment.date.toDate() 
                                        : new Date(payment.date), 
                                    'dd MMM yyyy HH:mm', 
                                    { locale: nl }
                                  ) : 'Geen datum'} • {payment.method}
                                </p>
                                {payment.note && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{payment.note}</p>
                                )}
                              </div>
                              {payment.reference && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                  {payment.reference}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Refund History */}
                    {paymentSummary.refunds.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 mt-3">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-3">Restituties</p>
                        <div className="space-y-2">
                          {paymentSummary.refunds.map((refund: any, idx: number) => (
                            <div key={`refund-${idx}`} className="flex items-center justify-between py-2 border-b border-red-100 dark:border-red-900 last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                  -€{refund.amount.toFixed(2)}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-500">
                                  {refund.date ? format(
                                    refund.date instanceof Date 
                                      ? refund.date 
                                      : refund.date.toDate 
                                        ? refund.date.toDate() 
                                        : new Date(refund.date), 
                                    'dd MMM yyyy HH:mm', 
                                    { locale: nl }
                                  ) : 'Geen datum'} • {refund.reason}
                                </p>
                                {refund.note && (
                                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">{refund.note}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Netto Omzet</p>
                            <p className="text-lg font-black text-red-700 dark:text-red-400">
                              €{paymentSummary.netRevenue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Add-ons / Borrels */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Extra's (Borrels)
                </h3>
                
                {isEditMode && editData ? (
                  <div className="space-y-4">
                    {/* Borrel vooraf */}
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editData.preDrink?.enabled || false}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setEditData({
                              ...editData,
                              preDrink: {
                                enabled,
                                quantity: enabled ? editData.numberOfPersons : 0
                              }
                            });
                          }}
                          className="mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              🍷 Borrel vooraf
                            </span>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              €{(addOns?.preDrink?.pricePerPerson || 15).toFixed(2)} p.p.
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Start de avond gezellig met een borrel vooraf
                          </p>
                          {editData.preDrink?.enabled && (
                            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">
                                  {editData.preDrink.quantity} personen × €{(addOns?.preDrink?.pricePerPerson || 15).toFixed(2)}
                                </span>
                                <span className="font-black text-purple-700 dark:text-purple-400">
                                  €{((editData.preDrink.quantity || 0) * (addOns?.preDrink?.pricePerPerson || 15)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Nafeest */}
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editData.afterParty?.enabled || false}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setEditData({
                              ...editData,
                              afterParty: {
                                enabled,
                                quantity: enabled ? editData.numberOfPersons : 0
                              }
                            });
                          }}
                          className="mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-pink-600 focus:ring-2 focus:ring-pink-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                              🎉 Nafeest
                            </span>
                            <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                              €{(addOns?.afterParty?.pricePerPerson || 15).toFixed(2)} p.p.
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Sluit de avond af met een gezellige naborrel
                          </p>
                          {editData.afterParty?.enabled && (
                            <div className="mt-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">
                                  {editData.afterParty.quantity} personen × €{(addOns?.afterParty?.pricePerPerson || 15).toFixed(2)}
                                </span>
                                <span className="font-black text-pink-700 dark:text-pink-400">
                                  €{((editData.afterParty.quantity || 0) * (addOns?.afterParty?.pricePerPerson || 15)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedReservation.preDrink?.enabled ? (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="font-bold text-slate-900 dark:text-white">🍷 Borrel vooraf</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {selectedReservation.preDrink.quantity} pers. × €{(addOns?.preDrink?.pricePerPerson || 15).toFixed(2)}
                            </p>
                            <p className="font-black text-purple-700 dark:text-purple-400">
                              €{((selectedReservation.preDrink.quantity || 0) * (addOns?.preDrink?.pricePerPerson || 15)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Geen borrel vooraf</span>
                      </div>
                    )}
                    
                    {selectedReservation.afterParty?.enabled ? (
                      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            <span className="font-bold text-slate-900 dark:text-white">🎉 Nafeest</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {selectedReservation.afterParty.quantity} pers. × €{(addOns?.afterParty?.pricePerPerson || 15).toFixed(2)}
                            </p>
                            <p className="font-black text-pink-700 dark:text-pink-400">
                              €{((selectedReservation.afterParty.quantity || 0) * (addOns?.afterParty?.pricePerPerson || 15)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Geen nafeest</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Merchandise */}
              {(isEditMode || (selectedReservation.merchandise && selectedReservation.merchandise.length > 0)) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Merchandise
                  </h3>
                  {isEditMode && editData ? (
                    <div className="space-y-3">
                      {editData.merchandise && editData.merchandise.length > 0 ? (
                        <div className="space-y-2">
                          {editData.merchandise.map((item: any, index: number) => {
                            const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
                            const uniqueKey = `merch-edit-${item.itemId || item.id || item.name || 'item'}-${index}-${Date.now()}`;
                            return (
                              <div key={uniqueKey} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                                {/* Product Image */}
                                {productDetails?.imageUrl && (
                                  <div className="flex-shrink-0 w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                    <img 
                                      src={productDetails.imageUrl} 
                                      alt={productDetails.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {productDetails?.name || item.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => {
                                        const newMerch = [...editData.merchandise];
                                        if (newMerch[index].quantity > 1) {
                                          newMerch[index] = { ...newMerch[index], quantity: newMerch[index].quantity - 1 };
                                        } else {
                                          newMerch.splice(index, 1);
                                        }
                                        setEditData({ ...editData, merchandise: newMerch });
                                      }}
                                      className="w-7 h-7 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-bold transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[40px] text-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                                      {item.quantity}x
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newMerch = [...editData.merchandise];
                                        newMerch[index] = { ...newMerch[index], quantity: newMerch[index].quantity + 1 };
                                        setEditData({ ...editData, merchandise: newMerch });
                                      }}
                                      className="w-7 h-7 flex items-center justify-center bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg font-bold transition-colors"
                                    >
                                      +
                                    </button>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                      €{(productDetails?.price || item.price).toFixed(2)} per stuk
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Price & Remove */}
                                <div className="text-right flex-shrink-0">
                                  <p className="font-black text-slate-900 dark:text-white text-lg mb-1">
                                    €{((productDetails?.price || item.price) * item.quantity).toFixed(2)}
                                  </p>
                                  <button
                                    onClick={() => {
                                      const newMerch = editData.merchandise.filter((_: any, i: number) => i !== index);
                                      setEditData({ ...editData, merchandise: newMerch });
                                    }}
                                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-bold"
                                  >
                                    🗑️ Verwijder
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Geen merchandise items</p>
                      )}
                      
                      {/* Add Merchandise Section */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">➕ Voeg merchandise toe:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {merchandiseItems.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => {
                                const existingIndex = editData.merchandise.findIndex((m: any) => (m.itemId || m.id) === product.id);
                                if (existingIndex >= 0) {
                                  // Increase quantity if already exists
                                  const newMerch = [...editData.merchandise];
                                  newMerch[existingIndex] = {
                                    ...newMerch[existingIndex],
                                    quantity: newMerch[existingIndex].quantity + 1
                                  };
                                  setEditData({ ...editData, merchandise: newMerch });
                                } else {
                                  // Add new item
                                  setEditData({
                                    ...editData,
                                    merchandise: [
                                      ...editData.merchandise,
                                      {
                                        itemId: product.id,
                                        name: product.name,
                                        price: product.price,
                                        quantity: 1
                                      }
                                    ]
                                  });
                                }
                              }}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 rounded-lg transition-colors text-left"
                            >
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">€{product.price.toFixed(2)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        {merchandiseItems.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Geen producten beschikbaar. Voeg eerst producten toe in Producten & Prijzen.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReservation.merchandise && selectedReservation.merchandise.length > 0 ? (
                        <>
                          {selectedReservation.merchandise.map((item: any, index: number) => {
                            const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
                            const price = productDetails?.price || item.price || 0;
                            const itemName = productDetails?.name || item.name || 'Onbekend product';
                            const uniqueKey = `merch-view-${item.itemId || item.id || item.name || 'item'}-${index}`;
                            
                            return (
                              <div key={uniqueKey} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                                {/* Product Image */}
                                {productDetails?.imageUrl ? (
                                  <div className="flex-shrink-0 w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                    <img 
                                      src={productDetails.imageUrl} 
                                      alt={itemName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Package className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                                  </div>
                                )}
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-900 dark:text-white text-base mb-1">
                                    {itemName}
                                  </p>
                                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <span className="font-bold">Aantal: {item.quantity}x</span>
                                    {price > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>€{price.toFixed(2)} per stuk</span>
                                      </>
                                    )}
                                  </div>
                                  {productDetails?.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {productDetails.description}
                                    </p>
                                  )}
                                  {!productDetails && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                      ⚠️ Product niet meer beschikbaar in catalogus
                                    </p>
                                  )}
                                </div>
                                
                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  {price > 0 ? (
                                    <p className="font-black text-slate-900 dark:text-white text-2xl">
                                      €{(price * item.quantity).toFixed(2)}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                                      Prijs onbekend
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Geen merchandise items</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Special Requests - EDITABLE */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 border-2 border-amber-200 dark:border-amber-800 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Bijzonderheden {isEditMode && <span className="text-sm text-amber-600 dark:text-amber-400">(Bewerken)</span>}
                </h3>
                
                {/* Viering */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    🎉 Viering / Speciale Gelegenheid
                  </label>
                  {isEditMode && editData ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.celebrationOccasion}
                        onChange={(e) => setEditData({ ...editData, celebrationOccasion: e.target.value })}
                        placeholder="Verjaardag, jubileum, bedrijfsfeest..."
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        value={editData.partyPerson}
                        onChange={(e) => setEditData({ ...editData, partyPerson: e.target.value })}
                        placeholder="Voor wie is het feest?"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                      <textarea
                        value={editData.celebrationDetails}
                        onChange={(e) => setEditData({ ...editData, celebrationDetails: e.target.value })}
                        placeholder="Extra details over de viering..."
                        rows={2}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      {selectedReservation.celebrationOccasion ? (
                        <>
                          <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.celebrationOccasion}</p>
                          {selectedReservation.partyPerson && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Voor: {selectedReservation.partyPerson}</p>
                          )}
                          {selectedReservation.celebrationDetails && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedReservation.celebrationDetails}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Geen viering</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dieetwensen */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    🍽️ Dieetwensen & Allergieën
                  </label>
                  {isEditMode && editData ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700">
                          <input
                            type="checkbox"
                            checked={editData.dietaryRequirements.vegetarian}
                            onChange={(e) => setEditData({
                              ...editData,
                              dietaryRequirements: {
                                ...editData.dietaryRequirements,
                                vegetarian: e.target.checked
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold">🥗 Vegetarisch</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700">
                          <input
                            type="checkbox"
                            checked={editData.dietaryRequirements.vegan}
                            onChange={(e) => setEditData({
                              ...editData,
                              dietaryRequirements: {
                                ...editData.dietaryRequirements,
                                vegan: e.target.checked
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold">🌱 Veganistisch</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700">
                          <input
                            type="checkbox"
                            checked={editData.dietaryRequirements.glutenFree}
                            onChange={(e) => setEditData({
                              ...editData,
                              dietaryRequirements: {
                                ...editData.dietaryRequirements,
                                glutenFree: e.target.checked
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold">🌾 Glutenvrij</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700">
                          <input
                            type="checkbox"
                            checked={editData.dietaryRequirements.lactoseFree}
                            onChange={(e) => setEditData({
                              ...editData,
                              dietaryRequirements: {
                                ...editData.dietaryRequirements,
                                lactoseFree: e.target.checked
                              }
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold">🥛 Lactosevrij</span>
                        </label>
                      </div>
                      <textarea
                        value={editData.dietaryRequirements.other || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          dietaryRequirements: {
                            ...editData.dietaryRequirements,
                            other: e.target.value
                          }
                        })}
                        placeholder="Andere dieetwensen of allergieën..."
                        rows={2}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      {selectedReservation.dietaryRequirements ? (
                        <div className="space-y-1 text-sm text-slate-900 dark:text-white">
                          {selectedReservation.dietaryRequirements.vegetarian && <p>• 🥗 Vegetarisch</p>}
                          {selectedReservation.dietaryRequirements.vegan && <p>• 🌱 Veganistisch</p>}
                          {selectedReservation.dietaryRequirements.glutenFree && <p>• 🌾 Glutenvrij</p>}
                          {selectedReservation.dietaryRequirements.lactoseFree && <p>• 🥛 Lactosevrij</p>}
                          {selectedReservation.dietaryRequirements.other && <p>• ⚠️ {selectedReservation.dietaryRequirements.other}</p>}
                          {!selectedReservation.dietaryRequirements.vegetarian && 
                           !selectedReservation.dietaryRequirements.vegan &&
                           !selectedReservation.dietaryRequirements.glutenFree &&
                           !selectedReservation.dietaryRequirements.lactoseFree &&
                           !selectedReservation.dietaryRequirements.other && (
                            <p className="text-slate-500 dark:text-slate-400 italic">Geen bijzondere dieetwensen</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Geen dieetwensen</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Opmerkingen */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    💬 Opmerkingen
                  </label>
                  {isEditMode && editData ? (
                    <textarea
                      value={editData.comments}
                      onChange={(e) => setEditData({ ...editData, comments: e.target.value })}
                      placeholder="Extra opmerkingen of speciale wensen..."
                      rows={4}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  ) : (
                    <div>
                      {selectedReservation.comments ? (
                        <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap">{selectedReservation.comments}</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Geen opmerkingen</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Details */}
              <div className={cn(
                "rounded-xl p-6 border-2 transition-all",
                isEditMode 
                  ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-300 dark:border-blue-700"
                  : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
              )}>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Euro className="w-5 h-5" />
                  Financieel {isEditMode && <span className="text-xs font-normal text-blue-600 dark:text-blue-400 animate-pulse">● LIVE BEREKENING</span>}
                </h3>
                <div className="space-y-3">
                  {selectedReservation.pricingSnapshot && (
                    <div className="space-y-2 text-sm">
                      {/* Arrangement */}
                      {(() => {
                        let arrangementPrice = 0;
                        const persons = isEditMode && editData ? editData.numberOfPersons : selectedReservation.numberOfPersons;
                        const arrangement = isEditMode && editData ? editData.arrangement : selectedReservation.arrangement;
                        
                        // Calculate price using the same logic as getArrangementPriceForEvent
                        if (isEditMode && editData) {
                          arrangementPrice = getArrangementPriceForEvent(selectedReservation.eventId, arrangement as Arrangement);
                        } else {
                          // View mode: try to get current price, fallback to snapshot
                          const livePrice = getArrangementPriceForEvent(selectedReservation.eventId, arrangement as Arrangement);
                          if (livePrice > 0) {
                            arrangementPrice = livePrice;
                          } else {
                            // Fallback to original pricing snapshot
                            arrangementPrice = (selectedReservation.pricingSnapshot as any).breakdown?.arrangement?.pricePerPerson || 
                                              selectedReservation.pricingSnapshot.pricePerPerson || 
                                              (selectedReservation.pricingSnapshot.basePrice / selectedReservation.numberOfPersons);
                          }
                        }
                        
                        const total = arrangementPrice * persons;
                        
                        return (
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              {isEditMode && editData && editData.arrangement !== selectedReservation.arrangement && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold mr-2">GEWIJZIGD ↻</span>
                              )}
                              Arrangement {arrangement} ({persons} × €{arrangementPrice.toFixed(2)})
                            </span>
                            <span className="font-bold">€{total.toFixed(2)}</span>
                          </div>
                        );
                      })()}
                      
                      {/* Pre-drink */}
                      {((selectedReservation.preDrink?.enabled && selectedReservation.preDrink?.quantity > 0) || selectedReservation.pricingSnapshot?.preDrinkTotal || (isEditMode && editData?.preDrink?.enabled)) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isEditMode && editData?.preDrink?.enabled && !selectedReservation.preDrink?.enabled && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-bold mr-2">NIEUW +</span>
                            )}
                            Borrel vooraf ({isEditMode && editData?.preDrink?.enabled 
                              ? editData.preDrink.quantity 
                              : selectedReservation.preDrink?.quantity || 0} × €{(addOns?.preDrink?.pricePerPerson || selectedReservation.pricingSnapshot?.preDrinkPrice || 0).toFixed(2)})
                          </span>
                          <span className="font-bold">€{(isEditMode && editData?.preDrink?.enabled 
                            ? (addOns?.preDrink?.pricePerPerson || 0) * editData.preDrink.quantity 
                            : selectedReservation.pricingSnapshot?.preDrinkTotal || ((selectedReservation.preDrink?.quantity || 0) * (addOns?.preDrink?.pricePerPerson || 0))).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* After-party */}
                      {((selectedReservation.afterParty?.enabled && selectedReservation.afterParty?.quantity > 0) || selectedReservation.pricingSnapshot?.afterPartyTotal || (isEditMode && editData?.afterParty?.enabled)) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isEditMode && editData?.afterParty?.enabled && !selectedReservation.afterParty?.enabled && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-bold mr-2">NIEUW +</span>
                            )}
                            Nafeest ({isEditMode && editData?.afterParty?.enabled 
                              ? editData.afterParty.quantity 
                              : selectedReservation.afterParty?.quantity || 0} × €{(addOns?.afterParty?.pricePerPerson || selectedReservation.pricingSnapshot?.afterPartyPrice || 0).toFixed(2)})
                          </span>
                          <span className="font-bold">€{(isEditMode && editData?.afterParty?.enabled 
                            ? (addOns?.afterParty?.pricePerPerson || 0) * editData.afterParty.quantity 
                            : selectedReservation.pricingSnapshot?.afterPartyTotal || ((selectedReservation.afterParty?.quantity || 0) * (addOns?.afterParty?.pricePerPerson || 0))).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Merchandise */}
                      {(((selectedReservation.pricingSnapshot.merchandiseTotal || 0) > 0) || (isEditMode && editData?.merchandise?.length > 0)) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Merchandise</span>
                          <span className="font-bold">€{(isEditMode && editData?.merchandise?.length > 0
                            ? editData.merchandise.reduce((sum: number, item: any) => {
                                const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
                                const price = productDetails?.price || item.price || 0;
                                return sum + (price * item.quantity);
                              }, 0)
                            : selectedReservation.pricingSnapshot.merchandiseTotal || 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Discount */}
                      {selectedReservation.pricingSnapshot.discountAmount && selectedReservation.pricingSnapshot.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Korting</span>
                          <span className="font-bold">-€{selectedReservation.pricingSnapshot.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-3 border-t-2 border-green-300 dark:border-green-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900 dark:text-white">Totaal {isEditMode && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(nieuw)</span>}</span>
                      <span className="text-3xl font-black text-green-700 dark:text-green-400">€{(isEditMode && editData ? recalculatePrice() : getTotalAmount(selectedReservation))?.toFixed(2)}</span>
                    </div>
                    {isEditMode && editData && (() => {
                      const newPrice = recalculatePrice();
                      const oldPrice = getTotalAmount(selectedReservation);
                      const difference = newPrice - oldPrice;
                      if (Math.abs(difference) > 0.01) {
                        return (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-bold flex items-center justify-between ${
                            difference > 0 
                              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          }`}>
                            <span>Oorspronkelijk: €{oldPrice.toFixed(2)}</span>
                            <span className="flex items-center gap-1">
                              {difference > 0 ? '+' : ''}€{difference.toFixed(2)}
                              {difference > 0 ? '↗' : '↘'}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {selectedReservation.invoiceNumber && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      Factuurnummer: {selectedReservation.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedReservation.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Admin Notities
                  </h3>
                  <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p><strong>Aangemaakt:</strong> {format(selectedReservation.createdAt instanceof Date ? selectedReservation.createdAt : parseISO(selectedReservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                <p><strong>Laatst gewijzigd:</strong> {format(selectedReservation.updatedAt instanceof Date ? selectedReservation.updatedAt : parseISO(selectedReservation.updatedAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                {selectedReservation.checkedInAt && (
                  <p><strong>Ingecheckt:</strong> {format(selectedReservation.checkedInAt instanceof Date ? selectedReservation.checkedInAt : parseISO(selectedReservation.checkedInAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                )}
              </div>
            </div>

            {/* Modal Footer - Acties */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {/* Primary Actions Row */}
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSelectedReservationId(null);
                    setShowDeleteConfirm(false);
                    setIsEditMode(false);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Sluiten
                </button>

                <div className="flex gap-2">
                  {/* Status Actions */}
                  {selectedReservation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleConfirm(selectedReservation.id);
                        }}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processingIds.has(selectedReservation.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        Bevestigen
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedReservation.id);
                        }}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Afwijzen
                      </button>
                    </>
                  )}
                  
                  {/* Email Action - Dropdown Menu */}
                  <div className="relative email-menu-container">
                    <button 
                      onClick={() => setShowEmailMenu(!showEmailMenu)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                      <ChevronRight className={`w-4 h-4 transition-transform ${showEmailMenu ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showEmailMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 min-w-[280px] z-50">
                        <button
                          onClick={() => handleSendEmail('status')}
                          disabled={processingIds.has(selectedReservation.id)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 disabled:opacity-50"
                        >
                          <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">Status Email</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {selectedReservation.status === 'pending' ? 'Aanvraag ontvangen' :
                               selectedReservation.status === 'confirmed' ? 'Reservering bevestigd' :
                               selectedReservation.status === 'option' ? 'Optie vastgelegd' :
                               'Huidige status'}
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleSendEmail('booking-confirmed')}
                          disabled={processingIds.has(selectedReservation.id)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 disabled:opacity-50"
                        >
                          <CheckCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">Boeking Goedgekeurd</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Aanvraag is goedgekeurd en bevestigd
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleSendEmail('payment')}
                          disabled={processingIds.has(selectedReservation.id)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 disabled:opacity-50"
                        >
                          <DollarSign className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">Betalingsbevestiging</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Betaling ontvangen (€{((selectedReservation.payments || []).reduce((sum, p) => sum + p.amount, 0)).toFixed(2)})
                            </div>
                          </div>
                        </button>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                        
                        <button
                          onClick={() => setShowEmailMenu(false)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm text-slate-500 dark:text-slate-400"
                        >
                          Annuleren
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Action */}
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Betaling Registreren
                  </button>
                </div>
              </div>

              {/* Secondary Actions Row */}
              <div className="px-6 py-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Left Side - Editing */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      <FileEdit className="w-4 h-4" />
                      {isEditMode ? 'Stoppen' : 'Bewerken'}
                    </button>
                    
                    {isEditMode && (
                      <button
                        onClick={handleSaveEdit}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {processingIds.has(selectedReservation.id) ? 'Bezig...' : 'Opslaan'}
                      </button>
                    )}
                  </div>

                  {/* Right Side - Danger Actions */}
                  <div className="flex gap-2">
                    {selectedReservation.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(selectedReservation.id)}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Annuleren
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleArchive(selectedReservation.id)}
                      disabled={processingIds.has(selectedReservation.id)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archiveren
                    </button>
                    
                    <button
                      onClick={() => handleDelete(selectedReservation.id)}
                      disabled={processingIds.has(selectedReservation.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                        showDeleteConfirm
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                      {showDeleteConfirm ? 'Zeker? Klik nogmaals!' : 'Verwijderen'}
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Warning */}
                {showDeleteConfirm && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-900 dark:text-red-100">
                        ⚠️ Permanent Verwijderen
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Deze actie kan niet ongedaan gemaakt worden. Klik nogmaals op "Verwijderen" om te bevestigen.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      ) : null}

      {/* ====================================================================== */}
      {/* HEADER */}
      {/* ====================================================================== */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Reserveringen
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Beheer alle reserveringen en opties
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualBooking(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                <FileEdit className="w-4 h-4" />
                <span>Nieuwe Reservering</span>
              </button>

              <button
                onClick={() => {
                  console.log('🔍 [DEBUG] All Reservations:', reservations);
                  console.log('🔍 [DEBUG] Stats:', stats);
                  alert(`Totaal: ${reservations.length} reserveringen\nPending: ${stats.pending}\nConfirmed: ${stats.confirmed}\n\nCheck console voor details`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-sm transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Debug</span>
              </button>
              
              <button
                onClick={() => {
                  loadReservations();
                  loadEvents();
                }}
                disabled={isLoadingReservations}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-4 h-4", isLoadingReservations && "animate-spin")} />
                <span className="hidden sm:inline">Ververs</span>
              </button>
            </div>
          </div>



          {/* Main Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <button
              onClick={() => setMainTab('reserveringen')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-t-lg font-black text-sm transition-all',
                mainTab === 'reserveringen'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Calendar className="w-5 h-5" />
              Reserveringen
              {(stats.pending + stats.confirmed) > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.pending + stats.confirmed}
                </span>
              )}
            </button>

            <button
              onClick={() => setMainTab('betalingen')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-t-lg font-black text-sm transition-all',
                mainTab === 'betalingen'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Betalingen
              {(() => {
                const overdueCount = activeReservations.filter(r => calculatePaymentSummary(r).isOverdue).length;
                return overdueCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-black animate-pulse">
                    {overdueCount}
                  </span>
                );
              })()}
            </button>

            <button
              onClick={() => setMainTab('opties')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-t-lg font-black text-sm transition-all',
                mainTab === 'opties'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Clock className="w-5 h-5" />
              Opties
              {(() => {
                const expiringCount = activeReservations.filter(r => isExpiringSoon(r) || isExpired(r)).length;
                return expiringCount > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                    {expiringCount}
                  </span>
                );
              })()}
            </button>

            <button
              onClick={() => setMainTab('archief')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-t-lg font-black text-sm transition-all',
                mainTab === 'archief'
                  ? 'bg-slate-600 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Archive className="w-5 h-5" />
              Archief
              {(() => {
                const archivedCount = reservations.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;
                return archivedCount > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                    {archivedCount}
                  </span>
                );
              })()}
            </button>
          </div>

          {/* Sub-navigation based on active main tab */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {mainTab === 'reserveringen' && (
              <>
                <button onClick={() => setReserveringenTab('dashboard')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'dashboard' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />Dashboard
                </button>
                <button onClick={() => setReserveringenTab('pending')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'pending' ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  <Clock className="w-4 h-4 inline mr-2" />Pending {stats.pending > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{stats.pending}</span>}
                </button>
                <button onClick={() => setReserveringenTab('confirmed')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'confirmed' ? 'bg-green-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />Bevestigd {stats.confirmed > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{stats.confirmed}</span>}
                </button>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
                <button onClick={() => setReserveringenTab('all')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'all' ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Alle</button>
                <button onClick={() => setReserveringenTab('today')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'today' ? 'bg-purple-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Vandaag</button>
                <button onClick={() => setReserveringenTab('week')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'week' ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Week</button>
                <button onClick={() => setReserveringenTab('month')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', reserveringenTab === 'month' ? 'bg-teal-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Maand</button>
              </>
            )}

            {mainTab === 'betalingen' && (
              <>
                <button onClick={() => setBetalingenTab('overview')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', betalingenTab === 'overview' ? 'bg-emerald-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Overzicht</button>
                <button onClick={() => setBetalingenTab('overdue')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', betalingenTab === 'overdue' ? 'bg-red-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  🔴 Te Laat {(() => { const c = activeReservations.filter(r => calculatePaymentSummary(r).isOverdue).length; return c > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{c}</span>; })()}
                </button>
                <button onClick={() => setBetalingenTab('unpaid')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', betalingenTab === 'unpaid' ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  🟡 Onbetaald
                </button>
                <button onClick={() => setBetalingenTab('partial')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', betalingenTab === 'partial' ? 'bg-yellow-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  🟡 Deelbetaling
                </button>
                <button onClick={() => setBetalingenTab('history')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', betalingenTab === 'history' ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Historie</button>
              </>
            )}

            {mainTab === 'opties' && (
              <>
                <button onClick={() => setOptiesTab('overview')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', optiesTab === 'overview' ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Overzicht</button>
                <button onClick={() => setOptiesTab('expiring')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', optiesTab === 'expiring' ? 'bg-orange-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  ⏰ Verloopt Snel {(() => { const c = activeReservations.filter(r => isExpiringSoon(r)).length; return c > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{c}</span>; })()}
                </button>
                <button onClick={() => setOptiesTab('expired')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', optiesTab === 'expired' ? 'bg-red-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
                  ❌ Verlopen
                </button>
                <button onClick={() => setOptiesTab('all')} className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', optiesTab === 'all' ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>Alle Opties</button>
              </>
            )}

            {mainTab === 'archief' && (
              <>
                <button className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-600 text-white">
                  🗄️ Alle Gearchiveerde Items
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================================== */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Loading Overlay */}
        {isLoadingReservations && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Gegevens laden...
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6">
          {/* RESERVERINGEN TAB */}
          {mainTab === 'reserveringen' && reserveringenTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Debug Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  📊 Debug Info: {activeReservations.length} actieve reserveringen ({reservations.length} totaal, {reservations.length - activeReservations.length} verlopen)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Events: {activeEvents.length} actief van {events.length} totaal
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  const colorMap: Record<string, string> = {
                    blue: 'from-blue-500 to-blue-600',
                    orange: 'from-orange-500 to-orange-600',
                    green: 'from-green-500 to-green-600',
                    red: 'from-red-500 to-red-600'
                  };

                  return (
                    <button
                      key={index}
                      onClick={stat.onClick}
                      className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
                    >
                      {/* Background gradient */}
                      <div className={cn(
                        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity rounded-full -mr-16 -mt-16',
                        colorMap[stat.color]
                      )} />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            'p-3 bg-gradient-to-br rounded-xl shadow-lg',
                            colorMap[stat.color]
                          )}>
                            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                          {stat.value > 0 && (
                            <div className={cn(
                              'px-3 py-1 bg-gradient-to-br rounded-lg text-white font-black text-xs',
                              colorMap[stat.color]
                            )}>
                              {stat.value}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            {stat.label}
                          </h3>
                          <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stat.value}
                          </p>
                          {stat.trend && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                              {stat.trend}
                            </p>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>

              {/* Payment & Expiration Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Status Widget */}
                {(() => {
                  const paymentStats = activeReservations.reduce((acc, r) => {
                    const summary = calculatePaymentSummary(r);
                    if (summary.isOverdue) acc.overdue++;
                    else if (summary.status === 'unpaid') acc.unpaid++;
                    else if (summary.status === 'partial') acc.partial++;
                    acc.totalOutstanding += summary.balance;
                    return acc;
                  }, { overdue: 0, unpaid: 0, partial: 0, totalOutstanding: 0 });

                  return (
                    <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black">💰 Betalingen</h3>
                        <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
                          {paymentStats.overdue + paymentStats.unpaid + paymentStats.partial} openstaand
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-2xl font-black">{paymentStats.overdue}</p>
                          <p className="text-xs font-bold text-white/80">Te Laat</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-2xl font-black">{paymentStats.unpaid}</p>
                          <p className="text-xs font-bold text-white/80">Onbetaald</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-2xl font-black">{paymentStats.partial}</p>
                          <p className="text-xs font-bold text-white/80">Deelbetaling</p>
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-3">
                        <p className="text-sm font-bold text-white/80 mb-1">Totaal Openstaand</p>
                        <p className="text-3xl font-black">€{paymentStats.totalOutstanding.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Expiration Widget */}
                {(() => {
                  const expirationStats = activeReservations.reduce((acc, r) => {
                    if (isExpired(r)) acc.expired++;
                    else if (isExpiringSoon(r)) acc.expiring++;
                    return acc;
                  }, { expiring: 0, expired: 0 });

                  return (
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 text-white shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black">⏰ Opties</h3>
                        <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
                          {expirationStats.expiring + expirationStats.expired} aandacht
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-lg p-4">
                          <p className="text-3xl font-black mb-1">{expirationStats.expiring}</p>
                          <p className="text-xs font-bold text-white/80">Verloopt Binnenkort</p>
                          <p className="text-xs text-white/60 mt-1">Binnen 7 dagen</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <p className="text-3xl font-black mb-1">{expirationStats.expired}</p>
                          <p className="text-xs font-bold text-white/80">Verlopen</p>
                          <p className="text-xs text-white/60 mt-1">Actie vereist</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white/80 uppercase tracking-wide mb-2">
                      Omzet Vandaag
                    </p>
                    <p className="text-4xl font-black mb-1">
                      €{stats.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-white/70 font-medium">
                      Betaalde reserveringen vandaag
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* ✨ NEW: Advanced Analytics */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  📊 Geavanceerde Analytics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Conversion Rate */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Conversie Rate</span>
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mb-1">
                      {stats.conversionRate}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Opties → Bevestigd
                    </p>
                  </div>

                  {/* Average Group Size */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Gem. Groepsgrootte</span>
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-purple-700 dark:text-purple-300 mb-1">
                      {stats.avgGroupSize}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Gasten per boeking
                    </p>
                  </div>

                  {/* Cancellation Rate */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Annulering Rate</span>
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-red-700 dark:text-red-300 mb-1">
                      {stats.cancellationRate}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Van alle boekingen
                    </p>
                  </div>
                </div>

                {/* Status Overview Bar */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Status Overzicht</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Pending: {stats.pending}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Opties: {stats.options}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Bevestigd: {stats.confirmed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Checked-in: {stats.checkedIn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Geannuleerd: {stats.cancelled}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Shows */}
              {upcomingBookings.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                          Vandaag & Morgen
                        </h2>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-black rounded-lg">
                        {upcomingBookings.length} boekingen
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {upcomingBookings.slice(0, 5).map((reservation) => {
                      const event = events.find(e => e.id === reservation.eventId);
                      if (!event) return null;

                      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                      const isNow = isToday(eventDate);

                      return (
                        <div 
                          key={reservation.id}
                          className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {isNow ? (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-black uppercase rounded">
                                    Vandaag
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-orange-500 text-white text-xs font-black uppercase rounded">
                                    Morgen
                                  </span>
                                )}
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                  {format(eventDate, 'HH:mm', { locale: nl })}
                                </span>
                              </div>
                              <p className="text-base font-bold text-slate-900 dark:text-white mb-1 truncate">
                                {reservation.companyName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Euro className="w-4 h-4" />
                                  €{getTotalAmount(reservation)?.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors">
                              <Eye className="w-4 h-4" />
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REQUESTS VIEW - Gecombineerd (pending + request status) */}
          {mainTab === 'reserveringen' && reserveringenTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Aanvragen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stats.pending} boekingen wachten op bevestiging
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Zoek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                let requestReservations = activeReservations.filter(r => r.status === 'pending' || r.status === 'request');
                
                console.log('📋 [OCC] Requests view:', {
                  total: activeReservations.length,
                  requests: requestReservations.length,
                  expired: reservations.length - activeReservations.length
                });
                
                return requestReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      Alles up-to-date!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Er zijn geen nieuwe aanvragen op dit moment.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {activeReservations.length} actieve reserveringen ({reservations.length - activeReservations.length} verlopen)
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {requestReservations.map((reservation) => {
                      const event = activeEvents.find(e => e.id === reservation.eventId);
                      
                      return (
                        <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className={cn(
                                  "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                  reservation.status === 'pending'
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                )}>
                                  {reservation.status === 'pending' ? 'Nieuw' : 'Request'}
                                </span>
                                {(() => {
                                  const summary = calculatePaymentSummary(reservation);
                                  const badge = getPaymentStatusBadge(summary);
                                  return (
                                    <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg border ${badge.color}`}>
                                      {badge.icon} {badge.label}
                                    </span>
                                  );
                                })()}
                                {isExpiringSoon(reservation) && (
                                  <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                                    ⏰ Verloopt Binnenkort
                                  </span>
                                )}
                                {isExpired(reservation) && (
                                  <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700">
                                    ❌ Verlopen
                                  </span>
                                )}
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  {format(reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}
                                </span>
                              </div>

                              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                {reservation.companyName}
                              </h3>

                              {/* 🏷️ Tag Badges */}
                              {reservation.tags && reservation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {reservation.tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} />
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{reservation.email}</span>
                                </div>
                                {reservation.phone && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span>{reservation.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span>{event ? format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'dd MMM yyyy HH:mm', { locale: nl }) : 'Event niet gevonden'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}</span>
                                </div>
                                {reservation.merchandise && reservation.merchandise.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Package className="w-4 h-4 flex-shrink-0" />
                                    <span>{reservation.merchandise.length} merchandise {reservation.merchandise.length === 1 ? 'item' : 'items'}</span>
                                  </div>
                                )}
                              </div>

                              {/* Merchandise Preview */}
                              {reservation.merchandise && reservation.merchandise.length > 0 && (
                                <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">🛍️ Merchandise:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {reservation.merchandise.slice(0, 3).map((item: any, idx: number) => {
                                      const productDetails = getMerchandiseItemDetails(item.itemId || item.id, item.name);
                                      const uniqueKey = `merch-pending-${reservation.id}-${item.itemId || item.id || item.name || 'item'}-${idx}`;
                                      return (
                                        <span key={uniqueKey} className="text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-700 text-slate-700 dark:text-slate-300">
                                          {productDetails?.name || item.name} ({item.quantity}x)
                                        </span>
                                      );
                                    })}
                                    {reservation.merchandise.length > 3 && (
                                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-300 font-bold">
                                        +{reservation.merchandise.length - 3} meer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                                  <Euro className="w-4 h-4" />
                                  <span className="font-black">€{getTotalAmount(reservation)?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => handleConfirm(reservation.id)}
                                disabled={processingIds.has(reservation.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:cursor-not-allowed"
                              >
                                {processingIds.has(reservation.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCheck className="w-4 h-4" />
                                )}
                                Bevestigen
                              </button>
                              <button 
                                onClick={() => setSelectedReservationId(reservation.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </button>
                              <button 
                                onClick={() => handleResendEmail(reservation.id)}
                                disabled={processingIds.has(reservation.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processingIds.has(reservation.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                                Email
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedReservationId(reservation.id);
                                  setShowPaymentModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <DollarSign className="w-4 h-4" />
                                Betaling
                              </button>
                              <button 
                                onClick={() => handleReject(reservation.id)}
                                disabled={processingIds.has(reservation.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processingIds.has(reservation.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Afwijzen
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* CONFIRMED VIEW */}
          {mainTab === 'reserveringen' && reserveringenTab === 'confirmed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Bevestigde Boekingen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stats.confirmed} actieve bevestigde reserveringen
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Zoek bedrijf..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const confirmedReservations = activeReservations
                  .filter(r => r.status === 'confirmed')
                  .filter(r => !searchQuery || r.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => {
                  const dateA = a.eventDate instanceof Date ? a.eventDate : parseISO(a.eventDate as any);
                  const dateB = b.eventDate instanceof Date ? b.eventDate : parseISO(b.eventDate as any);
                  return dateA.getTime() - dateB.getTime();
                });

                return confirmedReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {searchQuery ? 'Geen resultaten' : 'Geen bevestigde boekingen'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Probeer een andere zoekopdracht' : 'Er zijn momenteel geen bevestigde reserveringen'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {confirmedReservations.map((reservation) => {
                      const event = activeEvents.find(e => e.id === reservation.eventId);
                      const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;
                      const resDate = reservation.eventDate instanceof Date ? reservation.eventDate : parseISO(reservation.eventDate as any);
                      const isPast = eventDate ? eventDate < new Date() : resDate < new Date();

                      return (
                        <div 
                          key={reservation.id} 
                          className={cn(
                            "p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                            isPast && "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-black uppercase rounded-lg">
                                  ✓ Bevestigd
                                </span>
                                {(() => {
                                  const summary = calculatePaymentSummary(reservation);
                                  const badge = getPaymentStatusBadge(summary);
                                  return (
                                    <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg border ${badge.color}`}>
                                      {badge.icon} {badge.label}
                                    </span>
                                  );
                                })()}
                                {isExpiringSoon(reservation) && (
                                  <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                                    ⏰ Verloopt Binnenkort
                                  </span>
                                )}
                                {isExpired(reservation) && (
                                  <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700">
                                    ❌ Verlopen
                                  </span>
                                )}
                                {eventDate && (
                                  <span className={cn(
                                    "text-sm font-bold",
                                    isToday(eventDate) ? "text-red-600 dark:text-red-400" :
                                    isTomorrow(eventDate) ? "text-orange-600 dark:text-orange-400" :
                                    isPast ? "text-slate-400" :
                                    "text-slate-600 dark:text-slate-400"
                                  )}>
                                    {isToday(eventDate) ? '🔴 VANDAAG' :
                                     isTomorrow(eventDate) ? '🟠 MORGEN' :
                                     isPast ? '✓ Afgelopen' :
                                     format(eventDate, 'dd MMM yyyy', { locale: nl })}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                {reservation.companyName}
                              </h3>

                              {/* 🏷️ Tag Badges */}
                              {reservation.tags && reservation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {reservation.tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} />
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.contactPerson}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{reservation.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Package className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.numberOfPersons} personen • {reservation.arrangement}</span>
                                </div>
                                {eventDate && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>{format(eventDate, 'dd MMM yyyy HH:mm', { locale: nl })}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                                  <Euro className="w-4 h-4" />
                                  <span className="font-black">€{getTotalAmount(reservation)?.toFixed(2)}</span>
                                </div>
                                {reservation.paymentStatus && (
                                  <span className={cn(
                                    "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                    reservation.paymentStatus === 'paid' 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                      : reservation.paymentStatus === 'pending'
                                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  )}>
                                    {reservation.paymentStatus === 'paid' ? '✓ Betaald' :
                                     reservation.paymentStatus === 'pending' ? 'Te betalen' :
                                     reservation.paymentStatus}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => {
                                  console.log('🖱️ Details button clicked for:', reservation.id);
                                  setSelectedReservationId(reservation.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </button>
                              <button 
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Send className="w-4 h-4" />
                                Email
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedReservationId(reservation.id);
                                  setShowPaymentModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <DollarSign className="w-4 h-4" />
                                Betaling
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}



          {/* ALL VIEW - Alle reserveringen met filtering */}
          {mainTab === 'reserveringen' && reserveringenTab === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Alle Reserveringen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {activeReservations.length} actieve reserveringen
                    {selectedReservationIds.size > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                        {selectedReservationIds.size} geselecteerd
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Zoek op naam, email, telefoon..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* ✨ NEW: Advanced Filters */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Date Range */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Van:
                    </label>
                    <input
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Tot:
                    </label>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Payment Status Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Betaling:
                    </label>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Alle</option>
                      <option value="paid">Betaald</option>
                      <option value="unpaid">Onbetaald</option>
                      <option value="partial">Deelbetaald</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Lijst weergave"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Grid weergave"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Clear Filters */}
                  {(dateRangeStart || dateRangeEnd || paymentStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setDateRangeStart('');
                        setDateRangeEnd('');
                        setPaymentStatusFilter('all');
                      }}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Filters wissen
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedReservationIds.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-blue-900 dark:text-blue-100">
                        Bulk Acties
                      </h3>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {selectedReservationIds.size} reservering(en) geselecteerd
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkConfirm}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Bevestigen
                      </button>
                      <button
                        onClick={handleBulkMarkAsPaid}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        💰 Markeer als Betaald
                      </button>
                      <button
                        onClick={handleOpenMergeModal}
                        disabled={selectedReservationIds.size < 2}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={selectedReservationIds.size < 2 ? 'Selecteer minimaal 2 reserveringen' : 'Voeg reserveringen samen'}
                      >
                        🔗 Samenvoegen
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Afwijzen
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Verwijderen
                      </button>
                      <button
                        onClick={() => setSelectedReservationIds(new Set())}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                      >
                        Deselecteren
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ✨ NEW: Export Button - Standalone */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const toExport = selectedReservationIds.size > 0
                      ? activeReservations.filter(r => selectedReservationIds.has(r.id))
                      : activeReservations;
                    handleExportCSV(toExport);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporteer naar CSV ({selectedReservationIds.size > 0 ? selectedReservationIds.size : activeReservations.length} reserveringen)
                </button>
              </div>

              {(() => {
                const filteredReservations = activeReservations.filter(r => {
                  // Search filter
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
                    const companyName = (r.companyName || '').toLowerCase();
                    const matchesSearch = 
                      fullName.includes(query) ||
                      companyName.includes(query) ||
                      (r.email || '').toLowerCase().includes(query) ||
                      (r.phone || '').toLowerCase().includes(query) ||
                      r.id.toLowerCase().includes(query);
                    if (!matchesSearch) return false;
                  }

                  // ✨ Date range filter
                  if (dateRangeStart || dateRangeEnd) {
                    const event = activeEvents.find(e => e.id === r.eventId);
                    if (event) {
                      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                      if (dateRangeStart) {
                        const startDate = parseISO(dateRangeStart);
                        if (eventDate < startDate) return false;
                      }
                      if (dateRangeEnd) {
                        const endDate = parseISO(dateRangeEnd);
                        if (eventDate > endDate) return false;
                      }
                    }
                  }

                  // ✨ Payment status filter
                  if (paymentStatusFilter !== 'all') {
                    const summary = calculatePaymentSummary(r);
                    if (paymentStatusFilter === 'paid' && summary.status !== 'paid') return false;
                    if (paymentStatusFilter === 'unpaid' && summary.status !== 'unpaid') return false;
                    if (paymentStatusFilter === 'partial' && summary.status !== 'partial') return false;
                  }

                  return true;
                }).sort((a, b) => {
                  const dateA = a.createdAt instanceof Date ? a.createdAt : parseISO(a.createdAt as any);
                  const dateB = b.createdAt instanceof Date ? b.createdAt : parseISO(b.createdAt as any);
                  return dateB.getTime() - dateA.getTime();
                });

                return filteredReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {searchQuery ? 'Geen resultaten' : 'Geen reserveringen'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Probeer een andere zoekterm' : 'Er zijn nog geen reserveringen'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* ✨ GRID VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReservations.map((reservation) => {
                      const event = activeEvents.find(e => e.id === reservation.eventId);
                      const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;
                      const paymentSummary = calculatePaymentSummary(reservation);
                      const badge = getPaymentStatusBadge(paymentSummary);

                      return (
                        <div 
                          key={reservation.id}
                          className={cn(
                            "bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all cursor-pointer",
                            selectedReservationIds.has(reservation.id) && "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          )}
                          onClick={() => setSelectedReservationId(reservation.id)}
                        >
                          {/* Checkbox */}
                          <div className="flex items-start justify-between mb-4">
                            <input
                              type="checkbox"
                              checked={selectedReservationIds.has(reservation.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectReservation(reservation.id);
                              }}
                              className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-lg border-2",
                              reservation.status === 'confirmed' && "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300",
                              reservation.status === 'pending' && "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300",
                              reservation.status === 'option' && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300",
                              reservation.status === 'checked-in' && "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300",
                              reservation.status === 'cancelled' && "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300"
                            )}>
                              {reservation.status === 'confirmed' && '✓ Bevestigd'}
                              {reservation.status === 'pending' && '⏰ Pending'}
                              {reservation.status === 'option' && '💭 Optie'}
                              {reservation.status === 'checked-in' && '✅ Checked-in'}
                              {reservation.status === 'cancelled' && '❌ Geannuleerd'}
                            </span>
                          </div>

                          {/* Name & Company */}
                          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                            {reservation.firstName} {reservation.lastName}
                          </h3>
                          {reservation.companyName && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3">
                              {reservation.companyName}
                            </p>
                          )}

                          {/* Event Date */}
                          {eventDate && (
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
                              <Calendar className="w-4 h-4" />
                              {format(eventDate, 'EEEE d MMMM yyyy', { locale: nl })}
                            </div>
                          )}

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-bold">{reservation.numberOfPersons} gasten</span>
                            </div>
                            {reservation.merchandise && Array.isArray(reservation.merchandise) && reservation.merchandise.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold">{reservation.merchandise.length}x merch</span>
                              </div>
                            )}
                          </div>

                          {/* Payment Status */}
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Totaal:</span>
                              <span className="text-lg font-black text-slate-900 dark:text-white">
                                €{getTotalAmount(reservation)?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black uppercase rounded-lg border ${badge.color}`}>
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ✨ LIST VIEW (Original Table) */
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-center w-12">
                              <input
                                type="checkbox"
                                checked={selectedReservationIds.size === filteredReservations.length && filteredReservations.length > 0}
                                onChange={() => toggleSelectAll(filteredReservations)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Naam</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Gasten</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Merch</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Prijs</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Betaling</th>
                            <th className="px-4 py-3 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Tags</th>
                            <th className="px-4 py-3 text-right text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Acties</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredReservations.map((reservation) => {
                            const event = activeEvents.find(e => e.id === reservation.eventId);
                            const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;

                            return (
                              <tr key={reservation.id} className={cn(
                                "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                selectedReservationIds.has(reservation.id) && "bg-blue-50 dark:bg-blue-900/20"
                              )}>
                                <td className="px-4 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedReservationIds.has(reservation.id)}
                                    onChange={() => toggleSelectReservation(reservation.id)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded-lg border-2 shadow-sm",
                                    reservation.status === 'confirmed' && "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
                                    reservation.status === 'pending' && "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
                                    reservation.status === 'cancelled' && "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                                  )}>
                                    {reservation.status === 'confirmed' && (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Bevestigd</span>
                                      </>
                                    )}
                                    {reservation.status === 'pending' && (
                                      <>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>In Afwachting</span>
                                      </>
                                    )}
                                    {reservation.status === 'cancelled' && (
                                      <>
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Geannuleerd</span>
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="font-bold text-slate-900 dark:text-white">{reservation.firstName} {reservation.lastName}</div>
                                  {reservation.companyName && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{reservation.companyName}</div>
                                  )}
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{reservation.email}</div>
                                </td>
                                <td className="px-4 py-4">
                                  {eventDate && (
                                    <div className="text-sm text-slate-900 dark:text-white">
                                      {format(eventDate, 'dd MMM yyyy', { locale: nl })}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                                    <Users className="w-4 h-4" />
                                    <span className="font-bold">{reservation.numberOfPersons}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {reservation.merchandise && reservation.merchandise.length > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                        {reservation.merchandise.length}x
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    €{getTotalAmount(reservation)?.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {(() => {
                                    const summary = calculatePaymentSummary(reservation);
                                    const badge = getPaymentStatusBadge(summary);
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-black uppercase rounded border ${badge.color}`}>
                                          <span>{badge.icon}</span>
                                          <span>{badge.label}</span>
                                        </span>
                                        {summary.balance > 0 && (
                                          <span className="text-xs text-slate-600 dark:text-slate-400">
                                            €{summary.balance.toFixed(2)} openstaand
                                          </span>
                                        )}
                                        {summary.isOverdue && (
                                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                                            ⚠️ Te laat!
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {reservation.tags?.slice(0, 2).map((tag) => (
                                      <TagBadge key={tag} tag={tag} />
                                    ))}
                                    {reservation.tags && reservation.tags.length > 2 && (
                                      <span className="text-xs text-slate-500">+{reservation.tags.length - 2}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex justify-end gap-2">
                                    {(() => {
                                      const summary = calculatePaymentSummary(reservation);
                                      const isPaid = summary.status === 'paid' || summary.status === 'overpaid';
                                      return (
                                        <button
                                          onClick={() => {
                                            setSelectedReservationId(reservation.id);
                                            if (!isPaid) {
                                              setTimeout(() => setShowPaymentModal(true), 100);
                                            }
                                          }}
                                          className={cn(
                                            "p-2 rounded-lg transition-all font-bold",
                                            isPaid 
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50" 
                                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                          )}
                                          title={isPaid ? "Volledig Betaald" : "Betaling Registreren"}
                                        >
                                          💰
                                        </button>
                                      );
                                    })()}
                                    <button
                                      onClick={() => setSelectedReservationId(reservation.id)}
                                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                      title="Details"
                                    >
                                      <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TODAY VIEW - Reserveringen vandaag */}
          {mainTab === 'reserveringen' && reserveringenTab === 'today' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  Reserveringen Vandaag
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: nl })}
                </p>
              </div>

              {(() => {
                const todayReservations = activeReservations.filter(r => {
                  const event = activeEvents.find(e => e.id === r.eventId);
                  if (!event) return false;
                  const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                  return isToday(eventDate);
                }).sort((a, b) => {
                  const eventA = activeEvents.find(e => e.id === a.eventId);
                  const eventB = activeEvents.find(e => e.id === b.eventId);
                  if (!eventA || !eventB) return 0;
                  const dateA = eventA.date instanceof Date ? eventA.date : parseISO(eventA.date as any);
                  const dateB = eventB.date instanceof Date ? eventB.date : parseISO(eventB.date as any);
                  return dateA.getTime() - dateB.getTime();
                });

                const totalGuests = todayReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);

                return todayReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      Geen voorstellingen vandaag
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Er zijn geen geplande voorstellingen voor vandaag
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Totaal Reserveringen</div>
                        <div className="text-3xl font-black">{todayReservations.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Totaal Gasten</div>
                        <div className="text-3xl font-black">{totalGuests}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Bevestigd</div>
                        <div className="text-3xl font-black">
                          {todayReservations.filter(r => r.status === 'confirmed').length}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {todayReservations.map((reservation) => {
                        const event = activeEvents.find(e => e.id === reservation.eventId);
                        const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;

                        return (
                          <div 
                            key={reservation.id}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {eventDate && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-black rounded-lg">
                                      {format(eventDate, 'HH:mm', { locale: nl })}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "px-3 py-1 text-sm font-black rounded-lg",
                                    reservation.status === 'confirmed' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                    reservation.status === 'pending' && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  )}>
                                    {reservation.status === 'confirmed' ? 'BEVESTIGD' : 'PENDING'}
                                  </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                                  {reservation.firstName} {reservation.lastName}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{reservation.numberOfPersons} gasten</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    <span>{reservation.arrangement}</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-bold">
                                    <Euro className="w-4 h-4" />
                                    <span>€{getTotalAmount(reservation)?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedReservationId(reservation.id);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Betaling
                                </button>
                                <button
                                  onClick={() => setSelectedReservationId(reservation.id)}
                                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* WEEK VIEW - Week overzicht */}
          {mainTab === 'reserveringen' && reserveringenTab === 'week' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Week Overzicht
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Week {getWeek(currentDate, { weekStartsOn: 1 })} - {format(currentDate, 'yyyy', { locale: nl })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                  >
                    Vandaag
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {(() => {
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
                const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

                return (
                  <div className="grid grid-cols-7 gap-3">
                    {days.map((day) => {
                      const dayReservations = activeReservations.filter(r => {
                        const event = activeEvents.find(e => e.id === r.eventId);
                        if (!event) return false;
                        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                        return format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                      });

                      const totalGuests = dayReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "bg-white dark:bg-slate-900 rounded-xl border p-4 min-h-[200px]",
                            isToday 
                              ? "border-blue-500 dark:border-blue-400 shadow-lg"
                              : "border-slate-200 dark:border-slate-800"
                          )}
                        >
                          <div className="mb-3">
                            <div className={cn(
                              "text-sm font-black uppercase mb-1",
                              isToday 
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400"
                            )}>
                              {format(day, 'EEE', { locale: nl })}
                            </div>
                            <div className={cn(
                              "text-2xl font-black",
                              isToday
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-900 dark:text-white"
                            )}>
                              {format(day, 'd')}
                            </div>
                          </div>

                          {dayReservations.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <Users className="w-3 h-3" />
                                <span>{totalGuests} gasten</span>
                              </div>
                              <div className="space-y-1">
                                {dayReservations.slice(0, 3).map((reservation) => (
                                  <div
                                    key={reservation.id}
                                    onClick={() => setSelectedReservationId(reservation.id)}
                                    className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                  >
                                    <div className="font-bold text-slate-900 dark:text-white truncate">
                                      {reservation.firstName} {reservation.lastName}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                      {reservation.numberOfPersons} pers.
                                    </div>
                                  </div>
                                ))}
                                {dayReservations.length > 3 && (
                                  <div className="text-xs text-center text-slate-500 dark:text-slate-400 font-bold">
                                    +{dayReservations.length - 3} meer
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-8">
                              Geen shows
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MONTH VIEW - Maand overzicht */}
          {mainTab === 'reserveringen' && reserveringenTab === 'month' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Maand Overzicht
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {format(currentDate, 'MMMM yyyy', { locale: nl })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                  >
                    Deze Maand
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {(() => {
                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(currentDate);
                const monthReservations = activeReservations.filter(r => {
                  const event = activeEvents.find(e => e.id === r.eventId);
                  if (!event) return false;
                  const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                  return eventDate >= monthStart && eventDate <= monthEnd;
                });

                const totalGuests = monthReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
                const totalRevenue = monthReservations
                  .filter(r => r.paymentStatus === 'paid')
                  .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

                // Group by week
                const weekGroups: { [key: string]: typeof monthReservations } = {};
                monthReservations.forEach(r => {
                  const event = activeEvents.find(e => e.id === r.eventId);
                  if (!event) return;
                  const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                  const weekId = getWeekId(eventDate);
                  if (!weekGroups[weekId]) weekGroups[weekId] = [];
                  weekGroups[weekId].push(r);
                });

                return (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Totaal Reserveringen</div>
                        <div className="text-3xl font-black">{monthReservations.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Totaal Gasten</div>
                        <div className="text-3xl font-black">{totalGuests}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Omzet</div>
                        <div className="text-2xl font-black">€{totalRevenue.toFixed(0)}</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                        <div className="text-sm font-bold opacity-80 mb-1">Events</div>
                        <div className="text-3xl font-black">{Object.keys(weekGroups).length}</div>
                      </div>
                    </div>

                    {Object.keys(weekGroups).length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                          Geen reserveringen deze maand
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(weekGroups)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([weekId, reservations]) => {
                            const weekGuests = reservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
                            
                            return (
                              <div key={weekId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                      {weekId}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                                      <span>{reservations.length} reserveringen</span>
                                      <span>{weekGuests} gasten</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                  {reservations.map((reservation) => {
                                    const event = activeEvents.find(e => e.id === reservation.eventId);
                                    const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;

                                    return (
                                      <div 
                                        key={reservation.id}
                                        onClick={() => setSelectedReservationId(reservation.id)}
                                        className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                              {eventDate && (
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                  {format(eventDate, 'EEE d MMM - HH:mm', { locale: nl })}
                                                </span>
                                              )}
                                              <span className={cn(
                                                "px-2 py-0.5 text-xs font-black rounded",
                                                reservation.status === 'confirmed' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                                reservation.status === 'pending' && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                              )}>
                                                {reservation.status === 'confirmed' ? '✓' : '⏳'}
                                              </span>
                                            </div>
                                            <div className="font-bold text-slate-900 dark:text-white">
                                              {reservation.firstName} {reservation.lastName}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                              <span>{reservation.numberOfPersons} gasten</span>
                                              <span>•</span>
                                              <span>{reservation.arrangement}</span>
                                              <span>•</span>
                                              <span className="font-bold">€{getTotalAmount(reservation)?.toFixed(2)}</span>
                                            </div>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedReservationId(reservation.id);
                                              setShowPaymentModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                                          >
                                            <DollarSign className="w-3 h-3" />
                                            Betaling
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ================================================================== */}
          {/* BETALINGEN TAB */}
          {/* ================================================================== */}
          {mainTab === 'betalingen' && (
            <div className="space-y-6">
              {betalingenTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-8 text-white">
                    <h2 className="text-2xl font-black mb-4">💰 Betalingen Overzicht</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {(() => {
                        const stats = activeReservations.reduce((acc, r) => {
                          const summary = calculatePaymentSummary(r);
                          if (summary.isOverdue) acc.overdue++;
                          else if (summary.status === 'unpaid') acc.unpaid++;
                          else if (summary.status === 'partial') acc.partial++;
                          else if (summary.status === 'paid') acc.paid++;
                          acc.totalOutstanding += summary.balance;
                          acc.totalRevenue += summary.netRevenue;
                          return acc;
                        }, { overdue: 0, unpaid: 0, partial: 0, paid: 0, totalOutstanding: 0, totalRevenue: 0 });

                        return (
                          <>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Te Laat</p>
                              <p className="text-4xl font-black">{stats.overdue}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Onbetaald</p>
                              <p className="text-4xl font-black">{stats.unpaid}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Deelbetaling</p>
                              <p className="text-4xl font-black">{stats.partial}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Betaald</p>
                              <p className="text-4xl font-black">{stats.paid}</p>
                            </div>
                            <div className="md:col-span-2 bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Totaal Openstaand</p>
                              <p className="text-4xl font-black">€{stats.totalOutstanding.toFixed(2)}</p>
                            </div>
                            <div className="md:col-span-2 bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Netto Omzet</p>
                              <p className="text-4xl font-black">€{stats.totalRevenue.toFixed(2)}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Recent Payments List */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-lg font-black">Recente Betalingen</h3>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {activeReservations
                        .filter(r => r.payments && r.payments.length > 0)
                        .flatMap(r => 
                          (r.payments || []).map(p => ({ ...p, reservation: r }))
                        )
                        .sort((a, b) => {
                          let dateA: Date;
                          if (a.date instanceof Date) {
                            dateA = a.date;
                          } else if (a.date && typeof a.date === 'object' && 'toDate' in a.date) {
                            dateA = (a.date as any).toDate();
                          } else {
                            dateA = new Date(a.date);
                          }
                          let dateB: Date;
                          if (b.date instanceof Date) {
                            dateB = b.date;
                          } else if (b.date && typeof b.date === 'object' && 'toDate' in b.date) {
                            dateB = (b.date as any).toDate();
                          } else {
                            dateB = new Date(b.date);
                          }
                          return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, 20)
                        .map((payment: any, idx) => (
                          <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-bold text-slate-900 dark:text-white">{payment.reservation.companyName}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {payment.date ? format(
                                    payment.date instanceof Date 
                                      ? payment.date 
                                      : payment.date.toDate 
                                        ? payment.date.toDate() 
                                        : new Date(payment.date), 
                                    'dd MMM yyyy HH:mm', 
                                    { locale: nl }
                                  ) : 'Geen datum'}
                                  {' • '}{payment.method}
                                </p>
                                {payment.note && <p className="text-xs text-slate-500 mt-1">{payment.note}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-green-600 dark:text-green-400">€{payment.amount.toFixed(2)}</p>
                                {payment.category && (
                                  <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {payment.category === 'arrangement' ? '🍽️ Arrangement' : 
                                     payment.category === 'merchandise' ? '🛍️ Merchandise' : 
                                     payment.category === 'full' ? '💯 Volledig' : '📋 Overig'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Betalingen Sub-tabs: overdue, unpaid, partial */}
              {(betalingenTab === 'overdue' || betalingenTab === 'unpaid' || betalingenTab === 'partial') && (
                <div className="space-y-4">
                  {(() => {
                    const filtered = activeReservations.filter(r => {
                      const summary = calculatePaymentSummary(r);
                      if (betalingenTab === 'overdue') return summary.isOverdue;
                      if (betalingenTab === 'unpaid') return summary.status === 'unpaid';
                      if (betalingenTab === 'partial') return summary.status === 'partial';
                      return false;
                    }).sort((a, b) => {
                      const summaryA = calculatePaymentSummary(a);
                      const summaryB = calculatePaymentSummary(b);
                      return (summaryA.daysUntilDue || 0) - (summaryB.daysUntilDue || 0);
                    });

                    const title = betalingenTab === 'overdue' ? '🔴 Te Late Betalingen' :
                                  betalingenTab === 'unpaid' ? '🟡 Onbetaalde Reserveringen' :
                                  '🟡 Deelbetalingen';

                    return filtered.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Alles up-to-date!</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Geen {betalingenTab === 'overdue' ? 'te late' : betalingenTab === 'unpaid' ? 'onbetaalde' : 'deelbetaalde'} reserveringen</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                          <h2 className="text-2xl font-black mb-2">{title}</h2>
                          <p className="text-slate-600 dark:text-slate-400">{filtered.length} reserveringen</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                          {filtered.map(reservation => {
                            const summary = calculatePaymentSummary(reservation);
                            const badge = getPaymentStatusBadge(summary);
                            return (
                              <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedReservationId(reservation.id)}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg border ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                      </span>
                                      {summary.isOverdue && (
                                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                          {Math.abs(summary.daysUntilDue!)} dagen te laat!
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{reservation.companyName}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Totaal</p>
                                        <p className="text-lg font-bold">€{summary.totalPrice.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Betaald</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">€{summary.totalPaid.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Openstaand</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">€{summary.balance.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Betaal Voor</p>
                                        <p className={`text-sm font-bold ${summary.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                          {format(summary.dueDate!, 'dd MMM', { locale: nl })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPaymentModal(true);
                                      }}
                                      className="px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                      Betaling
                                    </button>
                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                      <Eye className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* History Tab - Phase 5: Reports & Export */}
              {betalingenTab === 'history' && (
                <div className="space-y-6">
                  {/* Export Options */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-8 text-white">
                    <h2 className="text-2xl font-black mb-4">📊 Rapporten & Export</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={exportPaymentsToCSV}
                        className="bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg p-4 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="font-black text-lg">Betalingen Export</h3>
                        </div>
                        <p className="text-sm text-white/80">Exporteer alle betalingen naar CSV</p>
                      </button>

                      <button
                        onClick={exportRefundsToCSV}
                        className="bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg p-4 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                          </svg>
                          <h3 className="font-black text-lg">Restituties Export</h3>
                        </div>
                        <p className="text-sm text-white/80">Exporteer alle restituties naar CSV</p>
                      </button>

                      <button
                        onClick={exportOutstandingPaymentsReport}
                        className="bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg p-4 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <h3 className="font-black text-lg">Openstaande Betalingen</h3>
                        </div>
                        <p className="text-sm text-white/80">Rapport van openstaande bedragen</p>
                      </button>
                    </div>
                  </div>

                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(() => {
                      const allPayments = activeReservations.filter(r => r.payments && r.payments.length > 0);
                      const totalPayments = allPayments.flatMap(r => r.payments || []).length;
                      const totalPaid = allPayments.reduce((sum, r) => {
                        const payments = r.payments || [];
                        return sum + payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
                      }, 0);

                      const allRefunds = activeReservations.filter(r => r.refunds && r.refunds.length > 0);
                      const totalRefunds = allRefunds.flatMap(r => r.refunds || []).length;
                      const totalRefunded = allRefunds.reduce((sum, r) => {
                        const refunds = r.refunds || [];
                        return sum + refunds.reduce((s: number, ref: any) => s + (ref.amount || 0), 0);
                      }, 0);

                      return (
                        <>
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Totaal Betalingen</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalPayments}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Totaal Ontvangen</p>
                            <p className="text-3xl font-black text-green-600 dark:text-green-400">€{totalPaid.toFixed(2)}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Totaal Restituties</p>
                            <p className="text-3xl font-black text-red-600 dark:text-red-400">{totalRefunds}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Netto Omzet</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">€{(totalPaid - totalRefunded).toFixed(2)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Monthly Summary */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-xl font-black mb-4">📅 Maandelijks Overzicht</h3>
                    <div className="space-y-4">
                      {(() => {
                        const now = new Date();
                        const last6Months = Array.from({ length: 6 }, (_, i) => {
                          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          return {
                            month: format(date, 'MMMM yyyy', { locale: nl }),
                            payments: activeReservations
                              .flatMap(r => (r.payments || []).map((p: any) => ({ ...p, reservation: r })))
                              .filter((p: any) => {
                                const paymentDate = p.date instanceof Date ? p.date : new Date(p.date);
                                return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
                              }),
                            refunds: activeReservations
                              .flatMap(r => (r.refunds || []).map((ref: any) => ({ ...ref, reservation: r })))
                              .filter((ref: any) => {
                                const refundDate = ref.date instanceof Date ? ref.date : new Date(ref.date);
                                return refundDate.getMonth() === date.getMonth() && refundDate.getFullYear() === date.getFullYear();
                              })
                          };
                        });

                        return last6Months.map((month, idx) => {
                          const totalPaid = month.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                          const totalRefunded = month.refunds.reduce((sum: number, r: any) => sum + r.amount, 0);
                          const netRevenue = totalPaid - totalRefunded;

                          return (
                            <div key={idx} className="border-b border-slate-200 dark:border-slate-800 last:border-0 pb-4 last:pb-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white">{month.month}</h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {month.payments.length} betalingen • {month.refunds.length} restituties
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-green-600 dark:text-green-400">€{totalPaid.toFixed(2)}</p>
                                  {totalRefunded > 0 && (
                                    <p className="text-sm text-red-600 dark:text-red-400">-€{totalRefunded.toFixed(2)}</p>
                                  )}
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Netto: €{netRevenue.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* OPTIES TAB */}
          {/* ================================================================== */}
          {mainTab === 'opties' && (
            <div className="space-y-6">
              {optiesTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-8 text-white">
                    <h2 className="text-2xl font-black mb-4">⏰ Opties Overzicht</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const stats = activeReservations.reduce((acc, r) => {
                          if (r.status === 'option') {
                            acc.total++;
                            if (isExpired(r)) acc.expired++;
                            else if (isExpiringSoon(r)) acc.expiring++;
                            else acc.active++;
                          }
                          return acc;
                        }, { total: 0, active: 0, expiring: 0, expired: 0 });

                        return (
                          <>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Actieve Opties</p>
                              <p className="text-4xl font-black">{stats.active}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Verloopt Binnenkort</p>
                              <p className="text-4xl font-black">{stats.expiring}</p>
                              <p className="text-xs text-white/70 mt-1">Binnen 7 dagen</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                              <p className="text-sm font-bold text-white/80 mb-2">Verlopen</p>
                              <p className="text-4xl font-black">{stats.expired}</p>
                              <p className="text-xs text-white/70 mt-1">Actie vereist</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* All Options List */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {activeReservations
                      .filter(r => r.status === 'option')
                      .sort((a, b) => {
                        if (!a.optionExpiresAt || !b.optionExpiresAt) return 0;
                        const dateA = a.optionExpiresAt instanceof Date ? a.optionExpiresAt : new Date(a.optionExpiresAt);
                        const dateB = b.optionExpiresAt instanceof Date ? b.optionExpiresAt : new Date(b.optionExpiresAt);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map(reservation => (
                        <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedReservationId(reservation.id)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-black uppercase rounded-lg">
                                  Optie
                                </span>
                                {isExpired(reservation) && (
                                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-black uppercase rounded-lg border border-red-300 dark:border-red-700">
                                    ❌ Verlopen
                                  </span>
                                )}
                                {isExpiringSoon(reservation) && (
                                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-black uppercase rounded-lg border border-orange-300 dark:border-orange-700">
                                    ⏰ Verloopt Binnenkort
                                  </span>
                                )}
                              </div>
                              <div className="mb-3">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                  {reservation.companyName || `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim() || reservation.email}
                                </h3>
                                {reservation.companyName && (reservation.firstName || reservation.lastName) && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    {reservation.firstName} {reservation.lastName}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 dark:text-slate-400">{reservation.email}</p>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Event Datum</p>
                                  <p className="text-sm font-bold">{format(reservation.eventDate instanceof Date ? reservation.eventDate : new Date(reservation.eventDate), 'dd MMM yyyy', { locale: nl })}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Verloopt Op</p>
                                  <p className={`text-sm font-bold ${isExpired(reservation) ? 'text-red-600' : isExpiringSoon(reservation) ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>
                                    {reservation.optionExpiresAt ? format(reservation.optionExpiresAt instanceof Date ? reservation.optionExpiresAt : new Date(reservation.optionExpiresAt), 'dd MMM yyyy', { locale: nl }) : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Aantal Personen</p>
                                  <p className="text-sm font-bold">{reservation.numberOfPersons}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Totaal</p>
                                  <p className="text-sm font-bold">€{getTotalAmount(reservation)?.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* ✅ Goedkeuren Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenApprovalModal(reservation.id);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                                title="Optie goedkeuren"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Goedkeuren
                              </button>
                              {/* ❌ Afwijzen Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectOption(reservation.id);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                                title="Optie afwijzen"
                              >
                                <XCircle className="w-4 h-4" />
                                Afwijzen
                              </button>
                              {/* 👁️ Bekijk Button */}
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Opties Sub-tabs: expiring, expired */}
              {(optiesTab === 'expiring' || optiesTab === 'expired' || optiesTab === 'all') && (
                <div className="space-y-4">
                  {(() => {
                    let filtered = activeReservations.filter(r => r.status === 'option');
                    
                    if (optiesTab === 'expiring') filtered = filtered.filter(r => isExpiringSoon(r));
                    if (optiesTab === 'expired') filtered = filtered.filter(r => isExpired(r));

                    filtered = filtered.sort((a, b) => {
                      if (!a.optionExpiresAt || !b.optionExpiresAt) return 0;
                      const dateA = a.optionExpiresAt instanceof Date ? a.optionExpiresAt : new Date(a.optionExpiresAt);
                      const dateB = b.optionExpiresAt instanceof Date ? b.optionExpiresAt : new Date(b.optionExpiresAt);
                      return dateA.getTime() - dateB.getTime();
                    });

                    const title = optiesTab === 'expiring' ? '⏰ Verloopt Binnenkort' :
                                  optiesTab === 'expired' ? '❌ Verlopen Opties' :
                                  '📋 Alle Opties';

                    return filtered.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Geen opties gevonden</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {optiesTab === 'expiring' ? 'Geen opties die binnenkort verlopen' : 
                           optiesTab === 'expired' ? 'Geen verlopen opties' : 
                           'Geen opties beschikbaar'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                          <h2 className="text-2xl font-black mb-2">{title}</h2>
                          <p className="text-slate-600 dark:text-slate-400">{filtered.length} opties</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                          {filtered.map(reservation => (
                            <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                              onClick={() => setSelectedReservationId(reservation.id)}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-black uppercase rounded-lg">
                                      Optie
                                    </span>
                                    {isExpired(reservation) && (
                                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-black uppercase rounded-lg border border-red-300 dark:border-red-700">
                                        ❌ Verlopen
                                      </span>
                                    )}
                                    {isExpiringSoon(reservation) && !isExpired(reservation) && (
                                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-black uppercase rounded-lg border border-orange-300 dark:border-orange-700">
                                        ⏰ Verloopt Binnenkort
                                      </span>
                                    )}
                                  </div>
                                  <div className="mb-3">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                      {reservation.companyName || `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim() || reservation.email}
                                    </h3>
                                    {reservation.companyName && (reservation.firstName || reservation.lastName) && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        {reservation.firstName} {reservation.lastName}
                                      </p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{reservation.email}</p>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Event Datum</p>
                                      <p className="text-sm font-bold">{format(reservation.eventDate instanceof Date ? reservation.eventDate : new Date(reservation.eventDate), 'dd MMM yyyy', { locale: nl })}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Verloopt Op</p>
                                      <p className={`text-sm font-bold ${isExpired(reservation) ? 'text-red-600 dark:text-red-400' : isExpiringSoon(reservation) ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                                        {reservation.optionExpiresAt ? format(reservation.optionExpiresAt instanceof Date ? reservation.optionExpiresAt : new Date(reservation.optionExpiresAt), 'dd MMM yyyy', { locale: nl }) : '-'}
                                      </p>
                                      {reservation.optionExpiresAt && (() => {
                                        const expiryDate = reservation.optionExpiresAt instanceof Date ? reservation.optionExpiresAt : new Date(reservation.optionExpiresAt);
                                        const daysUntil = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                                        return (
                                          <p className={`text-xs mt-1 ${daysUntil < 0 ? 'text-red-600 dark:text-red-400' : daysUntil <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {daysUntil < 0 ? `${Math.abs(daysUntil)} dagen verlopen` : daysUntil === 0 ? 'Vandaag!' : `Over ${daysUntil} dagen`}
                                          </p>
                                        );
                                      })()}
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Aantal Personen</p>
                                      <p className="text-sm font-bold">{reservation.numberOfPersons}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Totaal</p>
                                      <p className="text-sm font-bold">€{getTotalAmount(reservation)?.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                  <Eye className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* ARCHIEF TAB */}
          {/* ================================================================== */}
          {mainTab === 'archief' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-8 text-white">
                <h2 className="text-2xl font-black mb-4">🗄️ Archief</h2>
                <p className="text-white/80">
                  Afgewezen opties en geannuleerde reserveringen. Deze blijven beschikbaar voor audit en rapportage.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {(() => {
                    const stats = reservations.reduce((acc, r) => {
                      if (r.status === 'rejected') acc.rejected++;
                      if (r.status === 'cancelled') acc.cancelled++;
                      return acc;
                    }, { rejected: 0, cancelled: 0 });

                    return (
                      <>
                        <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                          <p className="text-sm font-bold text-white/80 mb-2">❌ Afgewezen Opties</p>
                          <p className="text-4xl font-black">{stats.rejected}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                          <p className="text-sm font-bold text-white/80 mb-2">🚫 Geannuleerde Boekingen</p>
                          <p className="text-4xl font-black">{stats.cancelled}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Archived Reservations List */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                {reservations
                  .filter(r => r.status === 'rejected' || r.status === 'cancelled')
                  .sort((a, b) => {
                    const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
                    const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map(reservation => (
                    <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={cn(
                              "px-3 py-1 text-xs font-black uppercase rounded-lg border-2",
                              reservation.status === 'rejected' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
                              reservation.status === 'cancelled' && "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-400 dark:border-slate-600"
                            )}>
                              {reservation.status === 'rejected' ? '❌ Afgewezen' : '🚫 Geannuleerd'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {format(
                                reservation.updatedAt instanceof Date ? reservation.updatedAt : new Date(reservation.updatedAt), 
                                'dd MMM yyyy HH:mm', 
                                { locale: nl }
                              )}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                            {reservation.companyName || `${reservation.firstName} ${reservation.lastName}`}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Event Datum</p>
                              <p className="text-sm font-bold">
                                {format(
                                  reservation.eventDate instanceof Date ? reservation.eventDate : new Date(reservation.eventDate), 
                                  'dd MMM yyyy', 
                                  { locale: nl }
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Aantal Personen</p>
                              <p className="text-sm font-bold">{reservation.numberOfPersons}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Totaal</p>
                              <p className="text-sm font-bold">€{getTotalAmount(reservation)?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                              <p className="text-sm font-bold">
                                {reservation.status === 'rejected' ? 'Optie' : 'Boeking'}
                              </p>
                            </div>
                          </div>

                          {/* Communication Log - Last Entry */}
                          {reservation.communicationLog && reservation.communicationLog.length > 0 && (() => {
                            const lastLog = reservation.communicationLog[reservation.communicationLog.length - 1];
                            return (
                              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Laatste notitie:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{lastLog.message}</p>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReservationId(reservation.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Details bekijken"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Weet je zeker dat je deze ${reservation.status === 'rejected' ? 'optie' : 'boeking'} permanent wilt verwijderen?\n\nDit kan NIET ongedaan worden gemaakt!`)) {
                                try {
                                  await deleteReservation(reservation.id);
                                  showSuccess('Reservering verwijderd uit archief');
                                } catch (error) {
                                  showError('Fout bij verwijderen');
                                }
                              }
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                            title="Permanent verwijderen"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {reservations.filter(r => r.status === 'rejected' || r.status === 'cancelled').length === 0 && (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Geen gearchiveerde items</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Afgewezen opties en geannuleerde reserveringen verschijnen hier
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ====================================================================== */}
      {/* MANUAL BOOKING MODAL */}
      {/* ====================================================================== */}
      {showManualBooking && (
        <CompactManualBookingForm 
          onClose={() => {
            setShowManualBooking(false);
            loadReservations();
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* QUICK OPTION PLACEMENT MODAL */}
      {/* ====================================================================== */}
      {/* ====================================================================== */}
      {/* PAYMENT REGISTRATION MODAL (PHASE 3) */}
      {/* ====================================================================== */}
      {showPaymentModal && selectedReservation && (() => {
        const paymentSummary = calculatePaymentSummary(selectedReservation);
        const parsedAmount = parseFloat(paymentAmount) || 0;
        const newBalance = paymentSummary.balance - parsedAmount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-t-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Plus className="w-6 h-6" />
                    Betaling Registreren
                  </h2>
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-white/80 mt-1 text-sm">{selectedReservation.companyName}</p>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Current Status */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Totaal</p>
                      <p className="text-lg font-black">€{paymentSummary.totalPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Betaald</p>
                      <p className="text-lg font-black text-green-600">€{paymentSummary.totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Openstaand</p>
                      <p className="text-lg font-black text-red-600">€{paymentSummary.balance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Bedrag *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  {parsedAmount > 0 && (
                    <p className={`text-sm mt-2 font-bold ${newBalance < 0 ? 'text-orange-600' : newBalance === 0 ? 'text-green-600' : 'text-slate-600'}`}>
                      {newBalance < 0 ? `⚠️ Overschot: €${Math.abs(newBalance).toFixed(2)}` :
                       newBalance === 0 ? `✅ Volledig betaald!` :
                       `Resterend na betaling: €${newBalance.toFixed(2)}`}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Categorie *
                  </label>
                  <select
                    value={paymentCategory}
                    onChange={(e) => setPaymentCategory(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="full">💯 Volledig (Arrangement + Merchandise)</option>
                    <option value="arrangement">🍽️ Alleen Arrangement</option>
                    <option value="merchandise">🛍️ Alleen Merchandise</option>
                    <option value="other">📋 Overig (Borg, Extra's, etc.)</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Betaalmethode *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="iDEAL">iDEAL</option>
                    <option value="Bankoverschrijving">Bankoverschrijving</option>
                    <option value="Contant">Contant</option>
                    <option value="Pin">Pin</option>
                    <option value="Creditcard">Creditcard</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Anders">Anders</option>
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Referentie (Optioneel)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Bijv. transactienummer, factuurnummer..."
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Notitie (Optioneel)
                  </label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Extra informatie over de betaling..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-b-xl flex items-center justify-between sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleRegisterPayment}
                  disabled={isProcessingPayment || parsedAmount <= 0}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Betaling Registreren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* REFUND MODAL (PHASE 4) */}
      {/* ====================================================================== */}
      {showRefundModal && selectedReservation && (() => {
        const paymentSummary = calculatePaymentSummary(selectedReservation);
        const parsedAmount = parseFloat(refundAmount) || 0;
        const newNetRevenue = paymentSummary.netRevenue - parsedAmount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-t-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                    Restitutie Aanmaken
                  </h2>
                  <button onClick={() => setShowRefundModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-white/80 mt-2">{selectedReservation.companyName}</p>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Current Status */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-red-700 dark:text-red-400 uppercase mb-1">Betaald</p>
                      <p className="text-lg font-black">€{paymentSummary.totalPaid.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-700 dark:text-red-400 uppercase mb-1">Gerestitueerd</p>
                      <p className="text-lg font-black">€{paymentSummary.totalRefunded.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-700 dark:text-red-400 uppercase mb-1">Netto Omzet</p>
                      <p className="text-lg font-black text-green-600 dark:text-green-400">€{paymentSummary.netRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Bedrag *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={paymentSummary.totalPaid}
                      className="w-full pl-8 pr-4 py-3 border-2 border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  {parsedAmount > 0 && (
                    <p className={`text-sm mt-2 font-bold ${parsedAmount > paymentSummary.totalPaid ? 'text-red-600' : 'text-slate-600'}`}>
                      {parsedAmount > paymentSummary.totalPaid ? `⚠️ Bedrag te hoog! Max: €${paymentSummary.totalPaid.toFixed(2)}` :
                       `Netto omzet na restitutie: €${newNetRevenue.toFixed(2)}`}
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Reden *
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Annulering">Annulering door klant</option>
                    <option value="Annulering door bedrijf">Annulering door bedrijf</option>
                    <option value="Merchandise niet leverbaar">Merchandise niet leverbaar</option>
                    <option value="Overboeking fout">Te veel betaald</option>
                    <option value="Gedeeltelijke annulering">Gedeeltelijke annulering</option>
                    <option value="Compensatie">Compensatie (service issue)</option>
                    <option value="Anders">Anders</option>
                  </select>
                </div>

                {/* Refund Method */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Restitutiemethode *
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Bankoverschrijving">Bankoverschrijving</option>
                    <option value="Contant">Contant</option>
                    <option value="Originele betaalmethode">Originele betaalmethode</option>
                    <option value="Creditnota">Creditnota</option>
                    <option value="Anders">Anders</option>
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Notitie * (Verplicht)
                  </label>
                  <textarea
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Gedetailleerde uitleg van de restitutie (verplicht voor audit trail)..."
                  />
                </div>

                {/* Warning */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200">Let op</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Deze actie kan niet ongedaan worden gemaakt. Controleer het bedrag en de reden zorgvuldig voordat je doorgaat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-b-xl flex items-center justify-between sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateRefund}
                  disabled={isProcessingRefund || parsedAmount <= 0 || parsedAmount > paymentSummary.totalPaid || !refundNote.trim()}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                  {isProcessingRefund ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Restitutie Aanmaken
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* OPTION APPROVAL MODAL */}
      {/* ====================================================================== */}
      {showOptionApprovalModal && selectedReservation && selectedReservation.status === 'option' && (() => {
        const event = events.find(e => e.id === selectedReservation.eventId);
        if (!event || !event.date) return null;

        const eventData = typeof event.date === 'object' && 'pricing' in event.date ? event.date : null;
        if (!eventData || !eventData.pricing) return null;

        const eventPricing = eventData.pricing as Record<Arrangement, number>;
        const arrangementPrice = eventPricing[approvalArrangement] || 0;
        const merchandisePrice = approvalMerchandise.enabled ? (approvalMerchandise.quantity || 0) * 29.95 : 0;
        const afterPartyPrice = approvalAfterParty ? 7.50 : 0;
        const totalPrice = (arrangementPrice + afterPartyPrice) * selectedReservation.numberOfPersons + merchandisePrice;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-t-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    Optie Goedkeuren
                  </h2>
                  <button onClick={() => setShowOptionApprovalModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-white/90 mt-2">{selectedReservation.companyName || `${selectedReservation.firstName} ${selectedReservation.lastName}`}</p>
                <p className="text-white/80 text-sm">{selectedReservation.numberOfPersons} personen • {format(selectedReservation.eventDate instanceof Date ? selectedReservation.eventDate : new Date(selectedReservation.eventDate), 'dd MMM yyyy', { locale: nl })}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Option Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h3 className="font-black text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Optie Informatie
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">Geplaatst op:</p>
                      <p className="text-blue-900 dark:text-blue-100 font-bold">
                        {selectedReservation.optionPlacedAt ? format(
                          selectedReservation.optionPlacedAt instanceof Date ? selectedReservation.optionPlacedAt : new Date(selectedReservation.optionPlacedAt), 
                          'dd MMM yyyy HH:mm', 
                          { locale: nl }
                        ) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">Verloopt op:</p>
                      <p className="text-blue-900 dark:text-blue-100 font-bold">
                        {selectedReservation.optionExpiresAt ? format(
                          selectedReservation.optionExpiresAt instanceof Date ? selectedReservation.optionExpiresAt : new Date(selectedReservation.optionExpiresAt), 
                          'dd MMM yyyy HH:mm', 
                          { locale: nl }
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                  {selectedReservation.optionNotes && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">Notities:</p>
                      <p className="text-blue-900 dark:text-blue-100">{selectedReservation.optionNotes}</p>
                    </div>
                  )}
                </div>

                {/* Arrangement Selection */}
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                    Selecteer Arrangement *
                  </label>
                  <select
                    value={approvalArrangement}
                    onChange={(e) => setApprovalArrangement(e.target.value as Arrangement)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="BWF">BWF - Basis Without Food (€{(eventPricing.BWF || 0).toFixed(2)})</option>
                    <option value="BWFM">BWFM - Basis With Food & Merch (€{(eventPricing.BWFM || 0).toFixed(2)})</option>
                    <option value="Standard">Standard (€{(eventPricing.Standard || 0).toFixed(2)})</option>
                    <option value="Premium">Premium (€{(eventPricing.Premium || 0).toFixed(2)})</option>
                  </select>
                </div>

                {/* Add-Ons */}
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3">Extra's</label>
                  <div className="space-y-3">
                    {/* Merchandise */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={approvalMerchandise.enabled}
                          onChange={(e) => setApprovalMerchandise({
                            enabled: e.target.checked,
                            quantity: e.target.checked ? 1 : 0
                          })}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600"
                        />
                        <label className="font-bold">Merchandise (€29,95 per stuk)</label>
                      </div>
                      {approvalMerchandise.enabled && (
                        <input
                          type="number"
                          min="1"
                          value={approvalMerchandise.quantity}
                          onChange={(e) => setApprovalMerchandise(prev => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 1
                          }))}
                          className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                        />
                      )}
                    </div>

                    {/* After Party */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <input
                        type="checkbox"
                        checked={approvalAfterParty}
                        onChange={(e) => setApprovalAfterParty(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600"
                      />
                      <label className="font-bold">After Party (€7,50 per persoon)</label>
                    </div>

                    {/* Pre Drink */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <input
                        type="checkbox"
                        checked={approvalPreDrink}
                        onChange={(e) => setApprovalPreDrink(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600"
                      />
                      <label className="font-bold">Pre-Drink (Gratis)</label>
                    </div>
                  </div>
                </div>

                {/* Dietary Needs */}
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                    Dieetwensen
                  </label>
                  <textarea
                    value={approvalDietaryNeeds}
                    onChange={(e) => setApprovalDietaryNeeds(e.target.value)}
                    placeholder="Vegetarisch, veganistisch, allergieën, etc."
                    rows={2}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                    Admin Notities
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Interne notities over deze goedkeuring..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl p-6 text-white">
                  <h3 className="font-black text-lg mb-4">💰 Prijs Overzicht</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Arrangement ({approvalArrangement}):</span>
                      <span className="font-bold">€{arrangementPrice.toFixed(2)} x {selectedReservation.numberOfPersons}</span>
                    </div>
                    {approvalMerchandise.enabled && (
                      <div className="flex justify-between">
                        <span>Merchandise:</span>
                        <span className="font-bold">€{merchandisePrice.toFixed(2)}</span>
                      </div>
                    )}
                    {approvalAfterParty && (
                      <div className="flex justify-between">
                        <span>After Party:</span>
                        <span className="font-bold">€{afterPartyPrice.toFixed(2)} x {selectedReservation.numberOfPersons}</span>
                      </div>
                    )}
                    {approvalPreDrink && (
                      <div className="flex justify-between text-white/80">
                        <span>Pre-Drink:</span>
                        <span className="font-bold">GRATIS</span>
                      </div>
                    )}
                    <div className="border-t-2 border-white/30 pt-2 mt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-black">TOTAAL:</span>
                        <span className="font-black">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-b-xl flex items-center justify-between sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowOptionApprovalModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleApproveOption}
                  disabled={isProcessingApproval || !approvalArrangement}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                  {isProcessingApproval ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Optie Goedkeuren (€{totalPrice.toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ✨ NEW: Merge Reservations Modal (November 2025) */}
      {showMergeModal && (() => {
        const selectedReservations = reservations.filter(r => selectedReservationIds.has(r.id));
        const primaryReservation = selectedReservations.find(r => r.id === mergePrimaryId);
        const secondaryReservations = selectedReservations.filter(r => r.id !== mergePrimaryId);
        
        const totalPersons = selectedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
        const totalPrice = selectedReservations.reduce((sum, r) => sum + r.totalPrice, 0);
        
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">Reserveringen Samenvoegen</h2>
                      <p className="text-purple-100 text-sm mt-1">
                        Combineer {selectedReservations.length} reserveringen in één
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Primary Selection */}
                <div>
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3">
                    📍 Primaire Reservering (Behoudt ID):
                  </label>
                  <select
                    value={mergePrimaryId}
                    onChange={(e) => setMergePrimaryId(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-white font-semibold"
                  >
                    {selectedReservations.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id} - {r.contactPerson} ({r.numberOfPersons} personen) - €{r.totalPrice.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reservations Overview */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                    📋 Te Samenvoegen Reserveringen:
                  </h3>
                  
                  {selectedReservations.map(r => (
                    <div
                      key={r.id}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        r.id === mergePrimaryId
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {r.id === mergePrimaryId && (
                              <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded">
                                PRIMAIR
                              </span>
                            )}
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                              {r.id}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-white">
                            {r.contactPerson}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {r.email} • {r.phone}
                          </p>
                          {r.comments && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">
                              💬 {r.comments}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {r.numberOfPersons} 👤
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            €{r.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merge Summary */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                  <h3 className="font-black text-lg mb-4">📊 Resultaat Na Samenvoegen</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-100">Totaal Gasten:</span>
                      <span className="text-2xl font-black">{totalPersons} personen</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-100">Totaal Prijs:</span>
                      <span className="text-2xl font-black">€{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-100">Primaire ID:</span>
                      <span className="font-mono font-bold">{mergePrimaryId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-100">Secundaire IDs:</span>
                      <span className="text-sm">
                        {secondaryReservations.map(r => r.id).join(', ')} <span className="text-purple-200">(geannuleerd)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ⚠️
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-bold text-orange-900 dark:text-orange-100 mb-2">
                        Let Op:
                      </p>
                      <ul className="space-y-1 text-orange-800 dark:text-orange-200">
                        <li>• Alle gasten, notities, merchandise en vieringen worden samengevoegd</li>
                        <li>• Secundaire reserveringen worden geannuleerd met merge notitie</li>
                        <li>• Deze actie kan niet ongedaan worden gemaakt</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowMergeModal(false)}
                  disabled={isProcessingMerge}
                  className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleMergeReservations}
                  disabled={isProcessingMerge || !mergePrimaryId}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
                >
                  {isProcessingMerge ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Bezig met Samenvoegen...
                    </>
                  ) : (
                    <>
                      🔗 Samenvoegen ({secondaryReservations.length + 1} → 1)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};






