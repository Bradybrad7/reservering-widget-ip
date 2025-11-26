/**
 * CustomerCard Component
 * 
 * Optimized customer card with React.memo for list rendering performance
 * Prevents unnecessary re-renders when other customers change
 */

import React from 'react';
import { Users, Mail, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../../../utils';
import type { CustomerProfile } from '../../../types';

interface CustomerLevel {
  level: 'Gold' | 'Silver' | 'Bronze';
  icon: string;
  threshold: number;
}

interface CustomerCardProps {
  customer: CustomerProfile;
  onSelect: (customer: CustomerProfile) => void;
}

// Customer level calculation (Gold > €5000, Silver > €2000, Bronze < €2000)
const getCustomerLevel = (totalSpent: number): CustomerLevel => {
  if (totalSpent >= 5000) {
    return { level: 'Gold', icon: '👑', threshold: 5000 };
  } else if (totalSpent >= 2000) {
    return { level: 'Silver', icon: '⭐', threshold: 2000 };
  } else {
    return { level: 'Bronze', icon: '🥉', threshold: 0 };
  }
};

export const CustomerCard = React.memo<CustomerCardProps>(({ customer, onSelect }) => {
  const level = getCustomerLevel(customer.totalSpent);

  return (
    <div
      onClick={() => onSelect(customer)}
      className="group relative bg-gradient-to-br from-neutral-800/80 to-neutral-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-neutral-700 hover:border-gold-500/50 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-gold-500/10"
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 to-gold-500/0 group-hover:from-gold-500/5 group-hover:to-transparent rounded-xl transition-all duration-200" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Company name */}
            <h3 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
              {customer.companyName}
            </h3>
            
            {/* Level badge */}
            <span className={cn(
              'px-3 py-1 rounded-lg font-bold text-sm shadow-lg flex items-center gap-1.5',
              level.level === 'Gold' && 'bg-gradient-to-br from-gold-500 to-gold-600 text-white',
              level.level === 'Silver' && 'bg-gradient-to-br from-neutral-400 to-neutral-500 text-white',
              level.level === 'Bronze' && 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
            )}>
              <span>{level.icon}</span>
              <span>{level.level}</span>
            </span>
            
            {/* Tags */}
            {customer.tags.map(tag => {
              const tagId = typeof tag === 'string' ? tag : 
                (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
              return (
                <span
                  key={tagId}
                  className="px-3 py-1 bg-gradient-to-br from-gold-500/20 to-gold-600/10 text-gold-400 rounded-lg text-xs font-semibold border border-gold-500/30"
                >
                  {tagId}
                </span>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-neutral-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <span>{customer.contactPerson}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neutral-500" />
              <span className="font-semibold">{formatCurrency(customer.totalSpent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>
                {customer.lastBooking 
                  ? formatDate(customer.lastBooking)
                  : 'Geen boekingen'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {customer.totalBookings}
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              {customer.totalBookings === 1 ? 'boeking' : 'boekingen'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CustomerCard.displayName = 'CustomerCard';
