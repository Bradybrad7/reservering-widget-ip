// Dashboard Personalization UI

import React from 'react';
import { Settings, Save, RotateCcw, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useDashboardLayoutStore, type DashboardWidget } from '../../store/dashboardLayoutStore';
import { cn } from '../../utils';

export const DashboardPersonalization: React.FC = () => {
  const {
    widgets,
    isEditMode,
    presets,
    toggleWidget,
    updateWidgetSize,
    setEditMode,
    resetToDefault,
    applyPreset
  } = useDashboardLayoutStore();

  const [showSettings, setShowSettings] = React.useState(false);

  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);

  const sizeOptions: Array<{ value: DashboardWidget['size']; label: string; cols: string }> = [
    { value: 'small', label: 'Klein', cols: 'col-span-1' },
    { value: 'medium', label: 'Medium', cols: 'col-span-2' },
    { value: 'large', label: 'Groot', cols: 'col-span-3' },
    { value: 'full', label: 'Volledig', cols: 'col-span-4' }
  ];

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gold-400" />
          <span className="text-white font-medium">Dashboard Layout</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!isEditMode)}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
              isEditMode
                ? 'bg-gold-500 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            )}
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {isEditMode ? 'Klaar' : 'Aanpassen'}
          </button>

          {isEditMode && (
            <>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              >
                Widget Instellingen
              </button>

              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Reset naar standaard"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Presets */}
      {isEditMode && (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-semibold mb-3">Snelle Presets</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(presets).map(presetName => (
              <button
                key={presetName}
                onClick={() => applyPreset(presetName)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors capitalize"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget Settings Panel */}
      {isEditMode && showSettings && (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <h3 className="text-white font-semibold mb-4">Beschikbare Widgets</h3>
          <div className="space-y-2">
            {widgets.map(widget => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={cn(
                      'p-2 rounded transition-colors',
                      widget.enabled
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-neutral-700 hover:bg-neutral-600'
                    )}
                  >
                    {widget.enabled ? (
                      <Eye className="w-4 h-4 text-white" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                  
                  <div>
                    <div className="text-white font-medium">{widget.title}</div>
                    <div className="text-xs text-neutral-400">{widget.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400 mr-2">Grootte:</span>
                  {sizeOptions.map(size => (
                    <button
                      key={size.value}
                      onClick={() => updateWidgetSize(widget.id, size.value)}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-medium transition-colors',
                        widget.size === size.value
                          ? 'bg-gold-500 text-white'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      )}
                      title={size.label}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Mode Hint */}
      {isEditMode && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <GripVertical className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong>Tip:</strong> In de toekomst kun je widgets slepen om ze te herordenen. 
            Voor nu kun je widgets aan/uit zetten en hun grootte aanpassen.
          </div>
        </div>
      )}
    </div>
  );
};

// Widget Container Component
interface WidgetContainerProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  isEditMode?: boolean;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  children,
  isEditMode
}) => {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
    full: 'col-span-1 md:col-span-2 lg:col-span-4'
  };

  if (!widget.enabled && !isEditMode) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-neutral-800/50 rounded-lg p-6 border transition-all',
        isEditMode
          ? 'border-gold-500/50 hover:border-gold-500 hover:shadow-lg'
          : 'border-neutral-700',
        sizeClasses[widget.size],
        !widget.enabled && isEditMode && 'opacity-50'
      )}
    >
      {isEditMode && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-700">
          <span className="text-xs text-neutral-400 font-medium uppercase">{widget.type}</span>
          <GripVertical className="w-4 h-4 text-neutral-500 cursor-move" />
        </div>
      )}
      {children}
    </div>
  );
};
