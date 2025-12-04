import React, { useState, useEffect } from 'react';
import { Calendar, Layers, DollarSign, Users, Search, X, Star, Coffee, Heart, Sparkles } from 'lucide-react';
import { cn } from '../../../../utils';
import { useConfigStore } from '../../../../store/configStore';
import type { EventType } from '../../../../types';

interface TemplatesSidebarProps {
  onTemplateSelect: (template: EventTemplate) => void;
  onClose: () => void;
}

interface EventTemplate {
  id: string;
  name: string;
  type: EventType;
  icon: any;
  color: string;
  defaultTime: string;
  defaultCapacity: number;
  defaultPrice: number;
}

// Icon mapping for event types
const EVENT_TYPE_ICONS: Record<string, any> = {
  'weekday': Calendar,
  'weekend': Star,
  'matinee': Coffee,
  'care_heroes': Heart,
  'special_event': Sparkles,
  'default': Calendar
};

// Color mapping for event types
const EVENT_TYPE_COLORS: Record<string, string> = {
  'weekday': 'text-blue-400',
  'weekend': 'text-[#d4af37]',
  'matinee': 'text-orange-400',
  'care_heroes': 'text-pink-400',
  'special_event': 'text-purple-400',
  'default': 'text-slate-400'
};

export const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({ onTemplateSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { pricing } = useConfigStore();
  const [templates, setTemplates] = useState<EventTemplate[]>([]);

  // Generate templates from config
  useEffect(() => {
    if (!pricing) return;

    const generatedTemplates: EventTemplate[] = [];
    
    // Get event types from pricing config
    const pricingConfig = pricing.byDayType || {};
    
    Object.entries(pricingConfig).forEach(([typeKey, typeConfig]: [string, any]) => {
      const pricing = typeConfig || { standaard: 59.50, premium: 74.50 };
      
      const displayName = typeKey.charAt(0).toUpperCase() + typeKey.slice(1).replace('_', ' ');
      
      generatedTemplates.push({
        id: typeKey,
        name: displayName,
        type: typeKey,
        icon: EVENT_TYPE_ICONS[typeKey] || EVENT_TYPE_ICONS.default,
        color: EVENT_TYPE_COLORS[typeKey] || EVENT_TYPE_COLORS.default,
        defaultTime: '19:30',
        defaultCapacity: 100,
        defaultPrice: pricing.standaard
      });
    });

    setTemplates(generatedTemplates);
  }, [pricing]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Event Templates</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Zoek templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              className={cn(
                'w-full p-4 bg-slate-900 border border-slate-700 rounded-lg text-left',
                'hover:border-slate-600 hover:bg-slate-800 transition-all',
                'cursor-grab active:cursor-grabbing'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 bg-slate-800 rounded-lg', template.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white mb-1">{template.name}</div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>⏰ {template.defaultTime}</div>
                    <div>👥 {template.defaultCapacity} personen</div>
                    <div>💰 €{template.defaultPrice}</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create Custom */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => onTemplateSelect({
            id: 'custom',
            name: 'Custom Event',
            type: templates[0]?.type || 'weekday',
            icon: Calendar,
            color: 'text-slate-400',
            defaultTime: '19:30',
            defaultCapacity: 100,
            defaultPrice: 59.50
          })}
          className="w-full py-3 bg-[#d4af37] hover:bg-[#c19b2f] text-slate-900 font-bold rounded-lg transition-colors"
        >
          + Nieuw Custom Event
        </button>
      </div>
    </div>
  );
};

export type { EventTemplate };
