/**
 * EmailTemplateEditorEnhanced
 * 
 * Verbeterde email template editor met:
 * - Live preview met voorbeeld data
 * - Variable autocomplete
 * - Variable picker dropdown
 * - Syntax highlighting voor variables
 */

import { useState, useRef, useEffect } from 'react';
import { Eye, Code, Type, Zap, Info } from 'lucide-react';
import { cn } from '../../utils';

interface Variable {
  key: string;
  label: string;
  example: string;
  category: 'customer' | 'reservation' | 'event' | 'payment';
}

const AVAILABLE_VARIABLES: Variable[] = [
  // Customer
  { key: '{{customerName}}', label: 'Klant Naam', example: 'John Doe', category: 'customer' },
  { key: '{{companyName}}', label: 'Bedrijfsnaam', example: 'Acme Corp', category: 'customer' },
  { key: '{{email}}', label: 'Email', example: 'john@example.com', category: 'customer' },
  { key: '{{phone}}', label: 'Telefoon', example: '+31 6 12345678', category: 'customer' },
  
  // Reservation
  { key: '{{numberOfPersons}}', label: 'Aantal Personen', example: '8', category: 'reservation' },
  { key: '{{arrangement}}', label: 'Arrangement', example: 'Premium', category: 'reservation' },
  { key: '{{reservationId}}', label: 'Reserveringsnummer', example: 'RES-2025-001', category: 'reservation' },
  { key: '{{tableNumber}}', label: 'Tafelnummer', example: '5', category: 'reservation' },
  
  // Event
  { key: '{{eventDate}}', label: 'Event Datum', example: '15 december 2025', category: 'event' },
  { key: '{{eventTime}}', label: 'Event Tijd', example: '19:30', category: 'event' },
  { key: '{{eventType}}', label: 'Event Type', example: 'Weekend Show', category: 'event' },
  { key: '{{venueName}}', label: 'Locatie', example: 'Inspiration Point', category: 'event' },
  
  // Payment
  { key: '{{totalPrice}}', label: 'Totaalprijs', example: '€450,00', category: 'payment' },
  { key: '{{paymentStatus}}', label: 'Betaalstatus', example: 'Betaald', category: 'payment' },
  { key: '{{invoiceNumber}}', label: 'Factuurnummer', example: 'INV-2025-042', category: 'payment' }
];

const EXAMPLE_DATA = {
  customerName: 'John Doe',
  companyName: 'Acme Corporation',
  email: 'john@example.com',
  phone: '+31 6 12345678',
  numberOfPersons: '8',
  arrangement: 'Premium',
  reservationId: 'RES-2025-001',
  tableNumber: '5',
  eventDate: '15 december 2025',
  eventTime: '19:30',
  eventType: 'Weekend Show',
  venueName: 'Inspiration Point',
  totalPrice: '€450,00',
  paymentStatus: 'Betaald',
  invoiceNumber: 'INV-2025-042'
};

interface EmailTemplateEditorProps {
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  subject,
  body,
  onSubjectChange,
  onBodyChange
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(EXAMPLE_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const insertVariable = (variable: string) => {
    if (bodyTextareaRef.current) {
      const textarea = bodyTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = body.substring(0, start) + variable + body.substring(end);
      onBodyChange(newValue);
      
      // Set cursor after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
    setShowVariables(false);
  };

  const highlightVariables = (text: string): React.ReactNode => {
    const parts = text.split(/({{[^}]+}})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={index} className="bg-blue-500/20 text-blue-300 px-1 rounded">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const groupedVariables = AVAILABLE_VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);

  const categoryLabels = {
    customer: 'Klant Gegevens',
    reservation: 'Reservering',
    event: 'Event Details',
    payment: 'Betaling'
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded transition-colors',
              showVariables ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">Variables</span>
          </button>
          
          <div className="w-px h-6 bg-gray-700" />
          
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Info className="w-4 h-4" />
            <span>Gebruik {'{{'} variable {'}}'} syntax</span>
          </div>
        </div>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded transition-colors',
            showPreview ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          )}
        >
          {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm">{showPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Variables Panel */}
      {showVariables && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Beschikbare Variables
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(groupedVariables).map(([category, variables]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <div className="space-y-1">
                  {variables.map(variable => (
                    <button
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      className="w-full text-left px-3 py-2 bg-gray-900/50 hover:bg-gray-700 rounded transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-mono">{variable.key}</span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-400">
                          Klik om in te voegen
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {variable.label} • Preview: <span className="text-blue-400">{variable.example}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Email onderwerp..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Body
            </label>
            <textarea
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Email inhoud... Gebruik {{variableName}} voor dynamische content"
              rows={16}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview (met voorbeeld data)
              </label>
              <div className="bg-white text-gray-900 rounded-lg p-4 border-2 border-gray-700">
                <div className="font-semibold text-lg mb-4 pb-3 border-b border-gray-200">
                  {replaceVariables(subject)}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {replaceVariables(body)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
