import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  Database,
  XCircle
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { storageService } from '../../services/storageService';
import { cn, formatDate } from '../../utils';
interface HealthIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'capacity' | 'orphaned' | 'data' | 'integrity';
  title: string;
  description: string;
  affectedEntity?: string;
  autoFixable: boolean;
}

export const DataHealthCheck: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [dataCounts, setDataCounts] = useState({ events: 0, reservations: 0, merchandise: 0 });

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const foundIssues: HealthIssue[] = [];

    try {
      // Get data
      const eventsResponse = await apiService.getEvents();
      const reservationsResponse = await apiService.getAdminReservations();
      
      // Get counts for display
      const [eventsData, reservationsData, merchandiseData] = await Promise.all([
        storageService.getEvents(),
        storageService.getReservations(),
        storageService.getMerchandise()
      ]);
      
      setDataCounts({
        events: eventsData.length,
        reservations: reservationsData.length,
        merchandise: merchandiseData.length
      });
      
      if (!eventsResponse.success || !reservationsResponse.success) {
        foundIssues.push({
          id: 'api-error',
          severity: 'error',
          category: 'data',
          title: 'API Fout',
          description: 'Kon data niet laden van API service',
          autoFixable: false
        });
        setIssues(foundIssues);
        setIsChecking(false);
        return;
      }

      const events = eventsResponse.data || [];
      const reservations = reservationsResponse.data || [];

      // Check 1: Orphaned Reservations
      reservations.forEach(reservation => {
        const event = events.find(e => e.id === reservation.eventId);
        if (!event) {
          foundIssues.push({
            id: `orphaned-${reservation.id}`,
            severity: 'error',
            category: 'orphaned',
            title: 'Verweesde Reservering',
            description: `Reservering ${reservation.id} verwijst naar niet-bestaand event ${reservation.eventId}`,
            affectedEntity: `Reservering: ${reservation.companyName} (${reservation.email})`,
            autoFixable: true
          });
        }
      });

      // Check 2: Capacity Inconsistency
      events.forEach(event => {
        const eventReservations = reservations.filter(
          r => r.eventId === event.id && (r.status === 'confirmed' || r.status === 'pending' || r.status === 'option' || r.status === 'checked-in')
        );
        const totalBooked = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
        const calculatedRemaining = event.capacity - totalBooked;

        if (calculatedRemaining !== event.remainingCapacity) {
          foundIssues.push({
            id: `capacity-${event.id}`,
            severity: 'warning',
            category: 'capacity',
            title: 'Capaciteit Mismatch',
            description: `Event op ${formatDate(event.date)}: Stored capacity = ${event.remainingCapacity}, Calculated = ${calculatedRemaining}`,
            affectedEntity: `Event: ${formatDate(event.date)}`,
            autoFixable: true
          });
        }

        // Check for negative capacity
        if (event.remainingCapacity !== undefined && event.remainingCapacity < 0) {
          foundIssues.push({
            id: `negative-${event.id}`,
            severity: 'error',
            category: 'capacity',
            title: 'Negatieve Capaciteit',
            description: `Event op ${formatDate(event.date)} heeft negatieve remaining capacity: ${event.remainingCapacity}`,
            affectedEntity: `Event: ${formatDate(event.date)}`,
            autoFixable: true
          });
        }
      });

      // Check 3: Data Integrity
      const storageCheck = storageService.checkStorageAvailable();
      if (!storageCheck.available) {
        foundIssues.push({
          id: 'storage-full',
          severity: 'error',
          category: 'data',
          title: 'Storage Bijna Vol',
          description: `LocalStorage is bijna vol (${Math.round((storageCheck.used / storageCheck.limit) * 100)}%)`,
          autoFixable: false
        });
      }

      // Check 4: Duplicate Reservations
      const emailEventMap = new Map<string, Set<string>>();
      reservations.forEach(reservation => {
        if (reservation.status === 'cancelled') return;
        
        const key = `${reservation.email}-${reservation.eventId}`;
        if (!emailEventMap.has(key)) {
          emailEventMap.set(key, new Set([reservation.id]));
        } else {
          emailEventMap.get(key)!.add(reservation.id);
        }
      });

      emailEventMap.forEach((ids, key) => {
        if (ids.size > 1) {
          const email = key.split('-')[0];
          foundIssues.push({
            id: `duplicate-${key}`,
            severity: 'warning',
            category: 'integrity',
            title: 'Dubbele Reservering',
            description: `Email ${email} heeft ${ids.size} actieve reserveringen voor hetzelfde event`,
            affectedEntity: `Email: ${email}`,
            autoFixable: false
          });
        }
      });

      setIssues(foundIssues);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      foundIssues.push({
        id: 'check-error',
        severity: 'error',
        category: 'data',
        title: 'Health Check Mislukt',
        description: 'Er is een fout opgetreden tijdens de health check',
        autoFixable: false
      });
      setIssues(foundIssues);
    } finally {
      setIsChecking(false);
    }
  };

  const autoFixIssue = async (issue: HealthIssue) => {
    if (!issue.autoFixable) return;

    try {
      if (issue.category === 'orphaned') {
        // Delete orphaned reservation
        const reservationId = issue.id.replace('orphaned-', '');
        await apiService.deleteReservation(reservationId);
      } else if (issue.category === 'capacity') {
        // Recalculate and fix capacity
        const eventId = issue.id.replace('capacity-', '').replace('negative-', '');
        const eventsResponse = await apiService.getEvents();
        const reservationsResponse = await apiService.getAdminReservations();
        
        if (eventsResponse.success && reservationsResponse.success) {
          const event = eventsResponse.data?.find(e => e.id === eventId);
          const reservations = reservationsResponse.data?.filter(
            r => r.eventId === eventId && (r.status === 'confirmed' || r.status === 'pending' || r.status === 'option' || r.status === 'checked-in')
          ) || [];
          
          if (event) {
            const totalBooked = reservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
            const correctRemaining = event.capacity - totalBooked;
            
            await apiService.updateEvent(eventId, {
              remainingCapacity: correctRemaining
            });
          }
        }
      }

      // Re-run health check
      await runHealthCheck();
    } catch (error) {
      console.error('Auto-fix failed:', error);
      alert('Auto-fix mislukt. Probeer handmatig op te lossen.');
    }
  };

  const autoFixAll = async () => {
    if (!confirm('Weet je zeker dat je alle auto-fixable issues wilt oplossen?')) {
      return;
    }

    const fixableIssues = issues.filter(i => i.autoFixable);
    for (const issue of fixableIssues) {
      await autoFixIssue(issue);
    }
  };

  const getSeverityColor = (severity: HealthIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: HealthIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const fixableCount = issues.filter(i => i.autoFixable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Data Health Check</h2>
          <p className="text-dark-600 mt-1">
            Controleer en herstel data inconsistenties
          </p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-5 h-5', isChecking && 'animate-spin')} />
          {isChecking ? 'Checken...' : 'Opnieuw Checken'}
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Status</p>
              <p className={cn(
                'text-2xl font-bold',
                issues.length === 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {issues.length === 0 ? 'Gezond' : 'Issues'}
              </p>
            </div>
            {issues.length === 0 ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Errors</p>
              <p className="text-2xl font-bold text-red-400">{errorCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Auto-fixable</p>
              <p className="text-2xl font-bold text-blue-400">{fixableCount}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Last Check */}
      {lastCheck && (
        <div className="card-theatre p-4">
          <p className="text-sm text-dark-400">
            Laatste check: {lastCheck.toLocaleString('nl-NL')}
          </p>
        </div>
      )}

      {/* Auto Fix All */}
      {fixableCount > 0 && (
        <div className="card-theatre p-4 bg-blue-500/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-bold text-white">
                  {fixableCount} issue(s) kunnen automatisch worden opgelost
                </h3>
                <p className="text-sm text-dark-400">
                  Klik op "Fix All" om alle auto-fixable issues op te lossen
                </p>
              </div>
            </div>
            <button
              onClick={autoFixAll}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Fix All
            </button>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="card-theatre p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-100 mb-2">
              Geen Issues Gevonden! 🎉
            </h3>
            <p className="text-dark-400">
              Je data is consistent en gezond.
            </p>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="card-theatre p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(issue.severity)}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{issue.title}</h3>
                      <span
                        className={cn(
                          'inline-block px-2 py-1 rounded text-xs font-medium mt-1 border',
                          getSeverityColor(issue.severity)
                        )}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    {issue.autoFixable && (
                      <button
                        onClick={() => autoFixIssue(issue)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        <Wrench className="w-4 h-4" />
                        Auto Fix
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-dark-300 mb-2">
                    {issue.description}
                  </p>
                  
                  {issue.affectedEntity && (
                    <p className="text-xs text-dark-500 font-mono bg-dark-800 px-2 py-1 rounded inline-block">
                      {issue.affectedEntity}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Storage Info */}
      <div className="card-theatre p-4">
        <div className="flex items-center gap-3 mb-3">
          <Database className="w-5 h-5 text-gold-400" />
          <h3 className="font-bold text-white">Firestore Info</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            Events: {dataCounts.events}
          </p>
          <p>
            Reserveringen: {dataCounts.reservations}
          </p>
          <p>
            Merchandise: {dataCounts.merchandise}
          </p>
        </div>
      </div>
    </div>
  );
};
