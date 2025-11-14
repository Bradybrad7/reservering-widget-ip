/**
 * 🎯 SAVED VIEWS MANAGER UI
 * 
 * Interface voor beheren en switchen tussen saved views
 */

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Star,
  Check,
  X,
  Settings,
  Zap
} from 'lucide-react';
import { cn } from '../../utils';
import { useSavedViewsStore, type SavedView } from '../../store/savedViewsStore';
import * as LucideIcons from 'lucide-react';

interface SavedViewsManagerProps {
  onSelectView: (viewId: string | null) => void;
  activeViewId: string | null;
}

export const SavedViewsManager: React.FC<SavedViewsManagerProps> = ({ onSelectView, activeViewId }) => {
  const { views, deleteView, duplicateView, exportView, importView, setActiveView } = useSavedViewsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  
  const handleSelectView = (viewId: string | null) => {
    setActiveView(viewId);
    onSelectView(viewId);
  };
  
  const handleExport = (viewId: string) => {
    const json = exportView(viewId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `view-${viewId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importView(json);
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const defaultViews = views.filter(v => v.isDefault);
  const customViews = views.filter(v => !v.isDefault && !v.isPredefined);
  
  const colorClasses = {
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  };
  
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Quick Views
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Import view"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Create new view"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Clear all filters */}
        {activeViewId && (
          <button
            onClick={() => handleSelectView(null)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <X className="w-4 h-4" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
      
      {/* Smart Views */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {/* Default Views */}
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-500 mb-2">
            Smart Views
          </h4>
          
          {defaultViews.map(view => {
            const IconComponent = view.icon ? (LucideIcons as any)[view.icon] : Star;
            const isActive = activeViewId === view.id;
            
            return (
              <button
                key={view.id}
                onClick={() => handleSelectView(view.id)}
                className={cn(
                  'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md'
                )}
              >
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  isActive
                    ? 'bg-white/20'
                    : view.color && colorClasses[view.color as keyof typeof colorClasses]
                )}>
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{view.name}</span>
                    {view.shortcutKey && (
                      <kbd className={cn(
                        'px-1.5 py-0.5 text-xs font-mono rounded',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      )}>
                        {view.shortcutKey}
                      </kbd>
                    )}
                  </div>
                  {view.description && (
                    <p className={cn(
                      'text-xs truncate',
                      isActive ? 'text-white/70' : 'text-slate-500 dark:text-slate-500'
                    )}>
                      {view.description}
                    </p>
                  )}
                </div>
                
                {isActive && (
                  <Check className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Custom Views */}
        {customViews.length > 0 && (
          <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-500 mb-2">
              Custom Views
            </h4>
            
            {customViews.map(view => {
              const IconComponent = view.icon ? (LucideIcons as any)[view.icon] : Star;
              const isActive = activeViewId === view.id;
              
              return (
                <div
                  key={view.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg transition-all duration-200',
                    isActive ? 'ring-2 ring-blue-500' : ''
                  )}
                >
                  <button
                    onClick={() => handleSelectView(view.id)}
                    className={cn(
                      'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      isActive
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-slate-700'
                    )}>
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-bold truncate block">{view.name}</span>
                      {view.description && (
                        <p className={cn(
                          'text-xs truncate',
                          isActive ? 'text-white/70' : 'text-slate-500 dark:text-slate-500'
                        )}>
                          {view.description}
                        </p>
                      )}
                    </div>
                  </button>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleExport(view.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateView(view.id, `${view.name} (Copy)`)}
                      className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingView(view)}
                      className="p-1.5 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete view "${view.name}"?`)) {
                          deleteView(view.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
