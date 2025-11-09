/**
 * EventWorkshopTools - Tab 3: Tools & Bulk
 * 
 * Een rustige, schone pagina voor krachtige acties die niet dagelijks nodig zijn:
 * - Bulk toevoegen van events
 * - Exporteren naar CSV
 * - Dupliceren van events
 * - Bulk delete (met bevestiging)
 */

import React, { useState } from 'react';
import {
  Plus,
  Download,
  Copy,
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { BulkEventModal } from './BulkEventModal';
import { DuplicateEventModal } from './DuplicateEventModal';
import type { AdminEvent } from '../../types';
import { cn } from '../../utils';

interface EventWorkshopToolsProps {
  events: AdminEvent[];
  onBulkAddSuccess: () => void;
  onExport: () => Promise<void>;
}

export const EventWorkshopTools: React.FC<EventWorkshopToolsProps> = ({
  events,
  onBulkAddSuccess,
  onExport,
}) => {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      await onExport();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          ⚙️ Tools & Bulk Acties
        </h2>
        <p className="text-neutral-400 mt-2">
          Krachtige tools voor administratieve taken en bulk operaties
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bulk Toevoegen */}
        <ToolCard
          icon={Plus}
          title="Bulk Toevoegen"
          description="Voeg meerdere events tegelijk toe met één formulier"
          color="gold"
          onClick={() => setShowBulkModal(true)}
          badge={`${events.length} events`}
        />

        {/* Exporteren */}
        <ToolCard
          icon={Download}
          title="Exporteer naar CSV"
          description="Download alle events als spreadsheet voor externe verwerking"
          color="blue"
          onClick={handleExport}
          isLoading={isExporting}
          success={exportSuccess}
        />

        {/* Dupliceren */}
        <ToolCard
          icon={Copy}
          title="Event Dupliceren"
          description="Kopieer een bestaand event naar een nieuwe datum"
          color="purple"
          onClick={() => setShowDuplicateModal(true)}
        />
      </div>

      {/* Info Sectie */}
      <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          Over deze Tools
        </h3>
        
        <div className="space-y-4 text-sm text-neutral-300">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Bulk Toevoegen</h4>
              <p className="text-neutral-400">
                Perfect voor het plannen van seizoenen of terugkerende events. Voeg in één keer 
                meerdere datums toe met dezelfde configuratie. Ideaal voor voorstellingen die 
                elke week plaatsvinden.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Exporteren naar CSV</h4>
              <p className="text-neutral-400">
                Exporteer alle event data naar een CSV bestand. Handig voor rapportages, 
                analyse in Excel, of backup doeleinden. Bevat alle event details, 
                capaciteit en boekingsstatistieken.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Copy className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Event Dupliceren</h4>
              <p className="text-neutral-400">
                Kopieer een bestaand event naar een nieuwe datum. Alle instellingen 
                (capaciteit, tijden, type) worden gekopieerd. Reserveringen worden 
                <strong className="text-white"> niet</strong> gekopieerd.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Best Practices
        </h3>
        
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="flex items-start gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>
              <strong>Bulk toevoegen:</strong> Gebruik dit voor terugkerende shows. 
              Liever 10 events in één keer dan 10 keer handmatig invoeren.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>
              <strong>Exporteer regelmatig:</strong> Maak elke maand een backup van je event data. 
              Dit is handig voor rapportages en archivering.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>
              <strong>Dupliceer slim:</strong> Als je een succesvol event wilt herhalen, 
              dupliceer het i.p.v. alles opnieuw in te voeren.
            </span>
          </li>
        </ul>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox
          label="Totaal Events"
          value={events.length}
          subtext="in het systeem"
        />
        <StatBox
          label="Actieve Events"
          value={events.filter(e => e.isActive).length}
          subtext="momenteel boekbaar"
        />
        <StatBox
          label="Toekomstige Events"
          value={events.filter(e => new Date(e.date) > new Date()).length}
          subtext="nog te komen"
        />
      </div>

      {/* Modals */}
      {showBulkModal && (
        <BulkEventModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            onBulkAddSuccess();
            setShowBulkModal(false);
          }}
        />
      )}

      {showDuplicateModal && (
        <DuplicateEventModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          event={null}
          onSuccess={() => {
            onBulkAddSuccess();
            setShowDuplicateModal(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// TOOL CARD COMPONENT
// ============================================================================

interface ToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'gold' | 'blue' | 'purple' | 'red';
  onClick: () => void;
  badge?: string;
  isLoading?: boolean;
  success?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  badge,
  isLoading,
  success,
}) => {
  const colorClasses = {
    gold: {
      border: 'border-gold-500/30 hover:border-gold-500/50',
      bg: 'bg-gold-500/10 hover:bg-gold-500/20',
      iconBg: 'bg-gold-500/20',
      iconText: 'text-gold-400',
      button: 'bg-gold-500 hover:bg-gold-600',
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/50',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconText: 'text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/50',
      bg: 'bg-purple-500/10 hover:bg-purple-500/20',
      iconBg: 'bg-purple-500/20',
      iconText: 'text-purple-400',
      button: 'bg-purple-500 hover:bg-purple-600',
    },
    red: {
      border: 'border-red-500/30 hover:border-red-500/50',
      bg: 'bg-red-500/10 hover:bg-red-500/20',
      iconBg: 'bg-red-500/20',
      iconText: 'text-red-400',
      button: 'bg-red-500 hover:bg-red-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'bg-neutral-800/50 rounded-xl p-6 border-2 transition-all cursor-pointer group',
        colors.border,
        colors.bg
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colors.iconBg)}>
          <Icon className={cn('w-6 h-6', colors.iconText)} />
        </div>
        {badge && (
          <span className="text-xs font-medium text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 mb-4">{description}</p>

      <button
        className={cn(
          'w-full px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2',
          colors.button,
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Bezig...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Voltooid!</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4" />
            <span>Start</span>
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// STAT BOX COMPONENT
// ============================================================================

interface StatBoxProps {
  label: string;
  value: number;
  subtext: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, subtext }) => (
  <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
    <div className="text-xs text-neutral-400 mb-1">{label}</div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-neutral-500">{subtext}</div>
  </div>
);
