import { useState } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  MessageSquare,
  AlertTriangle,
  MapPin,
  ShoppingBag,
  Archive,
  Edit,
  Trash2,
  Send,
  Download,
  RefreshCw,
  Copy,
  ExternalLink,
  QrCode
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem } from '../../../types';
import { formatCurrency, formatDate, cn } from '../../../utils';
import { StatusBadge } from '../../ui/StatusBadge';
import { 
  isOptionExpired, 
  isOptionExpiringSoon, 
  getOptionStatusLabel 
} from '../../../utils/optionHelpers';
import { QRCodeGenerator } from '../QRCodeGenerator';

// Helper componenten voor een schone layout
const InfoBlok: React.FC<{ 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
  className?: string 
}> = ({ title, icon: Icon, children, className = '' }) => (
  <div className={cn('bg-neutral-800/50 rounded-xl border border-neutral-700/50', className)}>
    <h4 className="text-base font-bold text-gold-400 mb-4 flex items-center gap-2 p-4 border-b border-neutral-700/50">
      <Icon className="w-5 h-5" />
      {title}
    </h4>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </div>
);

const InfoRij: React.FC<{ 
  label: string; 
  children: React.ReactNode; 
  vertical?: boolean 
}> = ({ label, children, vertical = false }) => (
  <div>
    <label className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">{label}</label>
    {vertical ? (
      <div className="text-white font-medium mt-1 text-sm leading-relaxed">
        {children || <span className="text-neutral-500 italic">N.v.t.</span>}
      </div>
    ) : (
      <p className="text-white font-medium mt-0.5 truncate">
        {children || <span className="text-neutral-500 italic">N.v.t.</span>}
      </p>
    )}
  </div>
);

// De vernieuwde Reservation Detail Modal
export const ReservationDetailModal: React.FC<{
  reservation: Reservation;
  event?: Event;
  merchandiseItems: MerchandiseItem[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  onMarkAsPaid?: () => void;
  onSendEmail?: () => void;
  onExport?: () => void;
  onArchive?: () => void;
  onConvertToConfirmed?: () => void;
}> = ({ 
  reservation, 
  event, 
  merchandiseItems, 
  onClose,
  onEdit,
  onDelete,
  onConfirm,
  onReject,
  onMarkAsPaid,
  onSendEmail,
  onExport,
  onArchive,
  onConvertToConfirmed
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Prijsberekening (gebruik pricingSnapshot indien aanwezig)
  const pricing = reservation.pricingSnapshot;
  const arrangementTotaal = pricing?.arrangementTotal || (reservation.numberOfPersons * 35); // Fallback
  const preDrinkTotaal = pricing?.preDrinkTotal || 0;
  const afterPartyTotaal = pricing?.afterPartyTotal || 0;
  const merchandiseTotaal = pricing?.merchandiseTotal || 0;
  const korting = (pricing?.discountAmount || 0) + (pricing?.voucherAmount || 0);

  // Kopieer ID naar clipboard met feedback
  const copyIdToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reservation.id);
      // Visual feedback via temp state change of gebruik toast indien beschikbaar
      alert('ID gekopieerd naar clipboard!');
    } catch (err) {
      alert('Kon ID niet kopiëren');
    }
  };

  // Kopieer email naar clipboard met feedback
  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reservation.email);
      alert('Email gekopieerd naar clipboard!');
    } catch (err) {
      alert('Kon email niet kopiëren');
    }
  };

  // Wrapper voor async acties met loading state
  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 max-w-5xl w-full my-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* === HEADER === */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-neutral-700/50 bg-gradient-to-r from-neutral-900 to-neutral-800/50">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              Reservering #{reservation.id.slice(-8).toUpperCase()}
              {isProcessing && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verwerken...
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge type="booking" status={reservation.status} size="md" showIcon={true} />
              
              {reservation.paymentStatus && (
                <StatusBadge type="payment" status={reservation.paymentStatus as any} size="md" showIcon={true} />
              )}
              
              {reservation.status === 'option' && reservation.optionExpiresAt && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2',
                  isOptionExpired(reservation)
                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                    : isOptionExpiringSoon(reservation)
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                )}>
                  {getOptionStatusLabel(reservation)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-700/50 rounded-xl transition-all hover:rotate-90 duration-300">
            <X className="w-6 h-6 text-neutral-400" />
          </button>
        </div>

        {/* === MAIN CONTENT (2-KOLOMS LAYOUT) === */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* === LINKERKOLOM (BOEKING DETAILS) === */}
          <div className="lg:col-span-2 space-y-6">
            
            <InfoBlok title="Event & Arrangement" icon={Calendar}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoRij label="Event">
                  {event ? formatDate(event.date) : 'Onbekend'}
                </InfoRij>
                <InfoRij label="Tijd">
                  {event ? `${event.doorsOpen} - ${event.endsAt}` : 'N.v.t.'}
                </InfoRij>
                <InfoRij label="Aantal Personen">
                  <span className="text-2xl font-bold">{reservation.numberOfPersons}</span>
                </InfoRij>
              </div>
              <InfoRij label="Arrangement">
                {reservation.arrangement ? (
                  <span className="font-semibold text-gold-400">{reservation.arrangement}</span>
                ) : (
                  <span className="text-orange-400 italic">Nog geen arrangement (optie)</span>
                )}
              </InfoRij>
              {reservation.partyPerson && (
                <InfoRij label="Feestvierder">
                  🎉 {reservation.partyPerson}
                </InfoRij>
              )}
            </InfoBlok>
            
            <InfoBlok title="Prijs & Betaling" icon={DollarSign}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300">Arrangement ({reservation.numberOfPersons}x)</span>
                    <span className="text-white font-medium">{formatCurrency(arrangementTotaal)}</span>
                  </div>
                  {preDrinkTotaal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Pre-drink</span>
                      <span className="text-white font-medium">{formatCurrency(preDrinkTotaal)}</span>
                    </div>
                  )}
                  {afterPartyTotaal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">After-party</span>
                      <span className="text-white font-medium">{formatCurrency(afterPartyTotaal)}</span>
                    </div>
                  )}
                  {merchandiseTotaal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Merchandise</span>
                      <span className="text-white font-medium">{formatCurrency(merchandiseTotaal)}</span>
                    </div>
                  )}
                  {korting > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Korting/Voucher</span>
                      <span className="text-green-400 font-medium">-{formatCurrency(korting)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-gold-500/20">
                    <span className="text-lg font-bold text-white">Totaal</span>
                    <span className="text-2xl font-bold text-gold-400">{formatCurrency(reservation.totalPrice)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <InfoRij label="Betaalstatus">
                    <StatusBadge type="payment" status={reservation.paymentStatus as any} size="sm" showIcon={true} />
                  </InfoRij>
                  <InfoRij label="Betaalmethode">
                    {reservation.paymentMethod}
                  </InfoRij>
                  <InfoRij label="Betaald op">
                    {reservation.paymentReceivedAt ? new Date(reservation.paymentReceivedAt).toLocaleString('nl-NL') : 'N.v.t.'}
                  </InfoRij>
                </div>
              </div>
            </InfoBlok>

            {reservation.merchandise && reservation.merchandise.length > 0 && (
              <InfoBlok title="Merchandise Bestelling" icon={ShoppingBag}>
                <div className="space-y-3">
                  {reservation.merchandise.map((selection, idx) => {
                    const item = merchandiseItems.find(m => m.id === selection.itemId);
                    if (!item) {
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-red-900/50 rounded-lg border border-red-500/30">
                          <div className="w-14 h-14 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-red-300">Item niet gevonden</p>
                            <p className="text-xs text-neutral-400">ID: {selection.itemId} (x{selection.quantity})</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-700">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover border-2 border-neutral-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-neutral-400">
                            {formatCurrency(item.price)} × {selection.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gold-400">{selection.quantity}×</p>
                          <p className="text-xs text-neutral-300">
                            {formatCurrency(item.price * selection.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </InfoBlok>
            )}

            <InfoBlok title="Opmerkingen & Dieetwensen" icon={MessageSquare}>
              <InfoRij label="Opmerkingen van Gast" vertical={true}>
                {reservation.comments}
              </InfoRij>
              <InfoRij label="Dieetwensen" vertical={true}>
                {reservation.dietaryRequirements?.other}
              </InfoRij>
            </InfoBlok>

          </div>

          {/* === RECHTERKOLOM (KLANT & STATUS) === */}
          <div className="lg:col-span-1 space-y-6">
            
            <InfoBlok title="Klantgegevens" icon={Users}>
              <InfoRij label="Contactpersoon">
                {reservation.contactPerson}
              </InfoRij>
              <InfoRij label="Email">
                <a href={`mailto:${reservation.email}`} className="text-blue-400 hover:text-blue-300">
                  {reservation.email}
                </a>
              </InfoRij>
              <InfoRij label="Telefoon">
                <a href={`tel:${reservation.phoneCountryCode}${reservation.phone}`} className="text-blue-400 hover:text-blue-300">
                  {reservation.phoneCountryCode} {reservation.phone}
                </a>
              </InfoRij>
              <InfoRij label="Bedrijfsnaam">
                {reservation.companyName}
              </InfoRij>
              <InfoRij label="BTW Nummer">
                {reservation.vatNumber}
              </InfoRij>
            </InfoBlok>

            <InfoBlok title="Adresgegevens" icon={MapPin}>
              <InfoRij label="Adres" vertical={true}>
                {reservation.address && (
                  <>
                    {reservation.address} {reservation.houseNumber}<br/>
                    {reservation.postalCode} {reservation.city}<br/>
                    {reservation.country}
                  </>
                )}
              </InfoRij>
              {reservation.invoiceAddress && (
                <InfoRij label="Factuuradres" vertical={true}>
                  {reservation.invoiceAddress} {reservation.invoiceHouseNumber}<br/>
                  {reservation.invoicePostalCode} {reservation.invoiceCity}<br/>
                  {reservation.invoiceCountry}
                </InfoRij>
              )}
            </InfoBlok>

            {/* QR CODE SECTION */}
            <InfoBlok title="Check-in QR Code" icon={QrCode} className="bg-white/5">
              <div className="flex flex-col items-center gap-3">
                <QRCodeGenerator
                  reservation={reservation}
                  size={200}
                  includeDetails={false}
                />
                <p className="text-xs text-center text-neutral-400">
                  Toon deze QR code bij check-in voor snelle toegang
                </p>
              </div>
            </InfoBlok>

            <InfoBlok title="Admin" icon={Archive}>
              {reservation.tags && reservation.tags.length > 0 && (
                <InfoRij label="Tags">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {reservation.tags.map((tag, idx) => {
                      const isAutomatic = ['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag);
                      return (
                        <span 
                          key={idx} 
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1',
                            isAutomatic 
                              ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          )}
                        >
                          {isAutomatic && <span>🤖</span>}
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </InfoRij>
              )}
              {reservation.notes && (
                <InfoRij label="🔒 Interne Notities (Admin Only)" vertical={true}>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-white text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {reservation.notes}
                    </p>
                  </div>
                </InfoRij>
              )}
              <InfoRij label="Reservering ID" vertical={true}>
                <span className="text-xs font-mono">{reservation.id}</span>
              </InfoRij>
              <InfoRij label="Aangemaakt op">
                {new Date(reservation.createdAt).toLocaleString('nl-NL')}
              </InfoRij>
              <InfoRij label="Laatste update">
                {new Date(reservation.updatedAt).toLocaleString('nl-NL')}
              </InfoRij>
            </InfoBlok>

          </div>
        </div>

        {/* === FOOTER MET ACTIES === */}
        <div className="px-6 pb-6 border-t border-neutral-700/50 pt-6">
          <div className="space-y-4">
            
            {/* Primaire Acties - Altijd zichtbaar */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex flex-wrap gap-3">
                
                {/* Bewerken */}
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      onClose();
                    }}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-blue-500/50"
                  >
                    <Edit className="w-4 h-4" />
                    Bewerken
                  </button>
                )}

                {/* Status Acties */}
                {reservation.status === 'pending' && onConfirm && (
                  <button
                    onClick={() => handleAction(async () => {
                      await onConfirm();
                    }, 'confirm')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-green-500/50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Bevestigen
                      </>
                    )}
                  </button>
                )}

                {reservation.status === 'option' && onConvertToConfirmed && (
                  <button
                    onClick={() => handleAction(async () => {
                      await onConvertToConfirmed();
                    }, 'convertToConfirmed')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-purple-500/50"
                  >
                    <RefreshCw className={cn("w-4 h-4", isProcessing && "animate-spin")} />
                    {isProcessing ? 'Bezig...' : 'Omzetten naar Bevestigd'}
                  </button>
                )}

                {(reservation.status === 'pending' || reservation.status === 'option') && onReject && (
                  <button
                    onClick={() => {
                      if (confirm('Weet je zeker dat je deze reservering wilt afwijzen?')) {
                        handleAction(async () => {
                          await onReject();
                          onClose();
                        }, 'reject');
                      }
                    }}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-red-500/50"
                  >
                    <XCircle className="w-4 h-4" />
                    Afwijzen
                  </button>
                )}

                {/* Betaling */}
                {reservation.paymentStatus !== 'paid' && onMarkAsPaid && (
                  <button
                    onClick={() => handleAction(async () => {
                      await onMarkAsPaid();
                    }, 'markAsPaid')}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-emerald-500/50"
                  >
                    <DollarSign className="w-4 h-4" />
                    {isProcessing ? 'Bezig...' : 'Markeer als Betaald'}
                  </button>
                )}

                {/* Email */}
                {onSendEmail && (
                  <button
                    onClick={() => {
                      onSendEmail();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-cyan-500/50"
                  >
                    <Send className="w-4 h-4" />
                    Email Sturen
                  </button>
                )}
              </div>

              {/* Meer Acties Toggle */}
              <button
                onClick={() => setShowActions(!showActions)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl transition-all font-semibold"
              >
                {showActions ? 'Minder' : 'Meer'} Acties
                <AlertCircle className={cn("w-4 h-4 transition-transform", showActions && "rotate-180")} />
              </button>
            </div>

            {/* Secundaire Acties - Toonbaar */}
            {showActions && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-neutral-700/50">
                
                {/* Exporteren */}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Exporteren
                  </button>
                )}

                {/* Archiveren */}
                {onArchive && (
                  <button
                    onClick={() => {
                      if (confirm('Weet je zeker dat je deze reservering wilt archiveren?')) {
                        onArchive();
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    Archiveren
                  </button>
                )}

                {/* ID Kopiëren */}
                <button
                  onClick={copyIdToClipboard}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all text-sm"
                  title="Kopieer Reservering ID"
                >
                  <Copy className="w-4 h-4" />
                  Kopieer ID
                </button>

                {/* Email Kopiëren */}
                <button
                  onClick={copyEmailToClipboard}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all text-sm"
                  title="Kopieer Email"
                >
                  <Mail className="w-4 h-4" />
                  Kopieer Email
                </button>

                {/* Extern Openen (bijv. in CRM) */}
                <button
                  onClick={() => window.open(`mailto:${reservation.email}`, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Email Client
                </button>

                {/* Verwijderen */}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Weet je ZEKER dat je deze reservering permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
                        onDelete();
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Verwijderen
                  </button>
                )}
              </div>
            )}

            {/* Sluiten Button - Altijd aanwezig */}
            <div className="flex justify-end pt-3 border-t border-neutral-700/50">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all font-semibold shadow-lg hover:shadow-gold-500/50 transform hover:scale-105 duration-200"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
