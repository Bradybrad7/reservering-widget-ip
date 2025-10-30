import React, { useEffect, useState } from 'react';
import {
  Users,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Search,
  TrendingUp
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { formatCurrency, formatDate } from '../../utils';

export const CustomerManager: React.FC = () => {
  const { customers, isLoadingCustomers, loadCustomers } = useCustomersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'bookings' | 'spent' | 'recent'>('recent');

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = customers
    .filter(customer => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        customer.companyName.toLowerCase().includes(term) ||
        customer.contactPerson.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
          return new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime();
        default:
          return 0;
      }
    });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const repeatCustomers = customers.filter(c => c.totalBookings > 1).length;

  const handleExportCSV = () => {
    const csvRows = [
      ['Bedrijf', 'Contactpersoon', 'Email', 'Aantal Boekingen', 'Totaal Uitgegeven', 'Laatste Boeking'].join(',')
    ];

    filteredCustomers.forEach(customer => {
      const row = [
        customer.companyName,
        customer.contactPerson,
        customer.email,
        customer.totalBookings,
        `€${customer.totalSpent.toFixed(2)}`,
        formatDate(customer.lastBooking)
      ].join(',');
      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `klanten_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Klantenbeheer</h2>
          <p className="text-dark-600 mt-1">Overzicht van alle klanten en hun boekingsgeschiedenis</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exporteer CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-100">Totaal Klanten</p>
              <p className="text-3xl font-bold text-dark-900 mt-2">{totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-100">Totale Omzet</p>
              <p className="text-3xl font-bold text-dark-900 mt-2">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-100">Gem. Uitgave</p>
              <p className="text-3xl font-bold text-dark-900 mt-2">{formatCurrency(averageSpent)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-100">Terugkerende Klanten</p>
              <p className="text-3xl font-bold text-dark-900 mt-2">{repeatCustomers}</p>
              <p className="text-xs text-dark-500 mt-1">
                {totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(0) : 0}% van totaal
              </p>
            </div>
            <div className="p-3 bg-gold-100 rounded-full">
              <Calendar className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Zoek op bedrijf, contactpersoon of email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="recent">Meest Recent</option>
            <option value="bookings">Meeste Boekingen</option>
            <option value="spent">Hoogste Uitgave</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100 border-b border-dark-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Bedrijf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Contactpersoon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Boekingen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Totaal Uitgegeven
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Laatste Boeking
                </th>
              </tr>
            </thead>
            <tbody className="bg-neutral-800/50 divide-y divide-dark-200">
              {isLoadingCustomers ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    {searchTerm ? 'Geen klanten gevonden met deze zoekcriteria' : 'Nog geen klanten'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isVIP = customer.totalBookings >= 3;

                  return (
                    <tr key={customer.email} className="hover:bg-neutral-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-dark-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-dark-900 flex items-center gap-2">
                              {customer.companyName}
                              {isVIP && (
                                <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-xs font-medium rounded-full">
                                  VIP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{customer.contactPerson}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-neutral-100">
                            <Mail className="w-3 h-3 mr-1" />
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-dark-400 mr-1" />
                          <span className="text-sm font-medium text-white">
                            {customer.totalBookings}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-100">
                          {formatDate(customer.lastBooking)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Klantinzichten</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-gold-100 text-sm">Loyaliteitspercentage</p>
            <p className="text-2xl font-bold mt-1">
              {totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-gold-200 text-xs mt-1">
              {repeatCustomers} van {totalCustomers} klanten komen terug
            </p>
          </div>
          <div>
            <p className="text-gold-100 text-sm">Gemiddelde Boekingen per Klant</p>
            <p className="text-2xl font-bold mt-1">
              {totalCustomers > 0 ? (customers.reduce((sum, c) => sum + c.totalBookings, 0) / totalCustomers).toFixed(1) : 0}
            </p>
          </div>
          <div>
            <p className="text-gold-100 text-sm">Hoogste Klantwaarde</p>
            <p className="text-2xl font-bold mt-1">
              {customers.length > 0 ? formatCurrency(Math.max(...customers.map(c => c.totalSpent))) : '€0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
