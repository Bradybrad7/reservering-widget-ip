/**
 * FocusWidget - "Attention Required" Dashboard Widget
 */

import React from 'react';
import { AlertCircle, Clock, DollarSign, Users } from 'lucide-react';
import { cn } from '../../../../utils';

interface FocusItem {
  id: string;
  type: 'pending' | 'payment' | 'waitlist' | 'expiring';
  count: number;
  message: string;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
}

interface FocusWidgetProps {
  items: FocusItem[];
}

const ICON_MAP = {
  pending: Clock,
  payment: DollarSign,
  waitlist: Users,
  expiring: AlertCircle
};

const COLOR_MAP = {
  high: 'bg-red-500/10 border-red-500/20 text-red-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  low: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
};

export const FocusWidget: React.FC<FocusWidgetProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-white">Aandacht Vereist</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map(item => {
          const Icon = ICON_MAP[item.type];
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                'p-3 rounded-lg border text-left transition-all hover:scale-105',
                COLOR_MAP[item.priority]
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                <span className="text-2xl font-bold">{item.count}</span>
              </div>
              <p className="text-xs">{item.message}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};


