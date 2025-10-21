import React, { useState } from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayout } from './admin/AdminLayout';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { ReservationsManager } from './admin/ReservationsManager';
import { EventManager } from './admin/EventManager';
import { CalendarManager } from './admin/CalendarManager';
import { CustomerManager } from './admin/CustomerManager';
import { MerchandiseManager } from './admin/MerchandiseManager';
import { DataHealthCheck } from './admin/DataHealthCheck';
import { ConfigManager } from './admin/ConfigManager';

const BookingAdmin: React.FC<BookingAdminProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'events' | 'calendar' | 'merchandise' | 'settings' | 'data'>('dashboard');
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [eventsResponse, statsResponse] = await Promise.all([
        apiService.getAdminEvents(),
        apiService.getAdminStats()
      ]);

      if (eventsResponse.success && eventsResponse.data) {
        setAdminEvents(eventsResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = adminEvents.filter(event => {
    if (selectedEventType !== 'all' && event.type !== selectedEventType) {
      return false;
    }
    
    if (selectedMonth) {
      const eventMonth = event.date.toISOString().slice(0, 7);
      if (eventMonth !== selectedMonth) {
        return false;
      }
    }
    
    return true;
  });

  const handleExportCSV = () => {
    const csvData = filteredEvents.map(event => ({
      Datum: formatDate(event.date),
      Type: nl.eventTypes[event.type],
      Tijd: `${formatTime(event.startsAt)} - ${formatTime(event.endsAt)}`,
      Capaciteit: event.capacity,
      Gereserveerd: event.capacity - (event.remainingCapacity || 0),
      Resterend: event.remainingCapacity || 0,
      Reserveringen: event.reservations.length,
      Omzet: formatCurrency(event.revenue),
      Status: event.isActive ? 'Actief' : 'Inactief'
    }));

    const headers = [
      { key: 'Datum' as const, label: 'Datum' },
      { key: 'Type' as const, label: 'Type' },
      { key: 'Tijd' as const, label: 'Tijd' },
      { key: 'Capaciteit' as const, label: 'Capaciteit' },
      { key: 'Gereserveerd' as const, label: 'Gereserveerd' },
      { key: 'Resterend' as const, label: 'Resterend' },
      { key: 'Reserveringen' as const, label: 'Aantal Reserveringen' },
      { key: 'Omzet' as const, label: 'Omzet' },
      { key: 'Status' as const, label: 'Status' }
    ];

    const csvContent = generateCSV(csvData, headers);
    const filename = `evenementen-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csvContent, filename);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-neutral-300">{nl.admin.stats.totalEvents}</p>
                <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-neutral-300">{nl.admin.stats.totalReservations}</p>
                <p className="text-2xl font-bold text-white">{stats.totalReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-neutral-300">{nl.admin.stats.totalRevenue}</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-neutral-300">{nl.admin.stats.averageGroupSize}</p>
                <p className="text-2xl font-bold text-white">{stats.averageGroupSize.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-neutral-800/50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Evenementen</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-500/10">
                <th className="text-left py-2 font-medium text-neutral-300">Datum</th>
                <th className="text-left py-2 font-medium text-neutral-300">Type</th>
                <th className="text-left py-2 font-medium text-neutral-300">Capaciteit</th>
                <th className="text-left py-2 font-medium text-neutral-300">Reserveringen</th>
                <th className="text-left py-2 font-medium text-neutral-300">Omzet</th>
                <th className="text-left py-2 font-medium text-neutral-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminEvents.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-white">{formatDate(event.date)}</p>
                      <p className="text-neutral-400">{formatTime(event.startsAt)}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      />
                      <span>{nl.eventTypes[event.type]}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div>
                      <p>{event.capacity - (event.remainingCapacity || 0)} / {event.capacity}</p>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ 
                            width: `${((event.capacity - (event.remainingCapacity || 0)) / event.capacity) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-white">{event.reservations.length}</td>
                  <td className="py-3 font-medium text-white">{formatCurrency(event.revenue)}</td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      event.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    )}>
                      {event.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="bg-neutral-800/50 rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as EventType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">Alle types</option>
                {Object.entries(nl.eventTypes).map(([type, name]) => (
                  <option key={type} value={type}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Download className="w-4 h-4" />
              <span>{nl.admin.events.export}</span>
            </button>

            <button
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4" />
              <span>{nl.admin.events.add}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-neutral-800/50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-500/10">
          <h3 className="text-lg font-semibold text-white">
            {nl.admin.events.title} ({filteredEvents.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Datum & Tijd</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Type</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Capaciteit</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Reserveringen</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Omzet</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Status</th>
                <th className="text-left py-3 px-6 font-medium text-neutral-300">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-white">{formatDate(event.date)}</p>
                      <p className="text-neutral-400">{formatTime(event.startsAt)} - {formatTime(event.endsAt)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      />
                      <span>{nl.eventTypes[event.type]}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium">
                        {event.capacity - (event.remainingCapacity || 0)} / {event.capacity}
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={cn(
                            "h-2 rounded-full",
                            {
                              'bg-green-500': (event.remainingCapacity || 0) > event.capacity * 0.3,
                              'bg-yellow-500': (event.remainingCapacity || 0) <= event.capacity * 0.3 && (event.remainingCapacity || 0) > 0,
                              'bg-red-500': (event.remainingCapacity || 0) === 0
                            }
                          )}
                          style={{ 
                            width: `${((event.capacity - (event.remainingCapacity || 0)) / event.capacity) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white">{event.reservations.length}</td>
                  <td className="py-4 px-6 font-medium text-white">{formatCurrency(event.revenue)}</td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      event.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    )}>
                      {event.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button className="p-1 text-primary-500 hover:bg-gold-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-neutral-400">
            {nl.admin.events.noEvents}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-neutral-800/50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{nl.admin.settings.title}</h3>
        <p className="text-neutral-300">
          Instellingen functionaliteit wordt binnenkort toegevoegd. 
          Hier kunt u prijzen, add-ons, boekingsregels en bedrijfsgegevens beheren.
        </p>
      </div>
    </div>
  );

  const renderReservations = () => {
    // Get all reservations from events
    const allReservations = adminEvents.flatMap(event => 
      event.reservations.map(res => ({
        ...res,
        eventDate: event.date,
        eventType: event.type,
        eventTime: `${event.startsAt} - ${event.endsAt}`
      }))
    );

    const filteredReservations = allReservations.filter(res => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          res.companyName.toLowerCase().includes(term) ||
          res.contactPerson.toLowerCase().includes(term) ||
          res.email.toLowerCase().includes(term) ||
          res.id.toLowerCase().includes(term)
        );
      }
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-theatre p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600">Totaal Reserveringen</p>
                <p className="text-2xl font-bold text-neutral-900">{allReservations.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="card-theatre p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600">Totale Personen</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {allReservations.reduce((sum, r) => sum + r.numberOfPersons, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="card-theatre p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600">Totale Omzet</p>
                <p className="text-2xl font-bold text-primary-500">
                  {formatCurrency(allReservations.reduce((sum, r) => sum + r.totalPrice, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="card-theatre p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-600">Gem. Groepsgrootte</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {allReservations.length > 0 
                    ? (allReservations.reduce((sum, r) => sum + r.numberOfPersons, 0) / allReservations.length).toFixed(1)
                    : '0'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card-theatre p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Zoek op bedrijf, contactpersoon, email of ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button
              onClick={() => {
                const csvData = filteredReservations.map(r => ({
                  ID: r.id,
                  Datum: formatDate(r.eventDate),
                  Type: nl.eventTypes[r.eventType],
                  Bedrijf: r.companyName,
                  Contact: r.contactPerson,
                  Email: r.email,
                  Telefoon: r.phone,
                  Personen: r.numberOfPersons.toString(),
                  Arrangement: nl.arrangements[r.arrangement],
                  Totaal: formatCurrency(r.totalPrice)
                }));
                const headers = Object.keys(csvData[0] || {}).map(key => ({ key: key as any, label: key }));
                const csvContent = generateCSV(csvData, headers);
                downloadCSV(csvContent, `reserveringen-${new Date().toISOString().slice(0, 10)}.csv`);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
            >
              <Download className="w-4 h-4" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="card-theatre overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gold-50 border-b-2 border-gold-300">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Datum & Tijd</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Bedrijf</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Contact</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Personen</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Arrangement</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Totaal</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-900">Extra's</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-gold-100 hover:bg-gold-50/30">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm text-neutral-600">{reservation.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-neutral-900">{formatDate(reservation.eventDate)}</p>
                        <p className="text-sm text-dark-600">{reservation.eventTime}</p>
                        <p className="text-xs text-dark-500">{nl.eventTypes[reservation.eventType]}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-neutral-900">{reservation.companyName}</p>
                        <p className="text-sm text-dark-600">{reservation.contactPerson}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-dark-500" />
                          <span className="text-neutral-600">{reservation.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-dark-500" />
                          <span className="text-neutral-600">{reservation.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-neutral-900">{reservation.numberOfPersons}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-neutral-900">{nl.arrangements[reservation.arrangement]}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary-500">{formatCurrency(reservation.totalPrice)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs">
                        {reservation.preDrink?.enabled && (
                          <div className="flex items-center gap-1 text-neutral-600">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Voorborrel ({reservation.preDrink.quantity}p)</span>
                          </div>
                        )}
                        {reservation.afterParty?.enabled && (
                          <div className="flex items-center gap-1 text-neutral-600">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Naborrel ({reservation.afterParty.quantity}p)</span>
                          </div>
                        )}
                        {reservation.merchandise && reservation.merchandise.length > 0 && (
                          <div className="flex items-center gap-1 text-neutral-600">
                            <Package className="w-3 h-3 text-primary-500" />
                            <span>Merchandise ({reservation.merchandise.length})</span>
                          </div>
                        )}
                        {reservation.partyPerson && (
                          <div className="flex items-center gap-1 text-neutral-600">
                            <span>🎉</span>
                            <span>{reservation.partyPerson}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-600 text-lg">Geen reserveringen gevonden</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'reservations':
        return <ReservationsManager />;
      case 'events':
        return <EventManager />;
      case 'calendar':
        return <CalendarManager />;
      case 'merchandise':
        return <MerchandiseManager />;
      case 'data':
        return <DataHealthCheck />;
      case 'settings':
        return <ConfigManager />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default BookingAdmin;