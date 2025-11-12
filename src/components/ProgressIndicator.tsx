

interface ProgressIndicatorProps {
  currentStep: 'calendar' | 'extras' | 'form' | 'summary' | 'success';
}

const steps = [
  { key: 'calendar', label: 'Datum', icon: '📅' },
  { key: 'extras', label: 'Extras', icon: '🍷' },
  { key: 'form', label: 'Gegevens', icon: '📝' },
  { key: 'summary', label: 'Overzicht', icon: '✓' },
];

const getStepIndex = (step: string): number => {
  return steps.findIndex(s => s.key === step);
};

const getProgressPercentage = (step: string): number => {
  const stepMap: Record<string, number> = {
    calendar: 25,
    extras: 50,
    form: 75,
    summary: 90,
    success: 100,
  };
  return stepMap[step] || 0;
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const currentStepIndex = getStepIndex(currentStep);
  const progress = getProgressPercentage(currentStep);

  if (currentStep === 'success') {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🎉</span>
          <span className="text-lg font-semibold text-green-600">Reservering Voltooid!</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-300">Voortgang</span>
          <span className="font-semibold text-primary-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    transition-all duration-300 mb-2
                    ${isCompleted ? 'bg-green-500 text-white scale-110' : ''}
                    ${isCurrent ? 'bg-gold-500 text-white scale-125 shadow-lg ring-4 ring-gold-200' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                
                {/* Step Label - Hidden on mobile, shown on tablet+ */}
                <div
                  className={`
                    text-xs font-medium text-center transition-all duration-300
                    hidden md:block
                    ${isCompleted ? 'text-green-600' : ''}
                    ${isCurrent ? 'text-primary-500 font-semibold' : ''}
                    ${isUpcoming ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-8">
                  <div
                    className={`
                      h-full transition-all duration-500
                      ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
