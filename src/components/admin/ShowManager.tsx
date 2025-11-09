import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Film
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { cn } from '../../utils';
import type { Show } from '../../types';

export const ShowManager: React.FC = () => {
  const {
    shows,
    loadShows,
    createShow,
    updateShow,
    deleteShow
  } = useEventsStore();

  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNewShow, setIsNewShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (show: Show) => {
    setEditingShow({ ...show });
    setIsNewShow(false);
    setShowModal(true);
  };

  const handleAddNew = () => {
    const newShow: Show = {
      id: 'new',
      name: '',
      description: '',
      logoUrl: '',
      imageUrl: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setEditingShow(newShow);
    setIsNewShow(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingShow || !editingShow.name.trim()) {
      alert('Show naam is verplicht');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isNewShow) {
        const { id, createdAt, updatedAt, ...showData } = editingShow;
        const success = await createShow({
          ...showData,
          name: editingShow.name,
          description: editingShow.description,
          logoUrl: editingShow.logoUrl,
          imageUrl: editingShow.imageUrl,
          isActive: editingShow.isActive
        });
        if (success) {
          alert('✅ Show succesvol aangemaakt!');
        }
      } else {
        console.log('🔄 Updating show:', editingShow.id, {
          name: editingShow.name,
          description: editingShow.description,
          logoUrl: editingShow.logoUrl,
          imageUrl: editingShow.imageUrl,
          isActive: editingShow.isActive
        });
        const success = await updateShow(editingShow.id, {
          name: editingShow.name,
          description: editingShow.description,
          logoUrl: editingShow.logoUrl,
          imageUrl: editingShow.imageUrl,
          isActive: editingShow.isActive,
          updatedAt: new Date()
        });
        if (success) {
          alert('✅ Show succesvol bijgewerkt!');
        } else {
          alert('❌ Show kon niet worden bijgewerkt');
          return;
        }
      }
      setShowModal(false);
      setEditingShow(null);
      await loadShows();
    } catch (error) {
      console.error('❌ Error saving show:', error);
      alert('Er is een fout opgetreden bij het opslaan: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (showId: string) => {
    if (!confirm('Weet je zeker dat je deze show wilt verwijderen? Let op: events die deze show gebruiken zullen moeten worden aangepast.')) {
      return;
    }

    try {
      await deleteShow(showId);
      loadShows();
    } catch (error) {
      console.error('Error deleting show:', error);
      alert('Er is een fout opgetreden bij het verwijderen');
    }
  };

  const handleToggleActive = async (show: Show) => {
    try {
      await updateShow(show.id, {
        isActive: !show.isActive,
        updatedAt: new Date()
      });
      loadShows();
    } catch (error) {
      console.error('Error toggling show:', error);
      alert('Er is een fout opgetreden');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <Film className="w-6 h-6 text-gold-400" />
            Shows Beheren
          </h2>
          <p className="text-dark-300 mt-1">
            Beheer de verschillende shows zoals "Alles in Wonderland", "Kerst Special", etc.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-dark-950 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Show
        </button>
      </div>

      {/* Shows List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shows.map((show) => (
          <div
            key={show.id}
            className={cn(
              "bg-dark-800 rounded-lg p-6 border transition-all",
              show.isActive
                ? "border-dark-700 hover:border-gold-500/50"
                : "border-dark-700/50 opacity-60"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Film className={cn(
                  "w-5 h-5",
                  show.isActive ? "text-gold-400" : "text-dark-500"
                )} />
                <h3 className="text-lg font-bold text-dark-50">
                  {show.name}
                </h3>
              </div>
              <button
                onClick={() => handleToggleActive(show)}
                className="text-dark-400 hover:text-dark-200 transition-colors"
                title={show.isActive ? "Deactiveren" : "Activeren"}
              >
                {show.isActive ? (
                  <ToggleRight className="w-6 h-6 text-green-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {(show.logoUrl || show.imageUrl) && (
              <div className="mb-4">
                <img
                  src={show.logoUrl || show.imageUrl}
                  alt={show.name}
                  className="w-full h-32 object-contain bg-dark-700/50 rounded p-2"
                />
              </div>
            )}

            {show.description && (
              <p className="text-dark-300 text-sm mb-4 line-clamp-3">
                {show.description}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(show)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded transition-colors"
              >
                <Edit className="w-4 h-4" />
                Bewerken
              </button>
              <button
                onClick={() => handleDelete(show.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {shows.length === 0 && (
          <div className="col-span-full text-center py-12 text-dark-400">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nog geen shows aangemaakt</p>
            <p className="text-sm mt-2">Klik op "Nieuwe Show" om te beginnen</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-dark-50">
                {isNewShow ? 'Nieuwe Show' : 'Show Bewerken'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-dark-400 hover:text-dark-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Show Naam *
                </label>
                <input
                  type="text"
                  value={editingShow.name}
                  onChange={(e) => setEditingShow({ ...editingShow, name: e.target.value })}
                  placeholder="Bijv. Alles in Wonderland"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Show Logo URL
                  <span className="text-xs text-dark-400 ml-2">
                    (Gebruikt in booking widget en emails)
                  </span>
                </label>
                <input
                  type="text"
                  value={editingShow.logoUrl || editingShow.imageUrl || ''}
                  onChange={(e) => setEditingShow({ ...editingShow, logoUrl: e.target.value, imageUrl: e.target.value })}
                  placeholder="https://example.com/logo.jpg"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {(editingShow.logoUrl || editingShow.imageUrl) && (
                  <div className="mt-2">
                    <img
                      src={editingShow.logoUrl || editingShow.imageUrl}
                      alt="Logo Preview"
                      className="w-full max-w-sm h-32 object-contain bg-dark-700 rounded p-2"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Show Omschrijving
                  <span className="text-xs text-dark-400 ml-2">
                    (Korte wervende tekst - wordt getoond in booking en emails)
                  </span>
                </label>
                <textarea
                  value={editingShow.description || ''}
                  onChange={(e) => setEditingShow({ ...editingShow, description: e.target.value })}
                  placeholder="Een meeslepende voorstelling vol verrassingen en emotie..."
                  rows={4}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <p className="text-xs text-dark-400 mt-1">
                  💡 Tip: Schrijf platte tekst (geen HTML). Dit wordt automatisch veilig weergegeven.
                </p>
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingShow.isActive}
                    onChange={(e) => setEditingShow({ ...editingShow, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-dark-200">
                    Show is actief (beschikbaar voor events)
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-dark-950 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Bezig...' : 'Opslaan'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
