
import { AlertCircle } from 'lucide-react';

// TODO: Email reminders feature not yet implemented
export const EmailRemindersConfig: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Email Reminders - In Ontwikkeling
          </h2>
          <p className="text-neutral-300 mb-4">
            Deze feature is nog niet volledig geïmplementeerd.
          </p>
          <p className="text-sm text-neutral-400">
            Automatische email herinneringen kunnen binnenkort worden geconfigureerd.
          </p>
        </div>
      </div>
    </div>
  );
};
