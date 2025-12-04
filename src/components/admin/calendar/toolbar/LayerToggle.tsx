import React from 'react';
import { Layers, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { cn } from '../../../../utils';
import type { LayerMode } from '../CalendarCommandCenter';

interface LayerToggleProps {
  activeLayer: LayerMode;
  onLayerChange: (layer: LayerMode) => void;
}

export const LayerToggle: React.FC<LayerToggleProps> = ({ activeLayer, onLayerChange }) => {
  const layers = [
    { id: 'basis' as LayerMode, label: 'Basis', icon: Calendar, color: 'text-slate-400' },
    { id: 'events' as LayerMode, label: 'Events', icon: Layers, color: 'text-blue-400' },
    { id: 'financial' as LayerMode, label: 'Financieel', icon: DollarSign, color: 'text-green-400' },
    { id: 'occupancy' as LayerMode, label: 'Bezetting', icon: BarChart3, color: 'text-orange-400' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 uppercase font-medium mr-2">Laag:</span>
      {layers.map(layer => {
        const Icon = layer.icon;
        return (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all',
              activeLayer === layer.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', activeLayer === layer.id && layer.color)} />
            {layer.label}
          </button>
        );
      })}
    </div>
  );
};
