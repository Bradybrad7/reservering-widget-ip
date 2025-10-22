import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Users, X, Loader } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, formatCurrency } from '../../utils';

interface SearchResult {
  id: string;
  type: 'event' | 'reservation' | 'customer';
  title: string;
  subtitle: string;
  metadata?: string;
  url?: string;
  data: any;
}

interface GlobalSearchProps {
  onNavigate?: (section: string, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { events, reservations, customers } = useAdminStore();

  // Handle keyboard shortcuts (Cmd+K or Ctrl+K to open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }

      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelectResult(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    const searchTimer = setTimeout(() => {
      performSearch(query);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, events, reservations, customers]);

  const performSearch = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search Events
    events.forEach(event => {
      const eventDate = formatDate(event.date);
      const show = event.showId || 'Show';
      
      if (
        eventDate.toLowerCase().includes(lowerQuery) ||
        show.toLowerCase().includes(lowerQuery) ||
        event.type.toLowerCase().includes(lowerQuery) ||
        event.id.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: event.id,
          type: 'event',
          title: `${show} - ${eventDate}`,
          subtitle: `${event.type} • ${event.capacity} personen capaciteit`,
          metadata: `${event.remainingCapacity || 0} beschikbaar`,
          data: event
        });
      }
    });

    // Search Reservations
    reservations.forEach(reservation => {
      if (
        reservation.companyName.toLowerCase().includes(lowerQuery) ||
        reservation.contactPerson.toLowerCase().includes(lowerQuery) ||
        reservation.email.toLowerCase().includes(lowerQuery) ||
        reservation.phone?.toLowerCase().includes(lowerQuery) ||
        reservation.id.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: reservation.id,
          type: 'reservation',
          title: reservation.companyName,
          subtitle: `${reservation.contactPerson} • ${formatDate(reservation.eventDate)}`,
          metadata: `${reservation.numberOfPersons} personen • ${formatCurrency(reservation.totalPrice)}`,
          data: reservation
        });
      }
    });

    // Search Customers
    if (customers) {
      customers.forEach(customer => {
        if (
          customer.email.toLowerCase().includes(lowerQuery) ||
          customer.companyName?.toLowerCase().includes(lowerQuery)
        ) {
          const bookingsCount = reservations.filter(r => r.email === customer.email).length;
          searchResults.push({
            id: customer.email,
            type: 'customer',
            title: customer.companyName || customer.contactPerson,
            subtitle: customer.email,
            metadata: `${bookingsCount} boekingen`,
            data: customer
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  };

  const handleSelectResult = (result: SearchResult) => {
    if (onNavigate) {
      if (result.type === 'event') {
        onNavigate('events', result.id);
      } else if (result.type === 'reservation') {
        onNavigate('reservations', result.id);
      } else if (result.type === 'customer') {
        onNavigate('customers', result.id);
      }
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'reservation':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'customer':
        return <Users className="w-5 h-5 text-purple-400" />;
      default:
        return <Search className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getResultBadge = (type: string) => {
    switch (type) {
      case 'event':
        return <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Event</span>;
      case 'reservation':
        return <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Reservering</span>;
      case 'customer':
        return <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">Klant</span>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 w-full max-w-md"
      >
        <Search className="w-4 h-4 text-neutral-400" />
        <span className="text-sm text-neutral-400 flex-1 text-left">Zoek events, reserveringen, klanten...</span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-neutral-900 rounded border border-neutral-700 text-neutral-500">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm">
          <div ref={searchRef} className="w-full max-w-2xl mx-4">
            <div className="bg-neutral-800 rounded-lg shadow-2xl border border-neutral-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-neutral-700">
                <Search className="w-5 h-5 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Typ om te zoeken..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500"
                  autoFocus
                />
                {isSearching && <Loader className="w-5 h-5 text-gold-400 animate-spin" />}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                    setResults([]);
                  }}
                  className="p-1 hover:bg-neutral-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Search Results */}
              {results.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex items-center gap-4 p-4 border-b border-neutral-700/50 transition-colors text-left ${
                        index === selectedIndex
                          ? 'bg-gold-500/10 border-l-4 border-l-gold-500'
                          : 'hover:bg-neutral-700/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium truncate">{result.title}</span>
                          {getResultBadge(result.type)}
                        </div>
                        <div className="text-sm text-neutral-400 truncate">{result.subtitle}</div>
                        {result.metadata && (
                          <div className="text-xs text-neutral-500 mt-1">{result.metadata}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Geen resultaten gevonden voor "{query}"</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Typ om te beginnen met zoeken</p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500">
                    <span>• Events</span>
                    <span>• Reserveringen</span>
                    <span>• Klanten</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-3 bg-neutral-900 border-t border-neutral-700 flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700">↑</kbd>
                    <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700">↓</kbd>
                    navigeren
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700">↵</kbd>
                    selecteren
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-neutral-800 rounded border border-neutral-700">esc</kbd>
                  sluiten
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
