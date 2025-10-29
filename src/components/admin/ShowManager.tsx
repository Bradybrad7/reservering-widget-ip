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
    isSubmitting,
    loadShows,
    createShow,
    updateShow,
    deleteShow
  } = useEventsStore();

  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNewShow, setIsNewShow] = useState(false);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

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

    try {
      if (isNewShow) {
        await createShow({
          ...editingShow,
          id: `show-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await updateShow({
          ...editingShow,
          updatedAt: new Date()
        });
      }
      setShowModal(false);
      setEditingShow(null);
      loadShows();
    } catch (error) {
      console.error('Error saving show:', error);
      alert('Er is een fout opgetreden bij het opslaan');
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
      await updateShow({
        ...show,
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

            {show.description && (
              <p className="text-dark-300 text-sm mb-4">
                {show.description}
              </p>
            )}

            {show.imageUrl && (
              <div className="mb-4">
                <img
                  src={show.imageUrl}
                  alt={show.name}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={editingShow.description}
                  onChange={(e) => setEditingShow({ ...editingShow, description: e.target.value })}
                  placeholder="Korte beschrijving van de show..."
                  rows={3}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Afbeelding URL
                </label>
                <input
                  type="text"
                  value={editingShow.imageUrl || ''}
                  onChange={(e) => setEditingShow({ ...editingShow, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {editingShow.imageUrl && (
                  <img
                    src={editingShow.imageUrl}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded"
                  />
                )}
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
