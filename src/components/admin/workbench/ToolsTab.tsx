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

import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Download,
  FileText,
  Database,
  Package,
  ArrowRight
} from 'lucide-react';
import type { Event } from '../../../types';
import { formatDate } from '../../../utils';
import { ManualBookingManager } from '../QuickBooking';
import { SimpleBulkImport } from '../SimpleBulkImport';
import { BulkReservationImport } from '../BulkReservationImport';
import { SystemMigrationImport } from '../SystemMigrationImport';
import { PDFExportManager } from '../PDFExportManager';

interface ToolsTabProps {
  events: Event[];
  onRefresh: () => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ events, onRefresh }) => {
  
  // Modal states
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showSimpleImport, setShowSimpleImport] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showMigrationImport, setShowMigrationImport] = useState(false);
  
  // Selected events for import
  const [simpleImportEvent, setSimpleImportEvent] = useState<Event | null>(null);
  const [bulkImportEvent, setBulkImportEvent] = useState<Event | null>(null);

  // Event selector helpers
  const handleSelectEventForSimpleImport = () => {
    if (events.length === 0) {
      alert('Geen events beschikbaar');
      return;
    }
    if (events.length === 1) {
      setSimpleImportEvent(events[0]);
      setShowSimpleImport(true);
    } else {
      // Show event selector
      const selectedId = prompt(`Selecteer event ID:\n${events.map(e => `${e.id}: ${formatDate(e.date)} - ${e.type}`).join('\n')}`);
      const event = events.find(e => e.id === selectedId);
      if (event) {
        setSimpleImportEvent(event);
        setShowSimpleImport(true);
      }
    }
  };

  const handleSelectEventForBulkImport = () => {
    if (events.length === 0) {
      alert('Geen events beschikbaar');
      return;
    }
    if (events.length === 1) {
      setBulkImportEvent(events[0]);
      setShowBulkImport(true);
    } else {
      // Show event selector
      const selectedId = prompt(`Selecteer event ID:\n${events.map(e => `${e.id}: ${formatDate(e.date)} - ${e.type}`).join('\n')}`);
      const event = events.find(e => e.id === selectedId);
      if (event) {
        setBulkImportEvent(event);
        setShowBulkImport(true);
      }
    }
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    alert('CSV Export wordt geïmplementeerd...');
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
              icon={Upload}
              title="Basis Import"
              description="Importeer alleen basis gegevens (naam, bedrijf, telefoon, email)"
              buttonText="Basis Import"
              buttonColor="green"
              onClick={handleSelectEventForSimpleImport}
              disabled={events.length === 0}
            />

            <ToolCard
              icon={Package}
              title="Volledig Import"
              description="Bulk importeer complete reserveringen naar specifiek event"
              buttonText="Volledig Import"
              buttonColor="blue"
              onClick={handleSelectEventForBulkImport}
              disabled={events.length === 0}
            />

            <ToolCard
              icon={Database}
              title="Oud Systeem Migratie"
              description="Importeer reserveringen uit het oude boekingssysteem"
              buttonText="Migratie Import"
              buttonColor="purple"
              onClick={() => setShowMigrationImport(true)}
            />
          </div>
        </ToolSection>

        {/* Sectie: Export */}
        <ToolSection title="Export" icon={Download}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolCard
              icon={Download}
              title="Exporteer CSV"
              description="Download alle reserveringen als CSV bestand"
              buttonText="Export CSV"
              buttonColor="neutral"
              onClick={handleExportCSV}
            />

            <ToolCard
              icon={FileText}
              title="PDF Overzichten"
              description="Genereer PDF rapporten en overzichten van reserveringen"
              buttonText="PDF Manager"
              buttonColor="neutral"
              onClick={() => {
                // PDF Manager is always visible below
                const pdfSection = document.getElementById('pdf-manager');
                if (pdfSection) {
                  pdfSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>
        </ToolSection>

        {/* PDF Export Manager (Altijd zichtbaar) */}
        <div id="pdf-manager" className="pt-8">
          <PDFExportManager
            reservations={[]}
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

      {showSimpleImport && simpleImportEvent && (
        <SimpleBulkImport
          event={simpleImportEvent}
          onClose={() => {
            setShowSimpleImport(false);
            setSimpleImportEvent(null);
          }}
          onImportComplete={() => {
            setShowSimpleImport(false);
            setSimpleImportEvent(null);
            onRefresh();
          }}
        />
      )}

      {showBulkImport && bulkImportEvent && (
        <BulkReservationImport
          event={bulkImportEvent}
          onClose={() => {
            setShowBulkImport(false);
            setBulkImportEvent(null);
          }}
          onImportComplete={() => {
            setShowBulkImport(false);
            setBulkImportEvent(null);
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
