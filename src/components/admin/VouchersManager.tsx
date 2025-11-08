import React, { useState, useEffect } from 'react';
import {
  Gift,
  Trash2,
  X,
  Ticket,
  RefreshCw,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Search,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../../utils';

interface Voucher {
  id: string;
  code: string;
  value: number;
  description?: string;
  isActive: boolean;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
  usedBy?: string;
  expiresAt?: Date;
  notes?: string;
}

export const VouchersManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'generate' | 'import' | 'manual'>('generate');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generate form
  const [generateForm, setGenerateForm] = useState({
    count: 1,
    value: 25,
    prefix: 'TB',
    description: '',
    expiresInMonths: 12
  });

  // Import form
  const [importForm, setImportForm] = useState({
    codes: '',
    value: 25,
    description: ''
  });

  // Manual form (single voucher with custom code)
  const [manualForm, setManualForm] = useState({
    code: '',
    value: 25,
    description: '',
    expiresInMonths: 12
  });

  useEffect(() => {
    // TODO: Load vouchers from API
    loadVouchers();
  }, []);

  const loadVouchers = () => {
    // Mock data voor nu
    const mockData: Voucher[] = [
      {
        id: '1',
        code: 'TB-2024-001',
        value: 25,
        description: 'Standaard Theaterbon',
        isActive: true,
        isUsed: false,
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        code: 'TB-2024-002',
        value: 50,
        description: 'Premium Theaterbon',
        isActive: true,
        isUsed: true,
        createdAt: new Date('2024-01-16'),
        usedAt: new Date('2024-02-10'),
        usedBy: 'Jan Jansen'
      },
      {
        id: '3',
        code: 'OLD-SYSTEM-123',
        value: 30,
        description: 'Geïmporteerd van oud systeem',
        isActive: true,
        isUsed: false,
        createdAt: new Date('2023-12-01'),
        notes: 'Overgenomen van vorig systeem'
      }
    ];
    setVouchers(mockData);
  };

  const generateVoucherCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${generateForm.prefix}-${timestamp}-${random}`;
  };

  const handleGenerate = async () => {
    if (generateForm.count < 1 || generateForm.value <= 0) {
      alert('Controleer de invoer');
      return;
    }

    const newVouchers: Voucher[] = [];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + generateForm.expiresInMonths);

    for (let i = 0; i < generateForm.count; i++) {
      const voucher: Voucher = {
        id: Date.now().toString() + i,
        code: generateVoucherCode(),
        value: generateForm.value,
        description: generateForm.description,
        isActive: true,
        isUsed: false,
        createdAt: new Date(),
        expiresAt
      };
      newVouchers.push(voucher);
    }

    // TODO: API call to create vouchers
    setVouchers([...vouchers, ...newVouchers]);
    setShowModal(false);
    
    // Download generated codes
    downloadVouchers(newVouchers);
  };

  const handleImport = async () => {
    const codes = importForm.codes
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (codes.length === 0) {
      alert('Voer minimaal één code in');
      return;
    }

    const newVouchers: Voucher[] = codes.map((code, index) => ({
      id: Date.now().toString() + index,
      code,
      value: importForm.value,
      description: importForm.description || 'Geïmporteerd',
      isActive: true,
      isUsed: false,
      createdAt: new Date(),
      notes: 'Overgenomen van oud systeem'
    }));

    // TODO: API call to create vouchers
    setVouchers([...vouchers, ...newVouchers]);
    setShowModal(false);
  };

  const handleManual = async () => {
    if (!manualForm.code.trim()) {
      alert('Voer een code in');
      return;
    }

    if (manualForm.value <= 0) {
      alert('Waarde moet hoger zijn dan €0');
      return;
    }

    // Check if code already exists
    if (vouchers.some(v => v.code.toUpperCase() === manualForm.code.toUpperCase())) {
      alert('Deze code bestaat al');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + manualForm.expiresInMonths);

    const newVoucher: Voucher = {
      id: Date.now().toString(),
      code: manualForm.code.toUpperCase(),
      value: manualForm.value,
      description: manualForm.description || 'Handmatig toegevoegd',
      isActive: true,
      isUsed: false,
      createdAt: new Date(),
      expiresAt,
      notes: 'Handmatig aangemaakt'
    };

    // TODO: API call to create voucher
    setVouchers([...vouchers, newVoucher]);
    setShowModal(false);
    
    // Reset form
    setManualForm({
      code: '',
      value: 25,
      description: '',
      expiresInMonths: 12
    });
  };

  const handleDelete = async (voucher: Voucher) => {
    if (voucher.isUsed) {
      alert('Gebruikte vouchers kunnen niet verwijderd worden');
      return;
    }
    
    if (!confirm(`Weet je zeker dat je voucher "${voucher.code}" wilt verwijderen?`)) {
      return;
    }
    
    // TODO: API call
    setVouchers(vouchers.filter(v => v.id !== voucher.id));
  };

  const handleToggleActive = async (voucher: Voucher) => {
    // TODO: API call
    setVouchers(vouchers.map(v => 
      v.id === voucher.id ? { ...v, isActive: !v.isActive } : v
    ));
  };

  const downloadVouchers = (vouchersToDownload: Voucher[]) => {
    const csv = [
      'Code,Waarde,Beschrijving,Aangemaakt,Verloopt',
      ...vouchersToDownload.map(v => 
        `${v.code},€${v.value},"${v.description || ''}",${v.createdAt.toLocaleDateString()},${v.expiresAt?.toLocaleDateString() || '-'}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theaterbonnen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.isActive && !v.isUsed).length,
    used: vouchers.filter(v => v.isUsed).length,
    totalValue: vouchers.filter(v => !v.isUsed && v.isActive).reduce((sum, v) => sum + v.value, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Theaterbonnen Beheer</h2>
          <p className="text-neutral-400 mt-1">Genereer nieuwe bonnen of importeer bestaande vouchers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadVouchers(vouchers.filter(v => !v.isUsed))}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporteer
          </button>
          <button
            onClick={() => {
              setModalMode('manual');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Eigen Code
          </button>
          <button
            onClick={() => {
              setModalMode('generate');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Genereer
          </button>
          <button
            onClick={() => {
              setModalMode('import');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            <Upload className="w-4 h-4" />
            Importeer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Totaal Bonnen</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Gift className="w-8 h-8 text-gold-400" />
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Actief & Beschikbaar</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Gebruikt</p>
              <p className="text-2xl font-bold text-blue-400">{stats.used}</p>
            </div>
            <Ticket className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Totale Waarde</p>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(stats.totalValue)}</p>
            </div>
            <Gift className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek op code of beschrijving..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500"
        />
      </div>

      {/* Vouchers List */}
      <div className="space-y-3">
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-12 bg-neutral-800/30 rounded-lg">
            <Gift className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">
              {searchQuery ? 'Geen bonnen gevonden' : 'Geen theaterbonnen aangemaakt'}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">Waarde</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">Beschrijving</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">Aangemaakt</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-300">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-neutral-700/30">
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-neutral-900 text-gold-400 font-mono text-sm rounded">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {formatCurrency(voucher.value)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-300">{voucher.description || '-'}</p>
                      {voucher.notes && (
                        <p className="text-xs text-neutral-500 mt-1">{voucher.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {voucher.isUsed ? (
                        <div>
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            Gebruikt
                          </span>
                          {voucher.usedAt && (
                            <p className="text-xs text-neutral-500 mt-1">
                              {voucher.usedAt.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : voucher.isActive ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Actief
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-600/50 text-neutral-400 text-xs rounded-full">
                          Inactief
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {voucher.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!voucher.isUsed && (
                          <button
                            onClick={() => handleToggleActive(voucher)}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                            title={voucher.isActive ? 'Deactiveren' : 'Activeren'}
                          >
                            {voucher.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-neutral-400" />
                            )}
                          </button>
                        )}
                        {!voucher.isUsed && (
                          <button
                            onClick={() => handleDelete(voucher)}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {modalMode === 'generate' && 'Theaterbonnen Genereren'}
                  {modalMode === 'import' && 'Bestaande Vouchers Importeren'}
                  {modalMode === 'manual' && 'Eigen Code Toevoegen'}
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {modalMode === 'generate' && 'Genereer nieuwe unieke theaterbonnen'}
                  {modalMode === 'import' && 'Importeer vouchers uit het oude systeem'}
                  {modalMode === 'manual' && 'Voeg een theaterbon toe met je eigen code'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalMode === 'manual' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={manualForm.code}
                      onChange={(e) => setManualForm({ ...manualForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-lg"
                      placeholder="Bijv. KERST2024 of TB-SPECIAL-001"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Voer je eigen unieke code in (letters, cijfers en - zijn toegestaan)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Waarde (€) *
                      </label>
                      <input
                        type="number"
                        value={manualForm.value}
                        onChange={(e) => setManualForm({ ...manualForm, value: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        step="0.50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Geldig (maanden)
                      </label>
                      <input
                        type="number"
                        value={manualForm.expiresInMonths}
                        onChange={(e) => setManualForm({ ...manualForm, expiresInMonths: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Beschrijving
                    </label>
                    <input
                      type="text"
                      value={manualForm.description}
                      onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      placeholder="Bijv. Kerst actie 2024"
                    />
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-300">
                        <p className="font-medium mb-1">Eigen code:</p>
                        <p>Je kunt je eigen code kiezen. Zorg ervoor dat deze uniek is en makkelijk te onthouden voor je klanten.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleManual}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Bon Toevoegen
                  </button>
                </div>
              ) : modalMode === 'generate' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Aantal bonnen *
                      </label>
                      <input
                        type="number"
                        value={generateForm.count}
                        onChange={(e) => setGenerateForm({ ...generateForm, count: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        max="1000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Waarde per bon (€) *
                      </label>
                      <input
                        type="number"
                        value={generateForm.value}
                        onChange={(e) => setGenerateForm({ ...generateForm, value: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        step="0.50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Prefix
                      </label>
                      <input
                        type="text"
                        value={generateForm.prefix}
                        onChange={(e) => setGenerateForm({ ...generateForm, prefix: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Geldig (maanden)
                      </label>
                      <input
                        type="number"
                        value={generateForm.expiresInMonths}
                        onChange={(e) => setGenerateForm({ ...generateForm, expiresInMonths: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Beschrijving
                    </label>
                    <input
                      type="text"
                      value={generateForm.description}
                      onChange={(e) => setGenerateForm({ ...generateForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      placeholder="Bijv. Kerst 2024 actie"
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="font-medium mb-1">Preview:</p>
                        <p className="font-mono text-gold-400">{generateVoucherCode()}</p>
                        <p className="mt-2">De gegenereerde codes worden automatisch gedownload als CSV bestand.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Genereer {generateForm.count} Bon{generateForm.count !== 1 ? 'nen' : ''}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Voucher Codes *
                    </label>
                    <textarea
                      value={importForm.codes}
                      onChange={(e) => setImportForm({ ...importForm, codes: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono"
                      rows={8}
                      placeholder="Plak hier de codes uit het oude systeem (één per regel)&#10;Bijvoorbeeld:&#10;OLD-001&#10;OLD-002&#10;OLD-003"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Aantal codes: {importForm.codes.split('\n').filter(c => c.trim()).length}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Waarde per voucher (€) *
                      </label>
                      <input
                        type="number"
                        value={importForm.value}
                        onChange={(e) => setImportForm({ ...importForm, value: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        min="1"
                        step="0.50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Beschrijving
                      </label>
                      <input
                        type="text"
                        value={importForm.description}
                        onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                        placeholder="Bijv. Van oud systeem"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-300">
                        <p className="font-medium mb-1">Let op:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Controleer of de codes nog niet in het systeem staan</li>
                          <li>Alle geïmporteerde vouchers worden als 'actief' gemarkeerd</li>
                          <li>Deze actie kan niet ongedaan gemaakt worden</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleImport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Importeer Vouchers
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
