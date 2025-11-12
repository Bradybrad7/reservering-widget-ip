import { memo, useMemo } from 'react';
import { Calendar, Users, Package, ShoppingBag, FileText, CheckCircle } from 'lucide-react';
import { cn } from '../utils';
import type { StepKey } from '../types';
import { useReservationStore } from '../store/reservationStore';

export interface Step {
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

interface StepIndicatorProps {
  currentStep: StepKey;
  selectedEvent: boolean;
  className?: string;
}

/**
 * StepIndicator Component
 * 
 * Displays progress through the reservation flow with:
 * - Visual indicators for each step
 * - Progress bars between steps
 * - Accessible keyboard navigation
 * - Dark mode optimized styling
 */
export const StepIndicator = memo<StepIndicatorProps>(({
  currentStep,
  selectedEvent,
  className
}) => {
  const { wizardConfig } = useReservationStore();

  // Generate steps based on wizard configuration
  const steps: Step[] = useMemo(() => {
    // ✨ UPDATED: Nieuwe wizard flow met merchandise + contact + details stappen
    const allSteps: Array<{ key: StepKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
      { key: 'calendar', label: 'Datum', icon: Calendar },
      { key: 'persons', label: 'Personen', icon: Users },
      { key: 'package', label: 'Pakket', icon: Package },
      { key: 'merchandise', label: 'Merchandise', icon: ShoppingBag },
      { key: 'contact', label: 'Contact', icon: Users },
      { key: 'details', label: 'Details', icon: FileText },
      { key: 'summary', label: 'Bevestigen', icon: CheckCircle }
    ];

    const currentStepIndex = allSteps.findIndex(s => s.key === currentStep);

    return allSteps
      .filter(s => {
        const wizardStep = wizardConfig.steps.find(ws => ws.key === s.key);
        return wizardStep?.enabled !== false;
      })
      .map((s, idx) => ({
        ...s,
        completed: idx < currentStepIndex
      }));
  }, [currentStep, wizardConfig, selectedEvent]);

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className={cn('mb-6 animate-fade-in', className)}>
      <nav
        aria-label="Reserveringsproces"
        className="card-theatre rounded-3xl shadow-lifted border border-gold-400/20 p-4 md:p-6"
      >
        <ol className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCurrentStep = currentStep === step.key;
            const isCompleted = step.completed;
            const isPast = index < currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <React.Fragment key={step.key}>
                <li className="flex flex-col items-center space-y-1.5 transition-smooth group flex-shrink-0">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 relative',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950',
                      {
                        // Current step - VERSTERKT: solide gouden cirkel met extra glow
                        'bg-gold-gradient shadow-gold-glow scale-115 ring-4 ring-gold-400/40 border-2 border-gold-300': isCurrentStep,
                        // Completed steps - solid gold met check icon
                        'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/20': isCompleted && !isCurrentStep,
                        // Past steps
                        'bg-gradient-to-br from-gold-600/80 to-gold-700/80': isPast && !isCompleted,
                        // Upcoming steps - muted
                        'bg-dark-800/50 border-2 border-dark-700 group-hover:bg-dark-800 group-hover:border-dark-600': isUpcoming
                      }
                    )}
                    role="img"
                    aria-label={`${step.label}${isCurrentStep ? ' - Huidige stap' : ''}${isCompleted ? ' - Voltooid' : ''}`}
                  >
                    {/* Animated glow for current step */}
                    {isCurrentStep && (
                      <div className="absolute inset-0 rounded-2xl bg-gold-400 opacity-30 animate-pulse-gold" />
                    )}

                    {/* Icon or checkmark */}
                    {isCompleted && !isCurrentStep ? (
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 relative z-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <Icon
                        className={cn('w-5 h-5 md:w-6 md:h-6 relative z-10', {
                          'text-white': isCurrentStep || isCompleted || isPast,
                          'text-dark-500': isUpcoming
                        })}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'text-xs font-bold transition-all duration-300 text-center whitespace-nowrap',
                      {
                        'text-gold-300 scale-110 text-shadow-gold drop-shadow-lg': isCurrentStep,
                        'text-green-400': isCompleted && !isCurrentStep,
                        'text-dark-200': isPast && !isCompleted,
                        'text-dark-500 group-hover:text-dark-400': isUpcoming
                      }
                    )}
                  >
                    {step.label}
                  </span>
                </li>

                {/* Progress Bar */}
                {index < steps.length - 1 && (
                  <div
                    className="flex-1 mx-1.5 md:mx-3 min-w-[30px] md:min-w-[50px]"
                    aria-hidden="true"
                  >
                    <div className="h-1 bg-dark-800/50 rounded-full overflow-hidden shadow-inner-dark">
                      <div
                        className={cn(
                          'h-full bg-gold-gradient transition-all duration-500 ease-out rounded-full',
                          {
                            'w-full shadow-gold': steps[index + 1].completed || currentStep === steps[index + 1].key,
                            'w-0': !steps[index + 1].completed && currentStep !== steps[index + 1].key
                          }
                        )}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';
