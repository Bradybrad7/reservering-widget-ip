/**
 * ToolsTab - Tab 3: "📥 Import & Export"
 * 
 * DOEL: Overzichtelijke pagina voor data beheer en bulk-acties.
 * 
 * SECTIES:
 * - Nieuw: Handmatige boeking
 * - Import: Basis/Volledig/Migratie import
 * - Export: CSV export & PDF overzichten
 */

import { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  FileText,
  Database,
  Package,
  ArrowRight,
  X,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import type { Event, Reservation } from '../../../types';
import { formatDate } from '../../../utils';
import { ManualBookingManager } from '../QuickBooking';
import { SmartImport } from '../SmartImport';
import { SystemMigrationImport } from '../SystemMigrationImport';
import { PDFExportManager } from '../PDFExportManager';
import { ExcelExportManager } from '../ExcelExportManager';

interface ToolsTabProps {
  events: Event[];
  reservations: Reservation[];
  onRefresh: () => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ events, reservations, onRefresh }) => {
  
  // Modal states
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showMigrationImport, setShowMigrationImport] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  
  // Selected event for import
  const [smartImportEvent, setSmartImportEvent] = useState<Event | null>(null);

  // Event selector helper for Smart Import
  const handleSelectEventForSmartImport = () => {
    if (events.length === 0) {
      alert('Geen events beschikbaar');
      return;
    }
    if (events.length === 1) {
      setSmartImportEvent(events[0]);
      setShowSmartImport(true);
    } else {
      setShowEventSelector(true);
    }
  };

  const handleEventSelected = (event: Event) => {
    setSmartImportEvent(event);
    setShowEventSelector(false);
    setShowSmartImport(true);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            📥 Import & Export
          </h2>
          <p className="text-neutral-400">
            Data beheer, bulk-acties en handmatige boekingen
          </p>
        </div>

        {/* Sectie: Nieuw */}
        <ToolSection title="Nieuw" icon={Plus}>
          <ToolCard
            icon={Plus}
            title="Handmatige Boeking"
            description="Maak een nieuwe reservering handmatig aan voor een specifiek event"
            buttonText="Nieuwe Boeking"
            buttonColor="gold"
            onClick={() => setShowManualBooking(true)}
            disabled={events.length === 0}
          />
        </ToolSection>

        {/* Sectie: Import */}
        <ToolSection title="Import" icon={Upload}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolCard
              icon={Sparkles}
              title="Slimme Import"
              description="Flexibele import met automatische detectie - van minimaal tot volledig"
              buttonText="Reserveringen Importeren"
              buttonColor="purple"
              onClick={handleSelectEventForSmartImport}
              disabled={events.length === 0}
            />

            <ToolCard
              icon={Database}
              title="Systeem Migratie"
              description="Voor interne migratie van oude boekingssysteem data"
              buttonText="Migratie Import"
              buttonColor="neutral"
              onClick={() => setShowMigrationImport(true)}
            />
          </div>
        </ToolSection>

        {/* Excel Export Manager (Prominent) */}
        <div id="excel-export" className="pt-4">
          <ExcelExportManager
            reservations={reservations}
          />
        </div>

        {/* PDF Export Manager */}
        <div id="pdf-manager" className="pt-4">
          <PDFExportManager
            reservations={reservations}
            events={events}
            merchandiseItems={[]}
          />
        </div>
      </div>

      {/* Modals */}
      {showManualBooking && (
        <ManualBookingManager
          onClose={() => {
            setShowManualBooking(false);
            onRefresh();
          }}
        />
      )}

      {showSmartImport && smartImportEvent && (
        <SmartImport
          event={smartImportEvent}
          onClose={() => {
            setShowSmartImport(false);
            setSmartImportEvent(null);
          }}
          onImportComplete={() => {
            setShowSmartImport(false);
            setSmartImportEvent(null);
            onRefresh();
          }}
        />
      )}

      {showMigrationImport && (
        <SystemMigrationImport
          onClose={() => {
            setShowMigrationImport(false);
          }}
          onImportComplete={() => {
            setShowMigrationImport(false);
            onRefresh();
          }}
        />
      )}

      {showEventSelector && (
        <EventSelectorModal
          events={events}
          onSelect={handleEventSelected}
          onClose={() => setShowEventSelector(false)}
        />
      )}
    </div>
  );
};

// ============================
// Sub-componenten
// ============================

interface ToolSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const ToolSection: React.FC<ToolSectionProps> = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-gold-400" />
      {title}
    </h3>
    {children}
  </div>
);

interface ToolCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  buttonText: string;
  buttonColor: 'gold' | 'green' | 'blue' | 'purple' | 'neutral';
  onClick: () => void;
  disabled?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor,
  onClick,
  disabled = false
}) => {
  const colorClasses = {
    gold: 'bg-gold-500 hover:bg-gold-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    neutral: 'bg-neutral-600 hover:bg-neutral-700'
  };

  return (
    <div className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-6 hover:border-neutral-600 transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-neutral-700 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-gold-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
          <p className="text-sm text-neutral-400 mb-4">{description}</p>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all
              ${disabled ? 'bg-neutral-700 cursor-not-allowed opacity-50' : colorClasses[buttonColor]}
            `}
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Event Selector Modal
interface EventSelectorModalProps {
  events: Event[];
  onSelect: (event: Event) => void;
  onClose: () => void;
}

const EventSelectorModal: React.FC<EventSelectorModalProps> = ({ events, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Filter events based on search
  const filteredEvents = sortedEvents.filter(event => {
    const dateStr = formatDate(event.date instanceof Date ? event.date : new Date(event.date));
    const searchLower = searchTerm.toLowerCase();
    return dateStr.toLowerCase().includes(searchLower) || 
           event.type.toLowerCase().includes(searchLower) ||
           event.id.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Selecteer Event</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Zoek op datum, type of ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              Geen events gevonden
            </div>
          ) : (
            filteredEvents.map(event => {
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              const isUpcoming = eventDate >= new Date();
              
              return (
                <button
                  key={event.id}
                  onClick={() => onSelect(event)}
                  className="w-full p-4 bg-neutral-900 hover:bg-neutral-700 rounded-lg border border-neutral-700 hover:border-purple-500 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-semibold text-white">
                          {formatDate(eventDate)}
                        </span>
                        {isUpcoming && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                            Aankomend
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {event.type} • {event.id}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
