import { Check } from 'lucide-react';
import { STEPS } from './steps';

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-6">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive    = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive    ? 'bg-blue-900 text-white ring-4 ring-blue-100 shadow-md' :
                isCompleted ? 'bg-green-500 text-white' :
                              'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-colors duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex mt-2">
        {STEPS.map(step => {
          const isActive    = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex-1 text-center">
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-900' : isCompleted ? 'text-green-800' : 'text-slate-400'
              }`}>{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
