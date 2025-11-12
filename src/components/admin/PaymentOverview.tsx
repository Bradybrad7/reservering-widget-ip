import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  Users,
  Send,
  Filter,
  X
} from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import type { Reservation } from '../../types';

/**
 * 💰 Payment Overview Component
 * 
 * Beheert openstaande betalingen met intelligente termijnen:
 * - Betalingstermijn: tot 1 week voor de voorstelling
 * - Maanden van tevoren boeken is oké
 * - Waarschuwingen alleen als deadline nadert
 * - Batch betalingsherinneringen versturen
 */

type PaymentFilterType = 'all' | 'pending' | 'urgent' | 'overdue' | 'paid';

export const PaymentOverview: React.FC = () => {
  const { reservations, loadReservations, updatePaymentStatus } = useReservationsStore();
  const { events, loadEvents } = useEventsStore();
  const [filter, setFilter] = useState<PaymentFilterType>('pending');
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReservations();
    loadEvents();
  }, [loadReservations, loadEvents]);

  // Calculate payment deadline: 1 week before event
  const getPaymentDeadline = (eventDate: Date): Date => {
    const deadline = new Date(eventDate);
    deadline.setDate(deadline.getDate() - 7); // 7 dagen voor event
    deadline.setHours(23, 59, 59); // Einde van de dag
    return deadline;
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (eventDate: Date): number => {
    const deadline = getPaymentDeadline(eventDate);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Categorize payment status
  const categorizePayment = (reservation: Reservation): 'safe' | 'reminder' | 'urgent' | 'overdue' => {
    if (reservation.paymentStatus === 'paid') return 'safe';
    
    const event = events?.find(e => e.id === reservation.eventId);
    if (!event) return 'safe';

    const daysUntilDeadline = getDaysUntilDeadline(new Date(event.date));

    if (daysUntilDeadline < 0) return 'overdue'; // Te laat!
    if (daysUntilDeadline <= 3) return 'urgent'; // Binnen 3 dagen
    if (daysUntilDeadline <= 7) return 'reminder'; // Binnen 1 week
    return 'safe'; // Ruim op tijd
  };

  // Filter and categorize reservations
  const categorizedReservations = useMemo(() => {
    const confirmed = (reservations || []).filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );

    const withCategory = confirmed.map(r => ({
      ...r,
      category: categorizePayment(r),
      event: events?.find(e => e.id === r.eventId),
      daysUntilDeadline: events?.find(e => e.id === r.eventId) 
        ? getDaysUntilDeadline(new Date(events.find(e => e.id === r.eventId)!.date))
        : 999
    }));

    // Apply filter
    switch (filter) {
      case 'pending':
        return withCategory.filter(r => r.paymentStatus === 'pending');
      case 'urgent':
        return withCategory.filter(r => r.category === 'urgent' || r.category === 'overdue');
      case 'overdue':
        return withCategory.filter(r => r.category === 'overdue');
      case 'paid':
        return withCategory.filter(r => r.paymentStatus === 'paid');
      case 'all':
      default:
        return withCategory;
    }
  }, [reservations, events, filter]);

  // Statistics
  const stats = useMemo(() => {
    const all = (reservations || []).filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );

    const pending = all.filter(r => r.paymentStatus === 'pending');
    const paid = all.filter(r => r.paymentStatus === 'paid');
    const urgent = categorizedReservations.filter(r => r.category === 'urgent');
    const overdue = categorizedReservations.filter(r => r.category === 'overdue');

    return {
      total: all.length,
      totalAmount: all.reduce((sum, r) => sum + r.totalPrice, 0),
      pending: pending.length,
      pendingAmount: pending.reduce((sum, r) => sum + r.totalPrice, 0),
      paid: paid.length,
      paidAmount: paid.reduce((sum, r) => sum + r.totalPrice, 0),
      urgent: urgent.length,
      urgentAmount: urgent.reduce((sum, r) => sum + r.totalPrice, 0),
      overdue: overdue.length,
      overdueAmount: overdue.reduce((sum, r) => sum + r.totalPrice, 0)
    };
  }, [reservations, categorizedReservations]);

  const toggleSelectReservation = (id: string) => {
    const newSet = new Set(selectedReservations);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReservations(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedReservations.size === categorizedReservations.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(categorizedReservations.map(r => r.id)));
    }
  };

  const handleMarkAsPaid = async (reservationId: string) => {
    await updatePaymentStatus(reservationId, 'paid', 'Handmatig gemarkeerd als betaald');
    await loadReservations();
  };

  const handleSendReminder = (reservationId: string) => {
    // TODO: Implement email sending
    console.log('Send payment reminder to:', reservationId);
    alert('Betalingsherinnering verzonden! 📧');
  };

  const handleBatchReminders = () => {
    // TODO: Implement batch email sending
    const count = selectedReservations.size;
    console.log('Send batch payment reminders to:', selectedReservations);
    alert(`${count} betalingsherinneringen verzonden! 📧`);
    setSelectedReservations(new Set());
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      safe: 'bg-green-100 text-green-800 border-green-300',
      reminder: 'bg-blue-100 text-blue-800 border-blue-300',
      urgent: 'bg-orange-100 text-orange-800 border-orange-300',
      overdue: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      safe: 'Ruim op tijd',
      reminder: 'Let op: betalen',
      urgent: 'Urgent!',
      overdue: 'Achterstallig'
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', styles[category as keyof typeof styles])}>
        {labels[category as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Openstaande Betalingen</h1>
            <p className="text-slate-400 text-sm">Betalingstermijn: tot 1 week voor de voorstelling</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card-theatre p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-100">Totaal Openstaand</p>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
          <p className="text-sm text-blue-400 font-semibold mt-1">
            {formatCurrency(stats.pendingAmount)}
          </p>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-100">Urgent</p>
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">{stats.urgent}</p>
          <p className="text-sm text-orange-300 font-semibold mt-1">
            {formatCurrency(stats.urgentAmount)}
          </p>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-100">Achterstallig</p>
            <X className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
          <p className="text-sm text-red-300 font-semibold mt-1">
            {formatCurrency(stats.overdueAmount)}
          </p>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-100">Betaald</p>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
          <p className="text-sm text-green-300 font-semibold mt-1">
            {formatCurrency(stats.paidAmount)}
          </p>
        </div>

        <div className="card-theatre p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-100">Totaal Omzet</p>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.total}</p>
          <p className="text-sm text-emerald-300 font-semibold mt-1">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card-theatre p-5 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-400 mb-2">💡 Betalingstermijn Uitleg</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-300">
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-blue-500/20">
                <p className="font-semibold text-green-400 mb-1">✅ Ruim op tijd</p>
                <p className="text-xs">Meer dan 1 week voor het event. Klant heeft nog ruim de tijd om te betalen.</p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-orange-500/20">
                <p className="font-semibold text-orange-400 mb-1">⚠️ Urgent (3-7 dagen)</p>
                <p className="text-xs">Deadline nadert. Stuur een vriendelijke herinnering om te betalen.</p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-red-500/20">
                <p className="font-semibold text-red-400 mb-1">🚨 Achterstallig</p>
                <p className="text-xs">Deadline verstreken! Neem direct contact op met de klant.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <span className="text-sm text-slate-400 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter:
        </span>
        {[
          { id: 'pending', label: 'Openstaand', count: stats.pending },
          { id: 'urgent', label: 'Urgent', count: stats.urgent },
          { id: 'overdue', label: 'Achterstallig', count: stats.overdue },
          { id: 'paid', label: 'Betaald', count: stats.paid },
          { id: 'all', label: 'Alles', count: stats.total }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as PaymentFilterType)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              filter === f.id
                ? 'bg-gold-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedReservations.size > 0 && (
        <div className="card-theatre p-4 bg-gradient-to-r from-gold-500/10 to-gold-600/5 border-2 border-gold-500/30">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">
              {selectedReservations.size} geselecteerd
            </span>
            <button
              onClick={handleBatchReminders}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Verstuur herinneringen
            </button>
            <button
              onClick={() => setSelectedReservations(new Set())}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors ml-auto"
            >
              Deselecteer
            </button>
          </div>
        </div>
      )}

      {/* Reservations Table */}
      <div className="card-theatre overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gold-50 border-b-2 border-gold-300">
              <tr>
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedReservations.size === categorizedReservations.length && categorizedReservations.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gold-300 text-gold-500"
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Event</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Deadline</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Bedrijf</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Bedrag</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-white text-xs">Acties</th>
              </tr>
            </thead>
            <tbody>
              {categorizedReservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-gold-100 hover:bg-gold-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedReservations.has(reservation.id)}
                      onChange={() => toggleSelectReservation(reservation.id)}
                      className="w-4 h-4 rounded border-gold-300 text-gold-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {reservation.event ? (
                      <div>
                        <p className="font-medium text-white">{formatDate(reservation.event.date)}</p>
                        <p className="text-xs text-neutral-300">{reservation.event.startsAt}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500">Onbekend</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {reservation.event && (
                      <div>
                        <p className={cn(
                          'font-medium',
                          reservation.category === 'overdue' && 'text-red-400',
                          reservation.category === 'urgent' && 'text-orange-400',
                          reservation.category === 'reminder' && 'text-blue-400',
                          reservation.category === 'safe' && 'text-green-400'
                        )}>
                          {reservation.daysUntilDeadline < 0 
                            ? `${Math.abs(reservation.daysUntilDeadline)} dagen te laat` 
                            : `Over ${reservation.daysUntilDeadline} dagen`}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatDate(getPaymentDeadline(new Date(reservation.event.date)))}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-white">{reservation.companyName}</p>
                        <p className="text-xs text-neutral-300">{reservation.numberOfPersons} personen</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span className="text-neutral-200">{reservation.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="text-neutral-200">{reservation.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="text-neutral-200">{reservation.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-primary-500 text-base">
                      {formatCurrency(reservation.totalPrice)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-2">
                      {getCategoryBadge(reservation.category)}
                      {reservation.paymentStatus === 'paid' && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Betaald
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {reservation.paymentStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMarkAsPaid(reservation.id)}
                            className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                            title="Markeer als betaald"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendReminder(reservation.id)}
                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                            title="Verstuur herinnering"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {categorizedReservations.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Geen reserveringen gevonden</p>
            <p className="text-slate-500 text-sm mt-2">Probeer een ander filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
