import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Calendar,
  DollarSign,
  ShoppingBag,
  Tag,
  StickyNote,
  TrendingUp,
  User,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import { CustomerTimeline } from './CustomerTimeline';

interface CustomerDetailViewProps {
  customerEmail: string;
  onBack: () => void;
}

/**
 * Customer Detail View - CRM Light
 * 
 * Comprehensive customer profile page with:
 * - Complete contact information
 * - Booking history with details
 * - Spending statistics
 * - Tag management for categorization
 * - Admin notes field
 * - Dietary preferences overview
 */
const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customerEmail, onBack }) => {
  const {
    selectedCustomer,
    loadCustomer
  } = useCustomersStore();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Predefined tag options
  const commonTags = ['VIP', 'Zakelijk', 'Pers', 'Repeat Customer', 'Allergie', 'Feestganger', 'Corporate Event'];

  useEffect(() => {
    loadCustomer(customerEmail);
  }, [customerEmail, loadCustomer]);

  useEffect(() => {
    if (selectedCustomer) {
      setNotes(selectedCustomer.notes || '');
      setSelectedTags(selectedCustomer.tags || []);
    }
  }, [selectedCustomer]);

  if (!selectedCustomer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Klantgegevens laden...</p>
        </div>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    // TODO: Implement updateCustomerNotes in customersStore
    // await updateCustomerNotes(customerEmail, notes);
    setIsEditingNotes(false);
  };

  const handleSaveTags = async () => {
    // TODO: Implement updateCustomerTags in customersStore
    // await updateCustomerTags(customerEmail, selectedTags);
    setIsEditingTags(false);
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Calculate additional statistics
  const stats = {
    totalBookings: selectedCustomer.totalBookings,
    totalSpent: selectedCustomer.totalSpent,
    avgSpending: selectedCustomer.totalBookings > 0 ? selectedCustomer.totalSpent / selectedCustomer.totalBookings : 0,
    avgGroupSize: selectedCustomer.averageGroupSize,
    preferredArrangement: selectedCustomer.preferredArrangement
  };

  // Get dietary requirements from reservations
  const allDietaryRequirements = selectedCustomer.reservations
    .filter(r => r.dietaryRequirements)
    .map(r => r.dietaryRequirements)
    .filter(Boolean);

  const hasDietaryRequirements = allDietaryRequirements.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar overzicht
        </button>
      </div>

      {/* Customer Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-lg p-8">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {selectedCustomer.companyName}
            </h1>
            <p className="text-xl text-slate-300 mb-4">{selectedCustomer.contactPerson}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${selectedCustomer.email}`} className="hover:text-amber-400 transition-colors">
                  {selectedCustomer.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sinds {formatDate(selectedCustomer.firstBooking)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Laatste boeking: {formatDate(selectedCustomer.lastBooking)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-8 h-8 text-blue-400 opacity-70" />
            <span className="text-xs text-blue-400 font-medium">BOEKINGEN</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{stats.totalBookings}</p>
          <p className="text-sm text-slate-400 mt-1">Totaal aantal reserveringen</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-emerald-400 opacity-70" />
            <span className="text-xs text-emerald-400 font-medium">OMZET</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-sm text-slate-400 mt-1">Totale bestedingen</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-400 opacity-70" />
            <span className="text-xs text-purple-400 font-medium">GEMIDDELD</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{formatCurrency(stats.avgSpending)}</p>
          <p className="text-sm text-slate-400 mt-1">Per boeking</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <User className="w-8 h-8 text-amber-400 opacity-70" />
            <span className="text-xs text-amber-400 font-medium">GROEPSGROOTTE</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{stats.avgGroupSize.toFixed(1)}</p>
          <p className="text-sm text-slate-400 mt-1">Gemiddeld aantal gasten</p>
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Tags
          </h2>
          {!isEditingTags ? (
            <button
              onClick={() => setIsEditingTags(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Bewerken
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveTags}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                Opslaan
              </button>
              <button
                onClick={() => {
                  setSelectedTags(selectedCustomer.tags || []);
                  setIsEditingTags(false);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </div>
          )}
        </div>

        {isEditingTags ? (
          <div className="space-y-4">
            {/* Common tags */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Veelgebruikte tags:</label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    disabled={selectedTags.includes(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedTags.includes(tag)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:border-amber-500/50'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom tag input */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nieuwe tag toevoegen:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  placeholder="Typ een tag..."
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
                <button
                  onClick={handleAddCustomTag}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all"
                >
                  Toevoegen
                </button>
              </div>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Actieve tags:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-medium border border-amber-500/40 flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-amber-100 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTags.length > 0 ? (
              selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-sm font-medium border border-amber-500/40"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-slate-400 text-sm italic">Geen tags toegevoegd</p>
            )}
          </div>
        )}
      </div>

      {/* Dietary Requirements Section */}
      {hasDietaryRequirements && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Dieetwensen & Allergieën
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDietaryRequirements.map((req, idx) => (
              <div key={idx} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {req?.vegetarian && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs border border-emerald-500/30">
                      🥗 Vegetarisch
                    </span>
                  )}
                  {req?.vegan && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">
                      🌱 Vegan
                    </span>
                  )}
                  {req?.glutenFree && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs border border-amber-500/30">
                      🌾 Glutenvrij
                    </span>
                  )}
                  {req?.lactoseFree && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                      🥛 Lactosevrij
                    </span>
                  )}
                </div>
                {req?.other && (
                  <p className="text-sm text-slate-300 mt-2">
                    <span className="text-slate-400">Overige:</span> {req.other}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            Admin Notities
          </h2>
          {!isEditingNotes ? (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Bewerken
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                Opslaan
              </button>
              <button
                onClick={() => {
                  setNotes(selectedCustomer.notes || '');
                  setIsEditingNotes(false);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </div>
          )}
        </div>

        {isEditingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Voeg notities toe over deze klant..."
            rows={6}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
          />
        ) : (
          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg min-h-[100px]">
            {notes ? (
              <p className="text-slate-300 whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-slate-400 italic">Geen notities toegevoegd</p>
            )}
          </div>
        )}
      </div>

      {/* 🆕 Customer Timeline - Vervang oude boekingsgeschiedenis */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <CustomerTimeline
          reservations={selectedCustomer.reservations}
          notes={[]} // Could be extended with actual notes from store
          emails={[]} // Could be extended with email log data
        />
      </div>
    </div>
  );
};

export default CustomerDetailView;
