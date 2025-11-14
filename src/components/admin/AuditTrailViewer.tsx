/**
 * 📝 AUDIT TRAIL VIEWER
 * 
 * Timeline view van alle audit entries met filtering en export
 */

import { useState, useMemo } from 'react';
import {
  Activity,
  Filter,
  Download,
  Search,
  Clock,
  User,
  ChevronRight,
  Undo,
  FileText,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Mail,
  Tag,
  DollarSign
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuditStore, type AuditEntry, type AuditAction, type EntityType } from '../../store/auditStore';

interface AuditTrailViewerProps {
  entityType?: EntityType;
  entityId?: string;
  onClose?: () => void;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  entityType,
  entityId,
  onClose
}) => {
  const { entries, filters, setFilters, clearFilters, exportToJSON, exportToCSV } = useAuditStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  
  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    // Apply entity filter if provided
    if (entityType && entityId) {
      filtered = filtered.filter(
        e => e.entityType === entityType && e.entityId === entityId
      );
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const searchableText = [
          e.userName,
          e.action,
          e.entityType,
          e.entityId,
          e.entityName || '',
          JSON.stringify(e.changes || {}),
          JSON.stringify(e.metadata || {})
        ].join(' ').toLowerCase();
        return searchableText.includes(query);
      });
    }
    
    // Apply store filters
    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }
    if (filters.action) {
      filtered = filtered.filter(e => e.action === filters.action);
    }
    if (filters.entityType) {
      filtered = filtered.filter(e => e.entityType === filters.entityType);
    }
    if (!filters.showUndone) {
      filtered = filtered.filter(e => !e.isUndone);
    }
    
    return filtered;
  }, [entries, searchQuery, filters, entityType, entityId]);
  
  // Group by date
  const entriesByDate = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);
  
  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportCSV = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const actionConfig: Record<AuditAction, { icon: any; color: string; label: string }> = {
    create: { icon: Plus, color: 'text-green-600 dark:text-green-400', label: 'Aangemaakt' },
    update: { icon: Edit, color: 'text-blue-600 dark:text-blue-400', label: 'Bijgewerkt' },
    delete: { icon: Trash2, color: 'text-red-600 dark:text-red-400', label: 'Verwijderd' },
    confirm: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', label: 'Bevestigd' },
    reject: { icon: X, color: 'text-red-600 dark:text-red-400', label: 'Afgewezen' },
    cancel: { icon: X, color: 'text-red-600 dark:text-red-400', label: 'Geannuleerd' },
    payment_add: { icon: DollarSign, color: 'text-green-600 dark:text-green-400', label: 'Betaling toegevoegd' },
    payment_refund: { icon: DollarSign, color: 'text-orange-600 dark:text-orange-400', label: 'Restitutie' },
    email_send: { icon: Mail, color: 'text-blue-600 dark:text-blue-400', label: 'Email verstuurd' },
    tag_add: { icon: Tag, color: 'text-purple-600 dark:text-purple-400', label: 'Tag toegevoegd' },
    tag_remove: { icon: Tag, color: 'text-orange-600 dark:text-orange-400', label: 'Tag verwijderd' },
    bulk_action: { icon: Activity, color: 'text-purple-600 dark:text-purple-400', label: 'Bulk actie' },
    export: { icon: Download, color: 'text-blue-600 dark:text-blue-400', label: 'Geëxporteerd' },
    import: { icon: FileText, color: 'text-blue-600 dark:text-blue-400', label: 'Geïmporteerd' },
    setting_change: { icon: Edit, color: 'text-orange-600 dark:text-orange-400', label: 'Instelling gewijzigd' }
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Audit Trail
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                {entityType && entityId && ' voor dit item'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Export als JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Export als CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Zoek in audit log..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {Object.keys(filters).length > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
              Geen audit entries gevonden
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Pas filters aan of probeer een andere zoekopdracht
            </p>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(entriesByDate).map(([date, dateEntries]) => (
              <div key={date} className="mb-8">
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {date}
                  </h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>
                
                {/* Timeline */}
                <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  {dateEntries.map((entry, index) => {
                    const config = actionConfig[entry.action];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          'relative pl-8 group cursor-pointer',
                          entry.isUndone && 'opacity-50'
                        )}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {/* Timeline dot */}
                        <div className={cn(
                          'absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900',
                          entry.isUndone
                            ? 'bg-slate-300 dark:bg-slate-700'
                            : 'bg-white dark:bg-slate-800 group-hover:scale-125 transition-transform'
                        )}>
                          <Icon className={cn('w-3 h-3', config.color)} />
                        </div>
                        
                        {/* Content */}
                        <div className={cn(
                          'p-4 rounded-xl border-2 transition-all duration-200',
                          entry.isUndone
                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-lg'
                        )}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Action & User */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {config.label}
                                </span>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{entry.userName}</span>
                                </div>
                                {entry.isBulkOperation && (
                                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded">
                                    BULK ({entry.affectedCount})
                                  </span>
                                )}
                                {entry.isUndone && (
                                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded">
                                    ONGEDAAN GEMAAKT
                                  </span>
                                )}
                              </div>
                              
                              {/* Entity info */}
                              {entry.entityName && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  <span className="capitalize">{entry.entityType}</span>: {entry.entityName}
                                </p>
                              )}
                              
                              {/* Changes */}
                              {entry.changes && entry.changes.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {entry.changes.map((change, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                                        {change.field}:
                                      </span>
                                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-mono">
                                        {String(change.before)}
                                      </span>
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-mono">
                                        {String(change.after)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Metadata */}
                              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                <details className="mt-2 text-xs">
                                  <summary className="cursor-pointer text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                    Details
                                  </summary>
                                  <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                            
                            {/* Timestamp */}
                            <div className="flex-shrink-0 text-right">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {new Date(entry.timestamp).toLocaleTimeString('nl-NL', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              
                              {entry.isUndoable && !entry.isUndone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement undo
                                    console.log('Undo', entry.id);
                                  }}
                                  className="mt-2 flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                                  title="Maak ongedaan"
                                >
                                  <Undo className="w-3 h-3" />
                                  Undo
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Audit Entry Details
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(selectedEntry, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
