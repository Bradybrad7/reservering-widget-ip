/**
 * CommandPalette - Het centrale zenuwstelsel van de admin
 * 
 * Een modal die opent met Cmd+K / Ctrl+K en fungeert als:
 * 1. Global Search (zoeken door klanten, reserveringen, events)
 * 2. Navigatie (direct naar items of secties)
 * 3. Command Runner (snelacties zoals "Nieuw Event", "Ga naar Check-in")
 * 
 * Geïnspireerd door Slack's Command Palette, VS Code Command Palette, Raycast
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Calendar,
  Users,
  ListChecks,
  Plus,
  ArrowRight,
  Clock,
  CreditCard,
  UserCheck,
  X,
  Loader,
  Command,
  Hash,
  Mail,
  Building2,
  Package,
  DollarSign
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useCustomersStore } from '../../store/customersStore';
import { useAdminStore } from '../../store/adminStore';
import { useConfigStore } from '../../store/configStore';
import { formatDate, formatCurrency, cn } from '../../utils';

interface SearchResult {
  id: string;
  type: 'event' | 'reservation' | 'customer' | 'command';
  title: string;
  subtitle: string;
  metadata?: string;
  icon: React.ElementType;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();
  const { customers } = useCustomersStore();
  const { setActiveSection, setSelectedItemId } = useAdminStore();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // ============================================================================
  // STATIC COMMANDS (Snelacties)
  // ============================================================================

  const getStaticCommands = (): SearchResult[] => {
    return [
      {
        id: 'cmd-new-event',
        type: 'command',
        title: 'Nieuw Event',
        subtitle: 'Maak een nieuw evenement aan',
        icon: Plus,
        category: 'Acties',
        action: () => {
          setActiveSection('events');
          onClose();
        }
      },
      {
        id: 'cmd-new-reservation',
        type: 'command',
        title: 'Nieuwe Reservering',
        subtitle: 'Quick booking aanmaken',
        icon: Plus,
        category: 'Acties',
        action: () => {
          setActiveSection('reservations');
          onClose();
        }
      },
      {
        id: 'cmd-goto-events',
        type: 'command',
        title: 'Ga naar Evenementen',
        subtitle: 'Open event management',
        icon: Calendar,
        category: 'Navigatie',
        action: () => {
          setActiveSection('events');
          onClose();
        }
      },
      {
        id: 'cmd-goto-reservations',
        type: 'command',
        title: 'Ga naar Reserveringen',
        subtitle: 'Bekijk alle boekingen',
        icon: ListChecks,
        category: 'Navigatie',
        action: () => {
          setActiveSection('reservations');
          onClose();
        }
      },
      {
        id: 'cmd-goto-checkin',
        type: 'command',
        title: 'Ga naar Check-in',
        subtitle: 'Open de check-in portal',
        icon: UserCheck,
        category: 'Navigatie',
        action: () => {
          setActiveSection('checkin');
          onClose();
        }
      },
      {
        id: 'cmd-goto-payments',
        type: 'command',
        title: 'Ga naar Betalingen',
        subtitle: 'Bekijk openstaande betalingen',
        icon: DollarSign,
        category: 'Navigatie',
        action: () => {
          setActiveSection('payments');
          onClose();
        }
      },
      {
        id: 'cmd-goto-dashboard',
        type: 'command',
        title: 'Ga naar Dashboard',
        subtitle: 'Terug naar overzicht',
        icon: Clock,
        category: 'Navigatie',
        action: () => {
          setActiveSection('dashboard');
          onClose();
        }
      },
      {
        id: 'cmd-goto-waitlist',
        type: 'command',
        title: 'Ga naar Wachtlijst',
        subtitle: 'Beheer wachtlijst aanmeldingen',
        icon: Clock,
        category: 'Navigatie',
        action: () => {
          setActiveSection('waitlist');
          onClose();
        }
      },
      {
        id: 'cmd-goto-customers',
        type: 'command',
        title: 'Ga naar Klanten',
        subtitle: 'Open CRM module',
        icon: Users,
        category: 'Navigatie',
        action: () => {
          setActiveSection('customers');
          onClose();
        }
      },
      {
        id: 'cmd-goto-products',
        type: 'command',
        title: 'Ga naar Producten',
        subtitle: 'Beheer arrangementen & prijzen',
        icon: Package,
        category: 'Navigatie',
        action: () => {
          setActiveSection('products');
          onClose();
        }
      }
    ];
  };

  // ============================================================================
  // SEARCH LOGIC
  // ============================================================================

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      // Show static commands when no query
      return getStaticCommands();
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search EVENTS
    const matchingEvents = events
      .filter(event => {
        const searchStr = `${event.type} ${formatDate(event.date)} ${event.id}`.toLowerCase();
        return searchStr.includes(lowerQuery);
      })
      .slice(0, 5)
      .map(event => ({
        id: event.id,
        type: 'event' as const,
        title: `${event.type} • ${formatDate(event.date)}`,
        subtitle: `${event.doorsOpen} - ${event.endsAt}`,
        metadata: `${event.capacity} pers • ID: ${event.id.slice(0, 8)}`,
        icon: Calendar,
        category: 'Evenementen',
        action: () => {
          setActiveSection('events');
          setSelectedItemId(event.id);
          onClose();
        }
      }));

    // Search RESERVATIONS
    const matchingReservations = reservations
      .filter(res => {
        const searchStr = `${res.id} ${res.companyName} ${res.contactPerson} ${res.email}`.toLowerCase();
        return searchStr.includes(lowerQuery);
      })
      .slice(0, 5)
      .map(res => ({
        id: res.id,
        type: 'reservation' as const,
        title: `#${res.id.slice(0, 8)}`,
        subtitle: res.companyName || res.contactPerson,
        metadata: `${res.numberOfPersons} pers • ${res.status}`,
        icon: ListChecks,
        category: 'Reserveringen',
        action: () => {
          setActiveSection('reservations');
          setSelectedItemId(res.id);
          onClose();
        }
      }));

    // Search CUSTOMERS
    const matchingCustomers = customers
      .filter(customer => {
        const searchStr = `${customer.companyName} ${customer.contactPerson} ${customer.email}`.toLowerCase();
        return searchStr.includes(lowerQuery);
      })
      .slice(0, 5)
      .map(customer => ({
        id: customer.email,
        type: 'customer' as const,
        title: customer.companyName,
        subtitle: customer.contactPerson,
        metadata: `${customer.totalBookings} boekingen • ${formatCurrency(customer.totalSpent)}`,
        icon: Building2,
        category: 'Klanten',
        action: () => {
          setActiveSection('customers');
          setSelectedItemId(customer.email);
          onClose();
        }
      }));

    allResults.push(...matchingEvents, ...matchingReservations, ...matchingCustomers);

    // Add relevant commands based on query
    const commands = getStaticCommands().filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.subtitle.toLowerCase().includes(lowerQuery)
    );
    allResults.push(...commands);

    setIsSearching(false);
    return allResults;
  }, [query, events, reservations, customers, setActiveSection, setSelectedItemId, onClose]);

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
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
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && isOpen) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isOpen]);

  // ============================================================================
  // GROUP RESULTS BY CATEGORY
  // ============================================================================

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      const category = result.category || 'Resultaten';
      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
    });
    return groups;
  }, [results]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col overflow-hidden animate-slide-down"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek events, reserveringen, klanten of voer een commando uit..."
              className="flex-1 text-base outline-none placeholder-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded px-2 py-1">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-gold-500 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {query ? 'Geen resultaten gevonden' : 'Begin met typen om te zoeken...'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    {/* Category Header */}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {category}
                    </div>

                    {/* Category Items */}
                    {categoryResults.map((result, idx) => {
                      const globalIdx = results.indexOf(result);
                      const isSelected = globalIdx === selectedIndex;
                      const Icon = result.icon;

                      return (
                        <button
                          key={result.id}
                          onClick={result.action}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left',
                            isSelected && 'bg-gold-50 border-l-2 border-gold-500'
                          )}
                        >
                          {/* Icon */}
                          <div className={cn(
                            'p-2 rounded-lg flex-shrink-0',
                            result.type === 'command' ? 'bg-gold-100' : 'bg-gray-100'
                          )}>
                            <Icon className={cn(
                              'w-4 h-4',
                              result.type === 'command' ? 'text-gold-600' : 'text-gray-600'
                            )} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                            {result.metadata && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {result.metadata}
                              </div>
                            )}
                          </div>

                          {/* Arrow indicator */}
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-gold-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                navigeer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                selecteer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                sluit
              </span>
            </div>
            <span>{results.length} resultaten</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
