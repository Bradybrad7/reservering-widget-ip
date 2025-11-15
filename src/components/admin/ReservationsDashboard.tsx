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
  Ban
} from 'lucide-react';
import { cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import type { AddOns, Arrangement, Event } from '../../types';
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getWeek, getMonth, getYear } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '../Toast';
import { ManualBookingManager } from './ManualBookingManager';
import { TagConfigService } from '../../services/tagConfigService';
import type { ReservationTag } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 
  | 'dashboard'   // Overzicht + urgente items
  | 'all'         // Alle reserveringen (met datum filters)
  | 'pending'     // Wachten op bevestiging
  | 'confirmed'   // Bevestigd (detail beheer)
  | 'today'       // Vandaag (snel overzicht)
  | 'week'        // Week overzicht
  | 'month';      // Maand overzicht

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
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  
  // Edit state
  const [editData, setEditData] = useState<any>(null);

  // Get selected reservation data
  const selectedReservation = selectedReservationId 
    ? reservations.find(r => r.id === selectedReservationId) 
    : null;

  // Helper function to get arrangement price for a specific event
  const getArrangementPriceForEvent = (eventId: string, arrangement: Arrangement): number => {
    const eventData = events.find(e => e.id === eventId);
    
    if (!eventData) {
      console.warn('❌ Event not found:', eventId);
      return 0;
    }
    
    // Priority 1: Check custom pricing on the event itself
    if (eventData.customPricing && eventData.customPricing[arrangement]) {
      console.log('✅ Using custom event pricing:', eventData.customPricing[arrangement]);
      return eventData.customPricing[arrangement]!;
    }
    
    // Priority 2: Check pricing.byDayType (from Producten en Prijzen page)
    if (pricing?.byDayType) {
      // Direct match first
      if (pricing.byDayType[eventData.type]) {
        const price = pricing.byDayType[eventData.type][arrangement];
        if (price !== undefined && price !== null && price > 0) {
          console.log(`✅ Using pricing.byDayType[${eventData.type}][${arrangement}]:`, price);
          return price;
        }
      }
      
      // Try mapping common variations (zondag -> weekend, week -> weekday, etc.)
      const typeMapping: Record<string, string[]> = {
        'zondag': ['weekend', 'REGULAR'],
        'weekend': ['weekend', 'REGULAR'],
        'week': ['weekday', 'REGULAR'],
        'weekday': ['weekday', 'REGULAR'],
        'matinee': ['MATINEE', 'matinee'],
        'zorgzamehelden': ['CARE_HEROES', 'zorgzamehelden', 'REGULAR']
      };
      
      const possibleKeys = typeMapping[eventData.type.toLowerCase()] || [eventData.type];
      
      for (const key of possibleKeys) {
        if (pricing.byDayType[key]) {
          const price = pricing.byDayType[key][arrangement];
          if (price !== undefined && price !== null && price > 0) {
            console.log(`✅ Using mapped pricing.byDayType[${key}][${arrangement}]:`, price, `(event type was '${eventData.type}')`);
            return price;
          }
        }
      }
    }
    
    // Priority 3: Fallback to eventTypesConfig.pricing (defaults)
    const eventTypeConfig = eventTypesConfig?.types.find(t => t.key === eventData.type || t.key.toLowerCase() === eventData.type.toLowerCase());
    if (eventTypeConfig?.pricing) {
      const price = eventTypeConfig.pricing[arrangement] || 0;
      console.log(`📋 Fallback to eventTypeConfig pricing for ${arrangement}:`, price);
      return price;
    }
    
    console.warn('❌ No pricing found for event type:', eventData.type, 'arrangement:', arrangement);
    console.log('Available pricing types:', pricing?.byDayType ? Object.keys(pricing.byDayType) : 'NONE');
    return 0;
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
    
    const originalPrice = selectedReservation.totalPrice || 0;
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
        pricingSnapshot: updatedPricingSnapshot
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
  
  // Log pricing whenever it changes
  useEffect(() => {
    console.log('💰 [RD] Pricing state updated:');
    console.log('  - Pricing object:', pricing);
    console.log('  - Has byDayType?', !!pricing?.byDayType);
    if (pricing?.byDayType) {
      console.log('  - Available types:', Object.keys(pricing.byDayType));
      console.log('  - Full data:', pricing.byDayType);
    } else {
      console.warn('  ⚠️ pricing.byDayType is NULL/UNDEFINED!');
      console.log('  - You need to set prices in Admin → Producten en Prijzen');
    }
  }, [pricing]);

  // Handler voor bevestigen
  const handleConfirm = async (reservationId: string) => {
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await confirmReservation(reservationId);
      if (success) {
        showSuccess('Reservering bevestigd!');
        // Geen reload hier, de store update het vanzelf
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
    if (!confirm('Weet je zeker dat je deze reservering wilt afwijzen?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await rejectReservation(reservationId);
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
    // Aanvragen (beide pending en request status - wachten op bevestiging)
    // Aanvragen (pending status)
    const pendingCount = activeReservations.filter(r => 
      r.status === 'pending'
    ).length;

    // Bevestigde boekingen
    const confirmedCount = activeReservations.filter(r => 
      r.status === 'confirmed'
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

    return {
      pending: pendingCount,
      confirmed: confirmedCount,
      payments: paymentsCount,
      revenue: todayRevenue
    };
  }, [activeReservations]);
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
      onClick: () => setViewMode('pending')
    },
    {
      label: 'Bevestigd',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'green',
      trend: `${upcomingBookings.length} vandaag/morgen`,
      onClick: () => setViewMode('confirmed')
    },
    {
      label: 'Betalingen',
      value: stats.payments,
      icon: DollarSign,
      color: 'blue',
      trend: stats.payments > 0 ? 'Openstaande betalingen' : 'Alles betaald',
      onClick: () => setViewMode('all')
    },
    {
      label: 'Omzet Vandaag',
      value: stats.revenue,
      icon: TrendingUp,
      color: 'purple',
      trend: 'Live omzet',
      onClick: () => setViewMode('dashboard')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ====================================================================== */}
      {/* RESERVATION DETAIL MODAL */}
      {/* ====================================================================== */}
      {selectedReservation && (
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

              {/* Add-ons */}
              {(selectedReservation.preDrink || selectedReservation.afterParty) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Extra's
                  </h3>
                  <div className="space-y-2">
                    {selectedReservation.preDrink && (
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Borrel vooraf</span>
                      </div>
                    )}
                    {selectedReservation.afterParty && (
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Nafeest</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                            return (
                              <div key={`merch-edit-${item.itemId || item.id}-${index}`} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
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
                            
                            return (
                              <div key={`merch-view-${item.itemId || item.id}-${index}`} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
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
                      {(selectedReservation.pricingSnapshot.preDrinkTotal || (isEditMode && editData?.preDrink?.enabled)) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isEditMode && editData?.preDrink?.enabled && !selectedReservation.preDrink?.enabled && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-bold mr-2">NIEUW +</span>
                            )}
                            Borrel vooraf {isEditMode && editData && editData.preDrink?.enabled && `(${editData.preDrink.quantity} pers.)`}
                          </span>
                          <span className="font-bold">€{(isEditMode && editData?.preDrink?.enabled 
                            ? (addOns?.preDrink?.pricePerPerson || 0) * editData.preDrink.quantity 
                            : selectedReservation.pricingSnapshot.preDrinkTotal || 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* After-party */}
                      {(selectedReservation.pricingSnapshot.afterPartyTotal || (isEditMode && editData?.afterParty?.enabled)) && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isEditMode && editData?.afterParty?.enabled && !selectedReservation.afterParty?.enabled && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-bold mr-2">NIEUW +</span>
                            )}
                            Nafeest {isEditMode && editData && editData.afterParty?.enabled && `(${editData.afterParty.quantity} pers.)`}
                          </span>
                          <span className="font-bold">€{(isEditMode && editData?.afterParty?.enabled 
                            ? (addOns?.afterParty?.pricePerPerson || 0) * editData.afterParty.quantity 
                            : selectedReservation.pricingSnapshot.afterPartyTotal || 0).toFixed(2)}</span>
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
                  <div className="pt-3 border-t-2 border-green-300 dark:border-green-700 flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900 dark:text-white">Totaal {isEditMode && <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(nieuw)</span>}</span>
                    <span className="text-3xl font-black text-green-700 dark:text-green-400">€{(isEditMode && editData ? recalculatePrice() : selectedReservation.totalPrice)?.toFixed(2)}</span>
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
                  
                  {/* Email Action */}
                  <button 
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
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
      )}

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
                  Operations Control
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Real-time overzicht van alle boekingen en activiteiten
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

          {/* Capaciteit Warnings */}
          {eventsNearCapacity.length > 0 && (
            <div className="mb-4 space-y-2">
              {eventsNearCapacity.map(({ event, capacity }) => {
                const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "p-4 rounded-xl border-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300",
                      capacity.isAtLimit
                        ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                        : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        capacity.isAtLimit
                          ? "bg-red-200 dark:bg-red-900/50"
                          : "bg-yellow-200 dark:bg-yellow-900/50"
                      )}>
                        <AlertCircle className={cn(
                          "w-6 h-6",
                          capacity.isAtLimit
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-black text-base",
                          capacity.isAtLimit
                            ? "text-red-900 dark:text-red-100"
                            : "text-yellow-900 dark:text-yellow-100"
                        )}>
                          {capacity.isAtLimit ? '🔴 Event VOL!' : '⚠️ Bijna Vol'}
                        </h3>
                        <p className={cn(
                          "text-sm font-medium",
                          capacity.isAtLimit
                            ? "text-red-700 dark:text-red-300"
                            : "text-yellow-700 dark:text-yellow-300"
                        )}>
                          {format(eventDate, 'EEEE d MMMM yyyy', { locale: nl })} - {capacity.current}/{capacity.max} gasten
                        </p>
                        {capacity.isAtLimit && (
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                            ➡️ Nieuwe boekingen gaan automatisch naar wachtlijst
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={cn(
                          "text-3xl font-black",
                          capacity.isAtLimit
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        )}>
                          {Math.round(capacity.percentage)}%
                        </div>
                        <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              capacity.isAtLimit
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            )}
                            style={{ width: `${capacity.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'dashboard'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setViewMode('pending')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'pending'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Clock className="w-4 h-4" />
              Pending
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('confirmed')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'confirmed'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Bevestigd
              {stats.confirmed > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.confirmed}
                </span>
              )}
            </button>

            {/* Spacer */}
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 mx-2" />

            {/* Tijdsfilters */}
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'all'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Search className="w-4 h-4" />
              Alle
            </button>

            <button
              onClick={() => setViewMode('today')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'today'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Calendar className="w-4 h-4" />
              Vandaag
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'week'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <CalendarClock className="w-4 h-4" />
              Week
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'month'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <CalendarRange className="w-4 h-4" />
              Maand
            </button>
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
          {/* DASHBOARD VIEW */}
          {viewMode === 'dashboard' && (
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
                                  €{reservation.totalPrice?.toFixed(2)}
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
          {viewMode === 'pending' && (
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
                const requestReservations = activeReservations.filter(r => r.status === 'pending' || r.status === 'request');
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
                              <div className="flex items-center gap-3 mb-3">
                                <span className={cn(
                                  "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                  reservation.status === 'pending'
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                )}>
                                  {reservation.status === 'pending' ? 'Nieuw' : 'Request'}
                                </span>
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
                                      return (
                                        <span key={idx} className="text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-700 text-slate-700 dark:text-slate-300">
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
                                  <span className="font-black">€{reservation.totalPrice?.toFixed(2)}</span>
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
          {viewMode === 'confirmed' && (
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
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-black uppercase rounded-lg">
                                  ✓ Bevestigd
                                </span>
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
                                  <span className="font-black">€{reservation.totalPrice?.toFixed(2)}</span>
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
                                onClick={() => setSelectedReservationId(reservation.id)}
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
          {viewMode === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Alle Reserveringen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {activeReservations.length} actieve reserveringen
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

              {(() => {
                const filteredReservations = activeReservations.filter(r => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
                  return (
                    fullName.includes(query) ||
                    (r.email || '').toLowerCase().includes(query) ||
                    (r.phone || '').toLowerCase().includes(query) ||
                    r.id.toLowerCase().includes(query)
                  );
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
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
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
                              <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-4">
                                  <span className={cn(
                                    "inline-flex px-2 py-1 text-xs font-black uppercase rounded",
                                    reservation.status === 'confirmed' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                    reservation.status === 'pending' && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                                    reservation.status === 'cancelled' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  )}>
                                    {reservation.status === 'confirmed' ? '✓' : reservation.status === 'pending' ? '⏳' : '✗'}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="font-bold text-slate-900 dark:text-white">{reservation.firstName} {reservation.lastName}</div>
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
                                    €{reservation.totalPrice?.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={cn(
                                    "inline-flex px-2 py-1 text-xs font-black uppercase rounded",
                                    reservation.paymentStatus === 'paid' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                    reservation.paymentStatus === 'pending' && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  )}>
                                    {reservation.paymentStatus === 'paid' ? '✓ Betaald' : 'Te betalen'}
                                  </span>
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
          {viewMode === 'today' && (
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
                                    <span>€{reservation.totalPrice?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedReservationId(reservation.id)}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors"
                              >
                                Details
                              </button>
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
          {viewMode === 'week' && (
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
          {viewMode === 'month' && (
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
                                              <span className="font-bold">€{reservation.totalPrice?.toFixed(2)}</span>
                                            </div>
                                          </div>
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
        </div>
      </main>

      {/* ====================================================================== */}
      {/* MANUAL BOOKING MODAL */}
      {/* ====================================================================== */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <ManualBookingManager 
              onClose={() => {
                setShowManualBooking(false);
                loadReservations();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

