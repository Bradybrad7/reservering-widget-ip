import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Calendar,
  Filter,
  Download,
  Trash2,
  FileText,
  Database,
  ShoppingCart,
  Settings,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  UserCheck
} from 'lucide-react';
import type { AuditLogEntry } from '../../types';
import { auditLogger } from '../../services/auditLogger';
import { formatDate, cn } from '../../utils';

/**
 * Audit Log Viewer
 * 
 * Displays and filters system audit logs for:
 * - Accountability tracking
 * - Troubleshooting
 * - Compliance reporting
 * - Activity monitoring
 */
const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditLogEntry['action'] | 'all'>('all');
  const [entityFilter, setEntityFilter] = useState<AuditLogEntry['entityType'] | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, actionFilter, entityFilter, dateFrom, dateTo]);

  const loadLogs = () => {
    const allLogs = auditLogger.getLogs();
    setLogs(allLogs);
  };

  const applyFilters = () => {
    const filtered = auditLogger.getFilteredLogs({
      action: actionFilter !== 'all' ? actionFilter : undefined,
      entityType: entityFilter !== 'all' ? entityFilter : undefined,
      searchTerm: searchTerm || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    });
    setFilteredLogs(filtered);
  };

  const handleExportLogs = () => {
    const json = auditLogger.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    auditLogger.clearLogs();
    loadLogs();
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'update':
        return <Edit className="w-5 h-5 text-blue-400" />;
      case 'delete':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'status_change':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'check_in':
        return <UserCheck className="w-5 h-5 text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEntityIcon = (entityType: AuditLogEntry['entityType']) => {
    switch (entityType) {
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'reservation':
        return <User className="w-4 h-4" />;
      case 'customer':
        return <User className="w-4 h-4" />;
      case 'config':
        return <Settings className="w-4 h-4" />;
      case 'voucher':
        return <ShoppingCart className="w-4 h-4" />;
      case 'merchandise':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create':
        return 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20';
      case 'update':
        return 'from-blue-500/10 to-blue-600/5 border-blue-500/20';
      case 'delete':
        return 'from-red-500/10 to-red-600/5 border-red-500/20';
      case 'status_change':
        return 'from-amber-500/10 to-amber-600/5 border-amber-500/20';
      case 'check_in':
        return 'from-purple-500/10 to-purple-600/5 border-purple-500/20';
      default:
        return 'from-slate-500/10 to-slate-600/5 border-slate-500/20';
    }
  };

  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    creates: logs.filter(log => log.action === 'create').length,
    updates: logs.filter(log => log.action === 'update').length,
    deletes: logs.filter(log => log.action === 'delete').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Audit Log</h1>
            <p className="text-slate-400 text-sm">Bekijk systeemactiviteiten en wijzigingen</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporteer
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Wis Logs
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-7 h-7 text-blue-400 opacity-70" />
            <span className="text-xs text-blue-400 font-medium">TOTAAL</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Log entries</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-7 h-7 text-purple-400 opacity-70" />
            <span className="text-xs text-purple-400 font-medium">VANDAAG</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.today}</p>
          <p className="text-xs text-slate-400 mt-1">Acties vandaag</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-7 h-7 text-emerald-400 opacity-70" />
            <span className="text-xs text-emerald-400 font-medium">AANGEMAAKT</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.creates}</p>
          <p className="text-xs text-slate-400 mt-1">Create acties</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Edit className="w-7 h-7 text-amber-400 opacity-70" />
            <span className="text-xs text-amber-400 font-medium">BIJGEWERKT</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.updates}</p>
          <p className="text-xs text-slate-400 mt-1">Update acties</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-7 h-7 text-red-400 opacity-70" />
            <span className="text-xs text-red-400 font-medium">VERWIJDERD</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.deletes}</p>
          <p className="text-xs text-slate-400 mt-1">Delete acties</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Zoek in logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          >
            <option value="all">Alle acties</option>
            <option value="create">Aangemaakt</option>
            <option value="update">Bijgewerkt</option>
            <option value="delete">Verwijderd</option>
            <option value="status_change">Status gewijzigd</option>
            <option value="check_in">Check-in</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          >
            <option value="all">Alle types</option>
            <option value="event">Events</option>
            <option value="reservation">Reserveringen</option>
            <option value="customer">Klanten</option>
            <option value="config">Configuratie</option>
            <option value="voucher">Vouchers</option>
            <option value="merchandise">Merchandise</option>
          </select>

          {/* Date Filter */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              placeholder="Van"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              placeholder="Tot"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || dateFrom || dateTo) && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">
              {filteredLogs.length} van {logs.length} logs
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setEntityFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="ml-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-all"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {logs.length === 0 
                ? 'Nog geen audit logs beschikbaar'
                : 'Geen logs gevonden met deze filters'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'p-5 transition-all hover:bg-slate-700/20',
                  expandedLog === log.id && 'bg-slate-700/30'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Action Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br border',
                    getActionColor(log.action)
                  )}>
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-100 font-medium">
                            {log.description}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            {getEntityIcon(log.entityType)}
                            {log.entityType}
                          </span>
                          <span>•</span>
                          <span>#{log.entityId.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{log.actor}</span>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 text-right text-sm text-slate-400">
                        {formatDate(log.timestamp)}
                        <div className="text-xs">
                          {new Date(log.timestamp).toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Changes Detail (expandable) */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {expandedLog === log.id ? '▼' : '▶'} {log.changes.length} wijziging(en)
                        </button>
                        
                        {expandedLog === log.id && (
                          <div className="mt-3 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2">
                            {log.changes.map((change, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-slate-400 font-medium">{change.field}:</span>
                                <div className="ml-4 mt-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-400">-</span>
                                    <span className="text-slate-400">
                                      {typeof change.oldValue === 'object' 
                                        ? JSON.stringify(change.oldValue) 
                                        : String(change.oldValue)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-400">+</span>
                                    <span className="text-slate-300">
                                      {typeof change.newValue === 'object' 
                                        ? JSON.stringify(change.newValue) 
                                        : String(change.newValue)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Over Audit Logs</p>
            <p className="text-blue-200/80">
              Audit logs worden automatisch bijgehouden voor alle belangrijke acties in het systeem. 
              Deze logs worden lokaal opgeslagen en kunnen gebruikt worden voor troubleshooting en accountability. 
              De laatste 1000 entries worden bewaard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
