/**
 * Archived Detail Panel - Read-only Financiële Tijdlijn
 * 
 * Toont complete, onveranderbare financiële geschiedenis van gearchiveerde reservering.
 * - Gecombineerde, gesorteerde lijst van payments en refunds
 * - Netto inkomsten berekening met visualisatie
 * - Volledige audit trail van alle transacties
 * - Read-only: Geen wijzigingen mogelijk
 * 
 * November 12, 2025
 */


import {
  Archive,
  Calendar,
  Users,
  Building2,
  Mail,
  Phone,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  User as UserIcon,
  FileText,
  AlertCircle,
  Package
} from 'lucide-react';
import type { ArchivedRecord, Payment, Refund } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';

interface ArchivedDetailPanelProps {
  archive: ArchivedRecord | null;
}

type FinancialTransaction = (Payment | Refund) & {
  type: 'payment' | 'refund';
};

export const ArchivedDetailPanel: React.FC<ArchivedDetailPanelProps> = ({ archive }) => {
  if (!archive) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <Archive className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Selecteer een gearchiveerde reservering
          </h3>
          <p className="text-neutral-400">
            Klik op "Bekijken" in de lijst om de complete financiële geschiedenis te zien
          </p>
        </div>
      </div>
    );
  }

  // Combine and sort financial transactions
  const financialTimeline: FinancialTransaction[] = [
    ...(archive.financials.payments || []).map(p => ({ ...p, type: 'payment' as const })),
    ...(archive.financials.refunds || []).map(r => ({ ...r, type: 'refund' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const { totalPrice, totalPaid, totalRefunded, netRevenue } = archive.financials;
  const hasOutstanding = netRevenue < totalPrice;

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b-2 border-gold-500 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Archive className="w-6 h-6 text-gold-400" />
              <h2 className="text-2xl font-bold text-white">
                {archive.reservation.companyName || archive.reservation.contactPerson}
              </h2>
              <span className="px-3 py-1 bg-neutral-700 text-neutral-300 rounded-full text-sm font-semibold border border-neutral-600">
                🔒 Gearchiveerd
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(archive.archivedAt)} door {archive.archivedBy}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Event: {formatDate(archive.reservation.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {archive.reservation.numberOfPersons} personen
              </span>
            </div>
          </div>
        </div>

        {/* Archive Reason */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-300">Reden van archivering</div>
              <div className="text-sm text-blue-200 mt-1">{archive.archiveReason}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-5xl mx-auto">
          
          {/* Financial Summary Cards */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold-400" />
              Financieel Overzicht
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  Totaalprijs
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(totalPrice)}
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
                {archive.financials.payments.length > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    {archive.financials.payments.length} betaling(en)
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
                {archive.financials.refunds.length > 0 && (
                  <div className="text-xs text-purple-400 mt-1">
                    {archive.financials.refunds.length} restitutie(s)
                  </div>
                )}
              </div>

              <div className={cn(
                "rounded-xl p-4 border",
                hasOutstanding
                  ? "bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/30"
                  : "bg-gradient-to-br from-gold-900/30 to-gold-800/20 border-gold-500/30"
              )}>
                <div className={cn(
                  "flex items-center gap-2 text-sm mb-1",
                  hasOutstanding ? "text-orange-400" : "text-gold-400"
                )}>
                  <DollarSign className="w-4 h-4" />
                  Netto Inkomsten
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(netRevenue)}
                </div>
                {hasOutstanding && (
                  <div className="text-xs text-orange-400 mt-1">
                    ⚠️ Openstaand saldo
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Financial Timeline */}
          <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-400" />
              Financiële Tijdlijn
            </h3>

            {financialTimeline.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Geen transacties geregistreerd</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {financialTimeline.map((transaction, idx) => {
                    const isPayment = transaction.type === 'payment';
                    const Icon = isPayment ? ArrowDownCircle : ArrowUpCircle;
                    const bgColor = isPayment ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/10 border-purple-500/30';
                    const textColor = isPayment ? 'text-green-400' : 'text-purple-400';

                    return (
                      <div
                        key={`${transaction.type}-${transaction.id}-${idx}`}
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
                                      {(transaction as Refund).reason === 'cancellation' && 'Annulering'}
                                      {(transaction as Refund).reason === 'rebooking' && 'Overboeking'}
                                      {(transaction as Refund).reason === 'goodwill' && 'Coulance'}
                                      {(transaction as Refund).reason === 'discount' && 'Korting'}
                                      {(transaction as Refund).reason === 'overpayment' && 'Te veel betaald'}
                                      {(transaction as Refund).reason === 'other' && 'Anders'}
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

                {/* Net Revenue Calculation */}
                <div className="pt-6 border-t-2 border-gold-500/30">
                  <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-xl p-6 border border-gold-500/30">
                    <h4 className="text-sm font-medium text-neutral-400 mb-3">Financiële Samenvatting</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Reservering Totaal:</span>
                        <span className="text-white font-medium">{formatCurrency(totalPrice)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400 flex items-center gap-2">
                          <ArrowDownCircle className="w-4 h-4" />
                          Totaal Betaald:
                        </span>
                        <span className="text-green-400 font-semibold">{formatCurrency(totalPaid)}</span>
                      </div>
                      
                      {totalRefunded > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-400 flex items-center gap-2">
                            <ArrowUpCircle className="w-4 h-4" />
                            Totaal Gerestitueerd:
                          </span>
                          <span className="text-purple-400 font-semibold">− {formatCurrency(totalRefunded)}</span>
                        </div>
                      )}
                      
                      <div className="h-px bg-neutral-700 my-3"></div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gold-400 font-semibold">Netto Inkomsten:</span>
                        <span className="text-3xl font-bold text-gold-400">
                          {formatCurrency(netRevenue)} {netRevenue >= totalPrice ? '✓' : ''}
                        </span>
                      </div>

                      {hasOutstanding && (
                        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Openstaand saldo: {formatCurrency(totalPrice - netRevenue)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Customer Information */}
          <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-400" />
              Klantinformatie
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400">Bedrijfsnaam</label>
                <div className="text-white font-medium mt-1">
                  {archive.reservation.companyName || '−'}
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Contactpersoon</label>
                <div className="text-white font-medium mt-1">
                  {archive.reservation.contactPerson}
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Email</label>
                <div className="text-white font-medium mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  {archive.reservation.email}
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Telefoon</label>
                <div className="text-white font-medium mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  {archive.reservation.phone || '−'}
                </div>
              </div>
            </div>
          </section>

          {/* Event Details */}
          <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-400" />
              Event Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400">Event Datum</label>
                <div className="text-white font-medium mt-1">
                  {formatDate(archive.reservation.eventDate)}
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Aantal Personen</label>
                <div className="text-white font-medium mt-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-400" />
                  {archive.reservation.numberOfPersons}
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Arrangement</label>
                <div className="text-white font-medium mt-1 flex items-center gap-2">
                  <Package className="w-4 h-4 text-neutral-400" />
                  {archive.reservation.arrangement}
                </div>
              </div>
              {archive.reservation.notes && (
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400">Notities</label>
                  <div className="text-white mt-1">
                    {archive.reservation.notes}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Communication Log */}
          {archive.communication.emailsSent > 0 && (
            <section className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gold-400" />
                Communicatie
              </h3>
              <div className="text-sm text-neutral-300">
                <span className="font-medium">{archive.communication.emailsSent}</span> email(s) verzonden
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
