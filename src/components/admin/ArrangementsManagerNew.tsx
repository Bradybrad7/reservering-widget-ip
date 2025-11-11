/**
 * ArrangementsManagerNew - Arrangements Beheer
 * 
 * Toont overzicht van beschikbare arrangements met hun codes en beschrijvingen.
 * Prijzen worden beheerd via Configuratie → Prijzen.
 */

import React from 'react';
import { BookOpen, DollarSign } from 'lucide-react';

export const ArrangementsManagerNew: React.FC = () => {
  const arrangements = [
    {
      code: 'BWF',
      name: 'Basis Winterfeest',
      description: '3-gangen menu met water en koffie'
    },
    {
      code: 'BWFM',
      name: 'Basis Winterfeest Met Drank',
      description: '3-gangen menu met frisdrank, wijnen, bier, water en koffie'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">ℹ️ Informatie</h4>
        <p className="text-sm text-neutral-300">
          Arrangementen zijn voorgedefinieerd in het systeem. Prijzen per arrangement worden ingesteld bij <strong>Instellingen → Prijzen</strong>.
        </p>
      </div>

      {/* Arrangements List */}
      <div className="grid gap-4">
        {arrangements.map((arrangement) => (
          <div
            key={arrangement.code}
            className="bg-neutral-800/50 rounded-lg p-6 border-2 border-gold-500/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-gold-400" />
                  <h3 className="text-xl font-semibold text-white">{arrangement.name}</h3>
                  <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
                    {arrangement.code}
                  </span>
                </div>
                <p className="text-neutral-300 ml-9">{arrangement.description}</p>
              </div>

              <div className="flex items-center gap-2 text-neutral-400">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Zie prijzen</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
