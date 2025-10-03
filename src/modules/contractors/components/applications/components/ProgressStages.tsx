/**
 * Progress Stages Component
 * Displays detailed onboarding stage breakdown
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  completed: boolean;
  required?: boolean;
}

interface ProgressStagesProps {
  stages: Stage[];
  maxVisible?: number;
}

export function ProgressStages({ stages, maxVisible = 3 }: ProgressStagesProps) {
  const visibleStages = stages.slice(0, maxVisible);
  const remainingCount = stages.length - maxVisible;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Onboarding Stages</h4>
      <div className="space-y-2">
        {visibleStages.map((stage) => (
          <div key={stage.id} className="flex items-center space-x-3">
            {stage.completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={`text-sm ${
              stage.completed ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {stage.name}
            </span>
            {stage.required && !stage.completed && (
              <span className="text-xs text-red-500">Required</span>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 ml-7">
            +{remainingCount} more stages
          </div>
        )}
      </div>
    </div>
  );
}