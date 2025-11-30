import React, { memo, useMemo } from 'react';
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
    <div className={cn('mb-8 animate-fade-in', className)}>
      <nav
        aria-label="Reserveringsproces"
        className="bg-dark-900/20 backdrop-blur-sm rounded-2xl border border-gold-400/10 p-3"
      >
        <ol className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCurrentStep = currentStep === step.key;
            const isCompleted = step.completed;
            const isPast = index < currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <React.Fragment key={step.key}>
                <li className="flex flex-col items-center space-y-1 transition-smooth group flex-shrink-0">
                  {/* Step Circle - SMALLER */}
                  <div
                    className={cn(
                      'w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center font-bold transition-all duration-300 relative',
                      {
                        // Current step - subtle glow
                        'bg-gold-gradient shadow-gold scale-105 ring-2 ring-gold-400/30': isCurrentStep,
                        // Completed steps
                        'bg-green-500/80': isCompleted && !isCurrentStep,
                        // Past steps
                        'bg-gold-600/60': isPast && !isCompleted,
                        // Upcoming steps - VERY muted
                        'bg-dark-800/30 border border-dark-700/50': isUpcoming
                      }
                    )}
                    role="img"
                    aria-label={`${step.label}${isCurrentStep ? ' - Huidige stap' : ''}${isCompleted ? ' - Voltooid' : ''}`}
                  >
                    {/* Icon or checkmark */}
                    {isCompleted && !isCurrentStep ? (
                      <svg
                        className="w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 text-white"
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
                        className={cn('w-3.5 h-3.5 md:w-4 md:h-4 relative z-10', {
                          'text-white': isCurrentStep || isCompleted || isPast,
                          'text-dark-600': isUpcoming
                        })}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Step Label - SMALLER and MORE SUBTLE */}
                  <span
                    className={cn(
                      'text-[10px] md:text-xs font-medium transition-all duration-300 text-center whitespace-nowrap',
                      {
                        'text-gold-300': isCurrentStep,
                        'text-green-400/70': isCompleted && !isCurrentStep,
                        'text-dark-300/70': isPast && !isCompleted,
                        'text-dark-600': isUpcoming
                      }
                    )}
                  >
                    {step.label}
                  </span>
                </li>

                {/* Progress Bar - THINNER */}
                {index < steps.length - 1 && (
                  <div
                    className="flex-1 mx-1 md:mx-2 min-w-[20px] md:min-w-[40px]"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 bg-dark-800/30 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full bg-gold-gradient/60 transition-all duration-500 ease-out rounded-full',
                          {
                            'w-full': steps[index + 1].completed || currentStep === steps[index + 1].key,
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
