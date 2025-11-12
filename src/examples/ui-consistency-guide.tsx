/**
 * 🎨 UI CONSISTENTIE STYLING GUIDE
 * 
 * Deze guide toont consistente Tailwind CSS styling patronen voor alle admin componenten,
 * gebaseerd op de tailwind.config.js kleuren en design tokens.
 * 
 * KLEURENPALET (uit tailwind.config.js):
 * - primary/gold: #FFB84D (gold-500), #D4AF37 (gold-600)
 * - dark: #0A0A0A (bg-base), #111111 (bg-elevated), #1A1918 (bg-surface)
 * - text: #F7F5F4 (text-primary), #E6E4E3 (text-secondary), #C9C6C5 (text-muted)
 * - success: green-500/600, warning: warning-500/600, error: error-500/600
 */


import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================
// 1. KNOPPEN (Buttons)
// ============================================================

export const ButtonExamples = () => (
  <div className="space-y-6 p-6 bg-bg-surface rounded-xl">
    <h3 className="text-xl font-bold text-text-primary">Knoppen</h3>

    {/* Primary Buttons */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Primary (Hoofd acties)</h4>
      <div className="flex flex-wrap gap-3">
        <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-subtle hover:shadow-gold">
          Opslaan
        </button>
        <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-subtle hover:shadow-gold disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Opslaan (Disabled)
        </button>
        <button className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg transition-all shadow-gold-glow">
          Opslaan (Premium)
        </button>
      </div>
    </div>

    {/* Secondary Buttons */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Secondary (Secundaire acties)</h4>
      <div className="flex flex-wrap gap-3">
        <button className="px-6 py-2.5 bg-bg-modal border border-border-default hover:border-border-strong text-text-primary font-medium rounded-lg transition-colors hover:bg-bg-hover">
          Annuleren
        </button>
        <button className="px-6 py-2.5 bg-bg-modal border-2 border-primary-500/30 hover:border-primary-500 text-primary-500 font-medium rounded-lg transition-colors hover:bg-primary-500/10">
          Details
        </button>
      </div>
    </div>

    {/* Action Buttons (Confirm/Reject) */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Action Buttons</h4>
      <div className="flex flex-wrap gap-3">
        <button className="px-6 py-2.5 bg-success-600 hover:bg-success-700 text-white font-medium rounded-lg transition-all shadow-subtle hover:shadow-strong">
          ✓ Bevestigen
        </button>
        <button className="px-6 py-2.5 bg-error-600 hover:bg-error-700 text-white font-medium rounded-lg transition-all shadow-subtle hover:shadow-strong">
          ✗ Afwijzen
        </button>
        <button className="px-6 py-2.5 bg-warning-600 hover:bg-warning-700 text-white font-medium rounded-lg transition-all shadow-subtle hover:shadow-strong">
          ⚠ Waarschuwing
        </button>
      </div>
    </div>

    {/* Icon Buttons */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Icon Buttons</h4>
      <div className="flex flex-wrap gap-3">
        <button className="p-2 text-info-400 hover:bg-info-500/10 rounded-lg transition-colors" title="Info">
          <Info className="w-5 h-5" />
        </button>
        <button className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Edit">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="p-2 text-error-400 hover:bg-error-500/10 rounded-lg transition-colors" title="Delete">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    {/* Button Sizes */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Sizes</h4>
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          Small
        </button>
        <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
          Medium (Default)
        </button>
        <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-lg font-medium rounded-lg transition-colors">
          Large
        </button>
      </div>
    </div>
  </div>
);

// ============================================================
// 2. MODALS
// ============================================================

export const ModalExample = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-modal backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-bg-modal border border-border-default rounded-2xl shadow-lifted animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-text-primary">Modal Titel</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-text-secondary">
            Modal content hier. Gebruik consistent padding en spacing.
          </p>
          
          {/* Example content */}
          <div className="p-4 bg-bg-surface rounded-lg border border-border-default">
            <p className="text-sm text-text-primary">
              Content blok binnen modal met bg-bg-surface
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-bg-surface border border-border-default hover:border-border-strong text-text-secondary hover:text-text-primary font-medium rounded-lg transition-colors"
          >
            Annuleren
          </button>
          <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-subtle hover:shadow-gold">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal met Gold Accent (voor belangrijke acties)
export const GoldAccentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-modal backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-bg-modal border-2 border-primary-500/30 rounded-2xl shadow-gold-glow">
        {/* Gold top border accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gold-gradient">
            Premium Modal
          </h2>
          <p className="mt-2 text-text-secondary">Voor speciale acties</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. INPUT FIELDS
// ============================================================

export const InputExamples = () => (
  <div className="space-y-6 p-6 bg-bg-surface rounded-xl">
    <h3 className="text-xl font-bold text-text-primary">Input Fields</h3>

    {/* Text Input */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Label <span className="text-error-400">*</span>
      </label>
      <input
        type="text"
        placeholder="Placeholder text"
        className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      <p className="text-xs text-text-muted">Helper text hier</p>
    </div>

    {/* Input met error */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Input met Error
      </label>
      <input
        type="text"
        className="w-full px-4 py-2.5 bg-bg-input border-2 border-error-500 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-error-500"
      />
      <p className="text-xs text-error-400 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Dit veld is verplicht
      </p>
    </div>

    {/* Input met success */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Input met Success
      </label>
      <input
        type="text"
        value="Valid input"
        readOnly
        className="w-full px-4 py-2.5 bg-bg-input border-2 border-success-500 rounded-lg text-text-primary focus:outline-none"
      />
      <p className="text-xs text-success-400 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Perfect!
      </p>
    </div>

    {/* Select Dropdown */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Dropdown
      </label>
      <select className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        <option>Optie 1</option>
        <option>Optie 2</option>
        <option>Optie 3</option>
      </select>
    </div>

    {/* Textarea */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Textarea
      </label>
      <textarea
        rows={4}
        placeholder="Notities..."
        className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
      />
    </div>

    {/* Checkbox */}
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 bg-bg-input border border-border-default rounded text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-surface"
        />
        <span className="text-sm text-text-primary">Checkbox label</span>
      </label>
    </div>

    {/* Radio Buttons */}
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">Radio Buttons</p>
      <div className="space-y-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="radio-example"
            className="w-4 h-4 bg-bg-input border border-border-default text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-surface"
          />
          <span className="text-sm text-text-primary">Optie A</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="radio-example"
            className="w-4 h-4 bg-bg-input border border-border-default text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-surface"
          />
          <span className="text-sm text-text-primary">Optie B</span>
        </label>
      </div>
    </div>

    {/* Toggle Switch */}
    <div className="space-y-2">
      <label className="flex items-center justify-between cursor-pointer p-4 bg-bg-modal rounded-lg border border-border-default hover:border-border-strong transition-colors">
        <div>
          <p className="text-sm font-medium text-text-primary">Toggle Setting</p>
          <p className="text-xs text-text-muted">Description text</p>
        </div>
        <div className="relative inline-block w-11 h-6">
          <input type="checkbox" className="peer sr-only" />
          <div className="w-11 h-6 bg-bg-input border border-border-default rounded-full peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-all"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-text-muted rounded-full peer-checked:translate-x-5 peer-checked:bg-white transition-transform"></div>
        </div>
      </label>
    </div>
  </div>
);

// ============================================================
// 4. BADGES & TAGS
// ============================================================

export const BadgeExamples = () => (
  <div className="space-y-6 p-6 bg-bg-surface rounded-xl">
    <h3 className="text-xl font-bold text-text-primary">Badges & Tags</h3>

    {/* Status Badges */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Status Badges</h4>
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-500/20 text-success-400 border border-success-500/30">
          ✓ Bevestigd
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning-500/20 text-warning-400 border border-warning-500/30">
          ⏳ Pending
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-error-500/20 text-error-400 border border-error-500/30">
          ✗ Afgewezen
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          📋 Wachtlijst
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-info-500/20 text-info-400 border border-info-500/30">
          ℹ Info
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-500/20 text-neutral-400 border border-neutral-500/30">
          Geannuleerd
        </span>
      </div>
    </div>

    {/* Count Badges */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Count Badges</h4>
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2">
          <span className="text-text-primary">Notificaties</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-error-500 text-white">
            5
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="text-text-primary">Nieuwe</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white">
            12
          </span>
        </div>
      </div>
    </div>

    {/* Premium Badge */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Premium Badges</h4>
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-gold">
          ⭐ Premium
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium border-2 border-primary-500/50 text-primary-400 bg-primary-500/10">
          🔧 Override Actief
        </span>
      </div>
    </div>

    {/* Removable Tags */}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary">Removable Tags</h4>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-bg-modal border border-border-default text-text-primary">
          Tag 1
          <button className="hover:text-error-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-bg-modal border border-border-default text-text-primary">
          Tag 2
          <button className="hover:text-error-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>
  </div>
);

// ============================================================
// 5. ALERTS & NOTIFICATIONS
// ============================================================

export const AlertExamples = () => (
  <div className="space-y-4 p-6 bg-bg-surface rounded-xl">
    <h3 className="text-xl font-bold text-text-primary">Alerts & Notifications</h3>

    {/* Success Alert */}
    <div className="p-4 bg-success-500/10 border border-success-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-success-400">Success!</h4>
          <p className="text-sm text-success-300 mt-1">
            De actie is succesvol uitgevoerd.
          </p>
        </div>
        <button className="text-success-400 hover:text-success-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Warning Alert */}
    <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-warning-400">Let op!</h4>
          <p className="text-sm text-warning-300 mt-1">
            Deze actie overschrijdt de capaciteit.
          </p>
        </div>
      </div>
    </div>

    {/* Error Alert */}
    <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-error-400">Fout opgetreden</h4>
          <p className="text-sm text-error-300 mt-1">
            Er is iets misgegaan bij het opslaan.
          </p>
        </div>
      </div>
    </div>

    {/* Info Alert */}
    <div className="p-4 bg-info-500/10 border border-info-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-info-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-info-400">Informatie</h4>
          <p className="text-sm text-info-300 mt-1">
            Er zijn nieuwe updates beschikbaar.
          </p>
        </div>
      </div>
    </div>

    {/* Toast Notification (positioned) */}
    <div className="relative">
      <p className="text-sm text-text-muted mb-2">Toast Notification (fixed position):</p>
      <div className="fixed bottom-4 right-4 max-w-sm p-4 bg-bg-elevated border border-border-strong rounded-xl shadow-lifted animate-slide-in">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-text-primary">Opgeslagen!</h4>
            <p className="text-sm text-text-secondary mt-1">
              De wijzigingen zijn opgeslagen.
            </p>
          </div>
          <button className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// 6. CARDS & CONTAINERS
// ============================================================

export const CardExamples = () => (
  <div className="space-y-6 p-6 bg-bg-surface rounded-xl">
    <h3 className="text-xl font-bold text-text-primary">Cards & Containers</h3>

    {/* Basic Card */}
    <div className="p-6 bg-bg-modal border border-border-default rounded-xl shadow-subtle">
      <h4 className="text-lg font-semibold text-text-primary">Basic Card</h4>
      <p className="text-sm text-text-secondary mt-2">
        Standard card met border en subtle shadow.
      </p>
    </div>

    {/* Elevated Card */}
    <div className="p-6 bg-bg-elevated border border-border-default rounded-xl shadow-strong hover:shadow-lifted transition-shadow">
      <h4 className="text-lg font-semibold text-text-primary">Elevated Card</h4>
      <p className="text-sm text-text-secondary mt-2">
        Card met strong shadow en hover effect.
      </p>
    </div>

    {/* Gold Accent Card */}
    <div className="p-6 bg-gradient-to-br from-bg-modal to-bg-surface border-2 border-primary-500/30 rounded-xl shadow-gold">
      <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gold-gradient">
        Premium Card
      </h4>
      <p className="text-sm text-text-secondary mt-2">
        Card met gold accent voor speciale content.
      </p>
    </div>

    {/* Stat Card */}
    <div className="p-6 bg-bg-modal border border-border-default rounded-xl hover:border-primary-500/30 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Totaal Reserveringen</p>
          <p className="text-3xl font-bold text-text-primary mt-1">234</p>
        </div>
        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// 7. CONSISTENCY CHECKLIST
// ============================================================

/*
  ✅ CONSISTENCY CHECKLIST:

  KLEUREN:
  - Primary actions: bg-primary-600 hover:bg-primary-700
  - Success: bg-success-600, text-success-400
  - Warning: bg-warning-600, text-warning-400
  - Error: bg-error-600, text-error-400
  - Backgrounds: bg-base (#0A0A0A), bg-elevated (#111111), bg-surface (#1A1918), bg-modal (#1F1E1D)
  - Text: text-primary (#F7F5F4), text-secondary (#E6E4E3), text-muted (#C9C6C5)
  - Borders: border-subtle, border-default, border-strong, border-focus (primary-500)

  SPACING:
  - Padding in containers: p-4, p-6
  - Gap tussen elementen: gap-2, gap-3, gap-4
  - Margins: mt-2, mb-4, etc.

  RADIUS:
  - Small elements (badges, buttons): rounded-lg (0.5rem)
  - Large containers (cards, modals): rounded-xl (0.75rem) of rounded-2xl (1rem)
  - Circular: rounded-full

  SHADOWS:
  - Subtle: shadow-subtle (standaard voor cards)
  - Strong: shadow-strong (elevated states)
  - Gold: shadow-gold, shadow-gold-glow (premium/accent)
  - Lifted: shadow-lifted (modals)

  TRANSITIONS:
  - Kleuren: transition-colors
  - Alles: transition-all
  - Durations: default (150ms), gebruik duration-300 voor complexe animaties

  FONTS:
  - Sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
  - Weights: font-medium (buttons/labels), font-semibold (headings), font-bold (titles)

  STATES:
  - Hover: hover:bg-*, hover:border-*, hover:shadow-*
  - Focus: focus:outline-none focus:ring-2 focus:ring-primary-500
  - Disabled: disabled:opacity-50 disabled:cursor-not-allowed
  - Active: active:scale-95 (voor buttons)
*/
