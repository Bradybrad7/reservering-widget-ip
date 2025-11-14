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
  Edit2
} from 'lucide-react';
import { useCustomersStore } from '../../store/customersStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import { CustomerTimeline } from './CustomerTimeline';
import { TagsEditModal } from './modals/TagsEditModal';
import { NotesEditModal } from './modals/NotesEditModal';
import { Badge } from '../ui/Badge';

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
    loadCustomer,
    updateCustomerNotes,
    updateCustomerTags
  } = useCustomersStore();

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  useEffect(() => {
    loadCustomer(customerEmail);
  }, [customerEmail, loadCustomer]);

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

  const handleSaveNotes = async (notes: string) => {
    await updateCustomerNotes(customerEmail, notes);
  };

  const handleSaveTags = async (tags: string[]) => {
    await updateCustomerTags(customerEmail, tags);
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
          <button
            onClick={() => setShowTagsModal(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Bewerken
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedCustomer.tags && selectedCustomer.tags.length > 0 ? (
            selectedCustomer.tags.map(tag => (
              <Badge
                key={tag}
                variant="neutral"
                size="md"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <p className="text-slate-400 text-sm italic">Geen tags toegevoegd</p>
          )}
        </div>
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
                    <Badge variant="success" size="sm">
                      🥗 Vegetarisch
                    </Badge>
                  )}
                  {req?.vegan && (
                    <Badge variant="success" size="sm">
                      🌱 Vegan
                    </Badge>
                  )}
                  {req?.glutenFree && (
                    <Badge variant="warning" size="sm">
                      🌾 Glutenvrij
                    </Badge>
                  )}
                  {req?.lactoseFree && (
                    <Badge variant="info" size="sm">
                      🥛 Lactosevrij
                    </Badge>
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
          <button
            onClick={() => setShowNotesModal(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Bewerken
          </button>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg min-h-[100px]">
          {selectedCustomer.notes ? (
            <p className="text-slate-300 whitespace-pre-wrap">{selectedCustomer.notes}</p>
          ) : (
            <p className="text-slate-400 italic">Geen notities toegevoegd</p>
          )}
        </div>
      </div>

      {/* 🆕 Customer Timeline - Vervang oude boekingsgeschiedenis */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <CustomerTimeline
          reservations={selectedCustomer.reservations}
          notes={[]} // Could be extended with actual notes from store
          emails={[]} // Could be extended with email log data
        />
      </div>

      {/* ✨ Modals */}
      <TagsEditModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        currentTags={selectedCustomer.tags || []}
        onSave={handleSaveTags}
      />

      <NotesEditModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        currentNotes={selectedCustomer.notes || ''}
        onSave={handleSaveNotes}
        customerName={customerEmail}
      />
    </div>
  );
};

export default CustomerDetailView;
