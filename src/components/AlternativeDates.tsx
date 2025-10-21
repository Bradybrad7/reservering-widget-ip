import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Event } from '../types';
import { useReservationStore } from '../store/reservationStore';

interface AlternativeDatesProps {
  currentEvent: Event;
  onSelectAlternative: (event: Event) => void;
}

export const AlternativeDates: React.FC<AlternativeDatesProps> = ({
  currentEvent,
  onSelectAlternative,
}) => {
  const { events, formData } = useReservationStore();
  const requestedPersons = formData.numberOfPersons || 1;

  // ✅ IMPROVED: Intelligente alternatieve datums suggestie
  const findAlternatives = () => {
    const currentDayOfWeek = currentEvent.date.getDay();
    const currentMonth = currentEvent.date.getMonth();
    const today = new Date();

    return events
      .filter(e => {
        // Not the current event
        if (e.id === currentEvent.id) return false;
        
        // Must be active
        if (!e.isActive) return false;
        
        // Must be in the future
        if (e.date < today) return false;
        
        // Must have enough capacity for requested persons
        if ((e.remainingCapacity || 0) < requestedPersons) return false;
        
        return true;
      })
      .map(e => {
        let score = 0;
        
        // 🎯 Priority 1: Same event type (highest weight)
        if (e.type === currentEvent.type) score += 100;
        
        // 🎯 Priority 2: Same day of week (e.g., both Fridays)
        if (e.date.getDay() === currentDayOfWeek) score += 50;
        
        // 🎯 Priority 3: Same month
        if (e.date.getMonth() === currentMonth) score += 30;
        
        // 🎯 Priority 4: Same time
        if (e.startsAt === currentEvent.startsAt) score += 20;
        
        // 🎯 Priority 5: More available capacity (prefer more space)
        const capacityRatio = (e.remainingCapacity || 0) / e.capacity;
        score += capacityRatio * 10;
        
        // 🎯 Priority 6: Closer in time (prefer sooner than later)
        const daysDiff = Math.abs(
          (e.date.getTime() - currentEvent.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 7) score += 15;
        else if (daysDiff <= 14) score += 10;
        else if (daysDiff <= 30) score += 5;
        
        // Penalty for being too far in the future (> 60 days)
        if (daysDiff > 60) score -= 20;
        
        return { event: e, score, daysDiff };
      })
      .sort((a, b) => {
        // Sort by score first (higher is better)
        if (b.score !== a.score) return b.score - a.score;
        // If same score, prefer closer dates
        return a.daysDiff - b.daysDiff;
      })
      .slice(0, 3) // Top 3 alternatives
      .map(item => item.event);
  };

  const alternatives = findAlternatives();

  if (alternatives.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-6 bg-neutral-800/50 backdrop-blur-sm border border-gold-500/20 rounded-xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">💡</div>
        <div>
          <h4 className="font-semibold text-white mb-1">
            Alternatieve datums beschikbaar
          </h4>
          <p className="text-sm text-neutral-200">
            Deze data zijn vergelijkbaar en hebben nog plaats beschikbaar
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alternatives.map(alt => {
          const daysDiff = Math.round(
            (alt.date.getTime() - currentEvent.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          const diffText = daysDiff === 0 
            ? 'Zelfde dag' 
            : daysDiff > 0 
            ? `${daysDiff} ${daysDiff === 1 ? 'dag' : 'dagen'} later`
            : `${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'dag' : 'dagen'} eerder`;

          return (
            <button
              key={alt.id}
              onClick={() => onSelectAlternative(alt)}
              className="w-full text-left p-4 bg-dark-800 rounded-lg border border-gold-500/20 hover:border-primary-500/30 hover:shadow-gold transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-white group-hover:text-gold-500 transition-colors">
                    {format(alt.date, 'EEEE d MMMM yyyy', { locale: nl })}
                  </p>
                  <p className="text-sm text-neutral-200 mt-1">
                    {diffText} • Aanvang: {alt.startsAt}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-500 bg-success-500/10 border border-success-500/20 px-2 py-1 rounded">
                      <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse-gold"></span>
                      {alt.remainingCapacity} plaatsen
                    </span>
                    {alt.type === 'MATINEE' && (
                      <span className="text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded">
                        🌅 Matinee
                      </span>
                    )}
                    {alt.type === 'CARE_HEROES' && (
                      <span className="text-xs font-medium text-info-400 bg-info-500/10 border border-info-500/20 px-2 py-1 rounded">
                        ❤️ Zorghelden
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 text-gold-500 group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-dark-200 text-center">
        Klik op een datum om deze te selecteren
      </p>
    </div>
  );
};

export default AlternativeDates;
