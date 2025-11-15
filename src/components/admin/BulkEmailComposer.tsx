/**
 * BulkEmailComposer - Compose and Send Emails to Selected Items
 * 
 * Features:
 * - Email template selection
 * - Rich text editor
 * - Variable substitution ({{name}}, {{date}}, etc.)
 * - Preview mode
 * - Send with progress tracking
 * - V3 design with gold theme
 */

import React, { useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  X,
  Sparkles,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { cn } from '../../utils';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'confirmation' | 'reminder' | 'cancellation' | 'custom';
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'confirmation',
    name: 'Bevestiging',
    subject: 'Bevestiging reservering {{eventType}} op {{date}}',
    body: `Beste {{name}},\n\nBedankt voor je reservering!\n\nDetails:\n- Event: {{eventType}}\n- Datum: {{date}}\n- Tijd: {{time}}\n- Aantal personen: {{numberOfPeople}}\n- Arrangement: {{arrangement}}\n\nWe kijken ernaar uit je te verwelkomen!\n\nMet vriendelijke groet,\nHet Team`,
    variables: ['name', 'eventType', 'date', 'time', 'numberOfPeople', 'arrangement'],
    category: 'confirmation'
  },
  {
    id: 'reminder',
    name: 'Herinnering',
    subject: 'Herinnering: {{eventType}} morgen om {{time}}',
    body: `Beste {{name}},\n\nDit is een vriendelijke herinnering voor je reservering morgen:\n\n- Event: {{eventType}}\n- Datum: {{date}}\n- Tijd: {{time}}\n- Aantal personen: {{numberOfPeople}}\n\nTot morgen!\n\nMet vriendelijke groet,\nHet Team`,
    variables: ['name', 'eventType', 'date', 'time', 'numberOfPeople'],
    category: 'reminder'
  },
  {
    id: 'cancellation',
    name: 'Annulering',
    subject: 'Annulering reservering {{eventType}}',
    body: `Beste {{name}},\n\nHelaas moeten we je reservering voor {{eventType}} op {{date}} annuleren.\n\n{{reason}}\n\nOnze excuses voor het ongemak.\n\nMet vriendelijke groet,\nHet Team`,
    variables: ['name', 'eventType', 'date', 'reason'],
    category: 'cancellation'
  }
];

interface BulkEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    [key: string]: any;
  }>;
  onSend: (subject: string, body: string, recipients: string[]) => Promise<void>;
}

export const BulkEmailComposer: React.FC<BulkEmailComposerProps> = ({
  isOpen,
  onClose,
  recipients,
  onSend
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState(recipients[0]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendComplete, setSendComplete] = useState(false);

  if (!isOpen) return null;

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const replaceVariables = (text: string, recipient: any): string => {
    let result = text;
    result = result.replace(/\{\{name\}\}/g, recipient.name || '');
    result = result.replace(/\{\{email\}\}/g, recipient.email || '');
    result = result.replace(/\{\{eventType\}\}/g, recipient.eventType || '');
    result = result.replace(/\{\{date\}\}/g, recipient.date || '');
    result = result.replace(/\{\{time\}\}/g, recipient.time || '');
    result = result.replace(/\{\{numberOfPeople\}\}/g, recipient.numberOfPeople || '');
    result = result.replace(/\{\{arrangement\}\}/g, recipient.arrangement || '');
    result = result.replace(/\{\{reason\}\}/g, recipient.reason || '');
    return result;
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendProgress(0);

    try {
      const recipientIds = recipients.map(r => r.id);
      
      // Simulate progress
      const interval = setInterval(() => {
        setSendProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onSend(subject, body, recipientIds);

      clearInterval(interval);
      setSendProgress(100);
      setSendComplete(true);

      setTimeout(() => {
        onClose();
        setIsSending(false);
        setSendComplete(false);
        setSendProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Error sending emails:', error);
      setIsSending(false);
      alert('❌ Fout bij versturen van emails');
    }
  };

  const previewSubject = replaceVariables(subject, previewRecipient);
  const previewBody = replaceVariables(body, previewRecipient);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl">
                <Mail className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-400">Bulk Email Versturen</h2>
                <p className="text-sm text-slate-400">
                  {recipients.length} ontvangers geselecteerd
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSending}
              className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors group disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-amber-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-180px)]">
          {/* Left: Templates & Editor */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-amber-500/20">
            {/* Template Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-300 mb-3">Kies een sjabloon:</h3>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      'p-3 rounded-lg text-left transition-all',
                      selectedTemplate?.id === template.id
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-white">{template.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{template.category}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Onderwerp:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                placeholder="Email onderwerp..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-amber-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Bericht:
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSending}
                placeholder="Email inhoud..."
                rows={12}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-amber-500 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm disabled:opacity-50 resize-none"
              />
              
              {/* Variables Help */}
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-400 font-bold mb-1">Beschikbare variabelen:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-400">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-2/5 p-6 bg-slate-900/50 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-300">Voorbeeld:</h3>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  previewMode
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900'
                    : 'bg-slate-800 text-slate-300'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                {previewMode ? 'Live' : 'Toon'}
              </button>
            </div>

            {previewMode && (
              <>
                {/* Recipient Selector */}
                <select
                  value={recipients.findIndex(r => r.id === previewRecipient.id)}
                  onChange={(e) => setPreviewRecipient(recipients[parseInt(e.target.value)])}
                  className="w-full mb-4 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {recipients.map((recipient, index) => (
                    <option key={recipient.id} value={index}>
                      {recipient.name} ({recipient.email})
                    </option>
                  ))}
                </select>

                {/* Preview Email */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Onderwerp:</p>
                    <p className="text-sm font-bold text-white">{previewSubject}</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">Bericht:</p>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {previewBody}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-amber-500/20 bg-slate-900/50">
          {isSending ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">
                  Emails versturen... {sendProgress}%
                </span>
                <span className="text-amber-400 font-bold">
                  {Math.floor((sendProgress / 100) * recipients.length)} / {recipients.length}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
                  style={{ width: `${sendProgress}%` }}
                />
              </div>
              {sendComplete && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Emails succesvol verstuurd!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User className="w-4 h-4" />
                <span>{recipients.length} ontvangers</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
                >
                  Annuleer
                </button>
                <button
                  onClick={handleSend}
                  disabled={!subject || !body}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Verstuur naar {recipients.length}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
