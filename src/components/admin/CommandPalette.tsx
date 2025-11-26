/**
 * ⚡ COMMAND PALETTE - Power User Interface
 * 
 * Geïnspireerd door VS Code, Raycast, en Linear
 * 
 * FEATURES:
 * - Ctrl+K / Cmd+K om te openen
 * - Fuzzy search over alle acties, reserveringen, klanten, events
 * - Keyboard-first navigation (↑↓ voor navigeren, Enter voor selecteren)
 * - Recent items history
 * - Contextual actions afhankelijk van huidige view
 * - Quick calculator (typ "120*15" voor berekeningen)
 * 
 * FILOSOFIE:
 * - Snelheid: elk resultaat in <50ms
 * - Voorspelbaar: consistente shortcuts en gedrag
 * - Discoverable: toon hints en shortcuts in resultaten
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  List,
  Plus,
  Mail,
  Download,
  Upload,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Hash,
  TrendingUp,
  Filter,
  Archive,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Command,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils';
import { useOperationsStore } from '../../store/operationsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useCustomersStore } from '../../store/customersStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useAdminStore } from '../../store/adminStore';
import type { Reservation, AdminEvent, CustomerProfile, WaitlistEntry } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

type CommandCategory = 
  | 'action' 
  | 'navigation' 
  | 'reservation' 
  | 'event' 
  | 'customer' 
  | 'recent'
  | 'calculator';

interface CommandItem {
  id: string;
  category: CommandCategory;
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'yellow' | 'blue' | 'purple';
  action: () => void;
  keywords?: string[]; // Voor betere fuzzy search
  score?: number; // Voor sorting
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// FUZZY SEARCH HELPER
// ============================================================================

const fuzzyMatch = (pattern: string, text: string): number => {
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  
  let score = 0;
  let patternIdx = 0;
  let textIdx = 0;
  let consecutiveMatch = 0;
  
  while (patternIdx < pattern.length && textIdx < text.length) {
    if (pattern[patternIdx] === text[textIdx]) {
      score += 1 + consecutiveMatch * 5; // Bonus voor consecutive matches
      consecutiveMatch++;
      patternIdx++;
    } else {
      consecutiveMatch = 0;
    }
    textIdx++;
  }
  
  // Als niet alle karakters gematched zijn, return 0
  if (patternIdx !== pattern.length) return 0;
  
  // Bonus als match aan begin van woord
  if (text.startsWith(pattern)) score += 10;
  
  return score;
};

// ============================================================================
// RECENT ITEMS STORAGE
// ============================================================================

const RECENT_ITEMS_KEY = 'commandPalette_recentItems';
const MAX_RECENT_ITEMS = 10;

const getRecentItems = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addRecentItem = (itemId: string) => {
  const recent = getRecentItems();
  const updated = [itemId, ...recent.filter(id => id !== itemId)].slice(0, MAX_RECENT_ITEMS);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // Stores
  const { setActiveTab } = useOperationsStore();
  const { setActiveSection } = useAdminStore();
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { customers } = useCustomersStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  
  // ========================================================================
  // STATIC COMMANDS (Actions & Navigation)
  // ========================================================================
  
  const staticCommands = useMemo((): CommandItem[] => [
    // Navigation Commands
    {
      id: 'nav_events',
      category: 'navigation',
      label: 'Ga naar Evenementen',
      icon: Calendar,
      shortcut: 'Alt+1',
      action: () => {
        setActiveTab('events');
        onClose();
      },
      keywords: ['events', 'evenementen', 'shows', 'voorstellingen']
    },
    {
      id: 'nav_reservations',
      category: 'navigation',
      label: 'Ga naar Reserveringen',
      icon: List,
      shortcut: 'Alt+2',
      action: () => {
        setActiveTab('reservations');
        onClose();
      },
      keywords: ['reserveringen', 'boekingen', 'bookings']
    },
    {
      id: 'nav_waitlist',
      category: 'navigation',
      label: 'Ga naar Wachtlijst',
      icon: Clock,
      shortcut: 'Alt+3',
      action: () => {
        setActiveTab('waitlist');
        onClose();
      },
      keywords: ['wachtlijst', 'waiting', 'queue']
    },
    {
      id: 'nav_customers',
      category: 'navigation',
      label: 'Ga naar Klanten',
      icon: Users,
      shortcut: 'Alt+4',
      action: () => {
        setActiveTab('customers');
        onClose();
      },
      keywords: ['klanten', 'customers', 'crm', 'contacts']
    },
    {
      id: 'nav_payments',
      category: 'navigation',
      label: 'Ga naar Betalingen',
      icon: DollarSign,
      shortcut: 'Alt+5',
      action: () => {
        setActiveTab('payments');
        onClose();
      },
      keywords: ['betalingen', 'payments', 'facturen', 'invoices']
    },
    
    // Quick Actions
    {
      id: 'action_new_event',
      category: 'action',
      label: 'Nieuw Evenement aanmaken',
      icon: Plus,
      action: () => {
        setActiveTab('events');
        onClose();
        // Navigate to events tab - user can create from there
      },
      keywords: ['nieuw', 'new', 'create', 'event', 'show']
    },
    {
      id: 'action_new_reservation',
      category: 'action',
      label: 'Nieuwe Reservering aanmaken',
      icon: Plus,
      action: () => {
        setActiveTab('reservations');
        onClose();
        // Navigate to reservations tab - user can create from there
      },
      keywords: ['nieuw', 'new', 'create', 'reservering', 'booking']
    },
    {
      id: 'action_export_reservations',
      category: 'action',
      label: 'Exporteer Reserveringen naar Excel',
      icon: Download,
      action: () => {
        setActiveTab('reservations');
        onClose();
        // Navigate to reservations - export available in tab
      },
      keywords: ['export', 'download', 'excel', 'csv']
    },
    {
      id: 'action_import_reservations',
      category: 'action',
      label: 'Importeer Reserveringen',
      icon: Upload,
      action: () => {
        setActiveTab('reservations');
        onClose();
        // Navigate to reservations - import available in tab
      },
      keywords: ['import', 'upload', 'bulk', 'csv']
    },
    {
      id: 'action_settings',
      category: 'action',
      label: 'Open Instellingen',
      icon: Settings,
      action: () => {
        // Navigate to main config section
        setActiveSection('config');
        onClose();
      },
      keywords: ['settings', 'instellingen', 'config', 'configuratie']
    },
  ], [setActiveTab, onClose]);
  
  // ========================================================================
  // DYNAMIC COMMANDS (Data Items)
  // ========================================================================
  
  const dynamicCommands = useMemo((): CommandItem[] => {
    const commands: CommandItem[] = [];
    
    // Reserveringen
    reservations.slice(0, 20).forEach(reservation => {
      const statusColors = {
        'confirmed': 'green' as const,
        'pending': 'yellow' as const,
        'cancelled': 'red' as const,
        'waitlist': 'blue' as const,
        'request': 'purple' as const
      };
      
      const personen = reservation.pricingSnapshot?.numberOfPersons || 0;
      
      commands.push({
        id: `reservation_${reservation.id}`,
        category: 'reservation',
        label: `${reservation.contactPerson} - ${reservation.companyName || 'Particulier'}`,
        subtitle: `${personen} personen • ${new Date(reservation.eventDate).toLocaleDateString('nl-NL')}`,
        icon: List,
        badge: reservation.status,
        badgeColor: statusColors[reservation.status as keyof typeof statusColors],
        action: () => {
          setActiveTab('reservations');
          addRecentItem(`reservation_${reservation.id}`);
          onClose();
          // Navigate to reservations - reservation will be searchable there
        },
        keywords: [
          reservation.contactPerson,
          reservation.companyName || '',
          reservation.email,
          reservation.phone || '',
          reservation.status
        ]
      });
    });
    
    // Events
    events.filter(e => e.isActive).slice(0, 20).forEach(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const eventName = `${event.type} ${eventDate.toLocaleDateString('nl-NL')}`;
      
      commands.push({
        id: `event_${event.id}`,
        category: 'event',
        label: eventName,
        subtitle: `${event.startsAt} • ${event.capacity} plaatsen • ${event.showId}`,
        icon: Calendar,
        badge: event.type,
        badgeColor: 'blue',
        action: () => {
          setActiveTab('events');
          addRecentItem(`event_${event.id}`);
          onClose();
          // Navigate to events - event will be visible in list
        },
        keywords: [event.type, event.showId, event.notes || '']
      });
    });
    
    // Customers
    customers.slice(0, 20).forEach(customer => {
      const customerId = customer.email; // Email is the unique identifier
      const customerName = customer.contactPerson || customer.companyName || 'Unknown';
      
      commands.push({
        id: `customer_${customerId}`,
        category: 'customer',
        label: customerName,
        subtitle: customer.email,
        icon: Users,
        action: () => {
          setActiveTab('customers');
          addRecentItem(`customer_${customerId}`);
          onClose();
          // Navigate to customers - customer will be searchable there
        },
        keywords: [customerName, customer.email, customer.phone || '', customer.companyName]
      });
    });
    
    return commands;
  }, [reservations, events, customers, setActiveTab, onClose]);
  
  // ========================================================================
  // CALCULATOR
  // ========================================================================
  
  const calculatorResult = useMemo((): CommandItem | null => {
    // Check if query looks like a calculation (contains numbers and operators)
    if (/^[\d\s+\-*/.()]+$/.test(query)) {
      try {
        // Safe eval alternative using Function
        const result = Function(`'use strict'; return (${query})`)();
        if (typeof result === 'number' && !isNaN(result)) {
          return {
            id: 'calculator',
            category: 'calculator',
            label: `= ${result.toLocaleString('nl-NL')}`,
            subtitle: 'Druk Enter om te kopiëren',
            icon: Hash,
            action: () => {
              navigator.clipboard.writeText(result.toString());
              onClose();
            }
          };
        }
      } catch {
        // Invalid calculation, ignore
      }
    }
    return null;
  }, [query, onClose]);
  
  // ========================================================================
  // FILTERED & SORTED COMMANDS
  // ========================================================================
  
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Toon recent items en populaire acties
      const recentIds = getRecentItems();
      const recentCommands = recentIds
        .map(id => [...staticCommands, ...dynamicCommands].find(cmd => cmd.id === id))
        .filter(Boolean) as CommandItem[];
      
      return [
        ...recentCommands.slice(0, 5),
        ...staticCommands.slice(0, 10)
      ];
    }
    
    // Fuzzy search op alle commands
    const allCommands = [...staticCommands, ...dynamicCommands];
    const results = allCommands
      .map(cmd => {
        const labelScore = fuzzyMatch(query, cmd.label);
        const subtitleScore = cmd.subtitle ? fuzzyMatch(query, cmd.subtitle) * 0.8 : 0;
        const keywordsScore = cmd.keywords 
          ? Math.max(...cmd.keywords.map(kw => fuzzyMatch(query, kw))) * 0.6
          : 0;
        
        const totalScore = Math.max(labelScore, subtitleScore, keywordsScore);
        
        return { ...cmd, score: totalScore };
      })
      .filter(cmd => cmd.score && cmd.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20);
    
    // Add calculator result if available
    if (calculatorResult) {
      return [calculatorResult, ...results];
    }
    
    return results;
  }, [query, staticCommands, dynamicCommands, calculatorResult]);
  
  // ========================================================================
  // KEYBOARD NAVIGATION
  // ========================================================================
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);
  
  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);
  
  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);
  
  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  if (!isOpen) return null;
  
  const categoryLabels = {
    action: '⚡ Acties',
    navigation: '🧭 Navigatie',
    reservation: '📋 Reserveringen',
    event: '📅 Evenementen',
    customer: '👥 Klanten',
    recent: '🕐 Recent',
    calculator: '🔢 Calculator'
  };
  
  const badgeColors = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  };
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek naar acties, reserveringen, klanten, events... of typ een berekening"
            className="flex-1 bg-transparent text-lg text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-600 dark:text-slate-400">
            Esc
          </kbd>
        </div>
        
        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                Geen resultaten gevonden
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Probeer een andere zoekterm
              </p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  className={cn(
                    'w-full flex items-center gap-4 px-6 py-4 transition-colors border-l-4',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-semibold truncate',
                        isSelected
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      )}>
                        {cmd.label}
                      </p>
                      {cmd.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-bold rounded uppercase',
                          badgeColors[cmd.badgeColor || 'blue']
                        )}>
                          {cmd.badge}
                        </span>
                      )}
                    </div>
                    {cmd.subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-500 truncate mt-0.5">
                        {cmd.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {/* Shortcut / Arrow */}
                  {cmd.shortcut ? (
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-600 dark:text-slate-400">
                      {cmd.shortcut}
                    </kbd>
                  ) : (
                    <ArrowRight className={cn(
                      'w-4 h-4 flex-shrink-0',
                      isSelected ? 'text-blue-500' : 'text-slate-300 dark:text-slate-700'
                    )} />
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono">↑↓</kbd>
              <span>navigeer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono">↵</kbd>
              <span>selecteer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono">Esc</kbd>
              <span>sluit</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-600">
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
