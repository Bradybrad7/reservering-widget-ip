import React from 'react';
import { AlertCircle } from 'lucide-react';

// TODO: This feature is not yet implemented
// Arrangements are currently hardcoded as BWF and BWFM
export const ArrangementsManagerNew: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Arrangements Manager - In Ontwikkeling
          </h2>
          <p className="text-neutral-300 mb-4">
            Deze feature is nog niet volledig geïmplementeerd.
          </p>
          <p className="text-sm text-neutral-400">
            Op dit moment zijn de arrangements (BWF en BWFM) hardcoded in de configuratie.
            Gebruik de <strong>Configuratie</strong> sectie om prijzen aan te passen.
          </p>
        </div>
      </div>
    </div>
  );
};
